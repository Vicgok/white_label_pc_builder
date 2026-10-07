"""Render the existing GLB to mobile hero frames; never export or rebuild it.

blender --background --python scripts/render-mobile-hero.py
Blender 5.2+ (native WebP). -- --preview renders PNG endpoints outside public.
"""
import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/assets/3d/rigpilot-demo-pc.glb'
MANIFEST = ROOT / 'public/assets/3d/rigpilot-demo-pc.manifest.json'
OUTPUT = ROOT / 'public/assets/hero/mobile-pc'
PREVIEW = ROOT / 'artifacts/mobile-hero'
cache = PREVIEW / 'optix-cache'
cache.mkdir(parents=True, exist_ok=True)
os.environ['OPTIX_CACHE_PATH'] = str(cache)
parser = argparse.ArgumentParser()
parser.add_argument('--preview', action='store_true')
parser.add_argument('--samples', type=int, default=64)
parser.add_argument('--cpu', action='store_true')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
frame_count, width, height = 24, 720, 900
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))

# Parent-local glTF offsets: +Y up, -X glass side, -Z front.
# Blender's importer converts these to (X, -Z, Y). One restrained timeline.
stages = {
    'Case_SideGlass': dict(start=.04, end=.24, offset=[-.145, 0, .025]),
    'Case_FrontGlass': dict(start=.15, end=.34, factor=.30),
    'Case_TopPanel': dict(start=.20, end=.37, factor=.45),
    'Case_RearPanel': dict(start=.23, end=.38, factor=.10),
    'GPU': dict(start=.34, end=.58, factor=.48),
    'Motherboard': dict(start=.46, end=.70, factor=.22),
    'AIO_Radiator': dict(start=.55, end=.78, factor=.35),
    'AIO_Fan_01': dict(start=.55, end=.78, factor=.35),
    'AIO_Fan_02': dict(start=.55, end=.78, factor=.35),
    'AIO_Fan_03': dict(start=.55, end=.78, factor=.35),
    'AIO_Pump': dict(start=.55, end=.78, factor=.12, followsBoard=True),
    'RAM_01': dict(start=.65, end=.85, offset=[-.012, .018, 0], followsBoard=True),
    'RAM_02': dict(start=.65, end=.85, offset=[-.012, .018, 0], followsBoard=True),
    'PSU': dict(start=.74, end=.86, factor=.12),
    'SSD_M2': dict(start=.75, end=.87, factor=.10, followsBoard=True),
}


def smooth(progress, start, end):
    t = max(0, min(1, (progress - start) / (end - start)))
    return t * t * (3 - 2 * t)


def blender_vector(value):
    return Vector((value[0], -value[2], value[1]))


bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
objects = {name: bpy.data.objects[name] for name in manifest['parts'] if name in bpy.data.objects}
installed = {name: obj.location.copy() for name, obj in objects.items()}
assert all(name in objects for name in stages)

# Clear panes: transparent surface with a restrained glossy reflection layer.
# No refraction, normal maps, fog, or edits to source/other component materials.
glass = bpy.data.materials['TemperedGlass_Smoke']
nodes = glass.node_tree.nodes
nodes.clear()
out = nodes.new('ShaderNodeOutputMaterial')
transparent = nodes.new('ShaderNodeBsdfTransparent')
transparent.inputs['Color'].default_value = (.985, .99, .995, 1)
gloss = nodes.new('ShaderNodeBsdfPrincipled')
gloss.inputs['Base Color'].default_value = (.10, .12, .14, 1)
gloss.inputs['Roughness'].default_value = .018
gloss.inputs['Metallic'].default_value = 0
gloss.inputs['Coat Weight'].default_value = .4
gloss.inputs['Coat Roughness'].default_value = .015
mix = nodes.new('ShaderNodeMixShader')
mix.inputs[0].default_value = .085
links = glass.node_tree.links
links.new(transparent.outputs[0], mix.inputs[1])
links.new(gloss.outputs[0], mix.inputs[2])
links.new(mix.outputs[0], out.inputs['Surface'])

# Clone only tube meshes for restrained endpoint deformation in these renders.
tubes = []
for name in ('AIO_Tube_A', 'AIO_Tube_B'):
    obj = objects[name]
    obj.data = obj.data.copy()
    original = [v.co.copy() for v in obj.data.vertices]
    weights = [smooth((obj.matrix_world @ v.co).y, -.08, .175) for v in obj.data.vertices]
    tubes.append((obj, original, weights))


def pose(progress):
    board = stages['Motherboard']
    board_delta = blender_vector(manifest['parts']['Motherboard']['explodedOffset']) * board['factor'] * smooth(progress, board['start'], board['end'])
    for name, obj in objects.items():
        obj.location = installed[name]
        stage = stages.get(name)
        if not stage:
            continue
        offset = stage.get('offset', manifest['parts'][name]['explodedOffset'])
        obj.location += blender_vector(offset) * stage.get('factor', 1) * smooth(progress, stage['start'], stage['end'])
        if stage.get('followsBoard'):
            obj.location += board_delta
    for name in manifest.get('cableObjects', []):
        if name in bpy.data.objects:
            bpy.data.objects[name].hide_render = progress > stages['GPU']['start']
    pump = objects['AIO_Pump'].location - installed['AIO_Pump']
    radiator = objects['AIO_Radiator'].location - installed['AIO_Radiator']
    for obj, vertices, weights in tubes:
        for vertex, original, weight in zip(obj.data.vertices, vertices, weights):
            vertex.co = original + pump * (1 - weight) + radiator * weight
        obj.data.update()
    bpy.context.view_layer.update()


scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = args.samples
scene.cycles.use_denoising = True
scene.cycles.seed = 42
scene.cycles.transparent_max_bounces = 12
if not args.cpu:
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'OPTIX'
        prefs.get_devices()
        for device in prefs.devices:
            device.use = device.type == 'OPTIX'
        if any(device.use for device in prefs.devices):
            scene.cycles.device = 'GPU'
    except Exception as error:
        print('GPU unavailable, using CPU:', error)
scene.render.resolution_x, scene.render.resolution_y = width, height
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.quality = 86
scene.view_settings.view_transform = 'AgX'
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.65, .68, .72, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .35

target = Vector((-.06, 0, .28))
for name, position, power, size in [
    ('Mobile_Key', (-.8, .8, 1.05), 18, .75),
    ('Mobile_Fill', (-.45, 1.1, .45), 6, .80),
    ('Mobile_Rim', (.6, -.6, .95), 18, .60),
]:
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.shape, data.size = power, 'DISK', size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (target - obj.location).to_track_quat('-Z', 'Y').to_euler()

bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.004))
floor = bpy.context.object
floor.name = 'Mobile_ShadowCatcher'
floor.is_shadow_catcher = True
camera_data = bpy.data.cameras.new('Mobile_StudioCamera')
camera = bpy.data.objects.new('Mobile_StudioCamera', camera_data)
scene.collection.objects.link(camera)
camera.location = (-.86, 1.02, .72)
camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera_data.type = 'ORTHO'
camera_data.ortho_scale = .82
scene.camera = camera

# Fit the union of all 24 poses once: one camera, no cropped panes at any stage.
model_meshes = [obj for obj in bpy.data.objects['RigPilot_PC'].children_recursive if obj.type == 'MESH']
projected = []
for number in range(frame_count):
    pose(number / (frame_count - 1))
    for obj in model_meshes:
        if not obj.hide_render:
            projected.extend(world_to_camera_view(scene, camera, obj.matrix_world @ Vector(corner)) for corner in obj.bound_box)
min_x, max_x = min(v.x for v in projected), max(v.x for v in projected)
min_y, max_y = min(v.y for v in projected), max(v.y for v in projected)
camera_basis = camera.rotation_euler.to_quaternion()
camera.location += camera_basis @ Vector(((min_x + max_x - 1) * .5 * camera_data.ortho_scale * width / height,
                                          (min_y + max_y - 1) * .5 * camera_data.ortho_scale, 0))
camera_data.ortho_scale *= max(max_x - min_x, max_y - min_y) / .86
bpy.context.view_layer.update()
print('MOBILE_CAMERA_SCALE', camera_data.ortho_scale, flush=True)

if args.preview:
    PREVIEW.mkdir(parents=True, exist_ok=True)
    scene.render.image_settings.file_format = 'PNG'
    for number, progress in [(1, 0), (frame_count, 1)]:
        pose(progress)
        scene.render.filepath = str(PREVIEW / f'frame-{number:02}.png')
        bpy.ops.render.render(write_still=True)
else:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    raw = PREVIEW / 'raw'
    raw.mkdir(parents=True, exist_ok=True)
    # Translucent glass + shadow alpha costs more than the color image. Composite
    # display-space pixels over the exact page color, then encode RGB WebP.
    # Temporary lossless renders stay outside public; no double-lossy encoding.
    encoding = bpy.data.scenes.new('Mobile_WebpEncoding')
    encoding.view_settings.view_transform = 'Standard'
    encoding.render.image_settings.file_format = 'WEBP'
    encoding.render.image_settings.color_mode = 'RGB'
    encoding.render.image_settings.quality = 88
    scene.render.image_settings.file_format = 'PNG'
    background = np.array([247 / 255, 247 / 255, 245 / 255], dtype=np.float32)
    filenames = []
    for number in range(1, frame_count + 1):
        pose((number - 1) / (frame_count - 1))
        filename = f'frame-{number:02}.webp'
        raw_path = raw / f'frame-{number:02}.png'
        scene.render.filepath = str(raw_path)
        bpy.ops.render.render(write_still=True)
        image = bpy.data.images.load(str(raw_path))
        pixels = np.empty(width * height * 4, dtype=np.float32)
        image.pixels.foreach_get(pixels)
        pixels = pixels.reshape((-1, 4))
        pixels[:, :3] = pixels[:, :3] * pixels[:, 3:4] + background * (1 - pixels[:, 3:4])
        pixels[:, 3] = 1
        flat = bpy.data.images.new('Mobile_FlatFrame', width=width, height=height, alpha=False, float_buffer=False)
        flat.pixels.foreach_set(pixels.ravel())
        flat.save_render(str(OUTPUT / filename), scene=encoding)
        bpy.data.images.remove(flat)
        bpy.data.images.remove(image)
        filenames.append(filename)
        print('MOBILE_FRAME', number, (OUTPUT / filename).stat().st_size, flush=True)
    total = sum((OUTPUT / filename).stat().st_size for filename in filenames)
    assert total <= 2.5 * 1024 * 1024, f'Frame payload too large: {total}'
    data = dict(version=1, frameCount=frame_count, width=width, height=height,
                format='webp', alpha=False, background='#F7F7F5', frames=filenames, totalBytes=total,
                source='/assets/3d/rigpilot-demo-pc.glb', sourceSha256=source_hash,
                blenderVersion=bpy.app.version_string, samples=args.samples,
                stages=stages)
    (OUTPUT / 'manifest.json').write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
    print('MOBILE_SEQUENCE_READY', total, flush=True)
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == source_hash
