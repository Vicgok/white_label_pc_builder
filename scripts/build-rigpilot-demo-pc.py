"""Deterministic reference-informed RigPilot Phase 1 asset. Run with Blender.

blender --background --python scripts/build-rigpilot-demo-pc.py -- --render
No downloaded models, manufacturer textures, add-ons, or Python packages required.
Authoring axes: X chamber width, Y rear-to-front, Z up; all dimensions in meters.
glTF axes: X width, Y up, Z front-to-rear (Blender Y becomes glTF -Z).
"""
import argparse
import json
import math
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/3d'
SOURCE = ROOT / 'assets-source/3d'
PREVIEW = ROOT / 'artifacts/rigpilot-3d'
ARGS = argparse.ArgumentParser()
ARGS.add_argument('--render', action='store_true', help='Render installed and open-panel QA views')
ARGS.add_argument('--save-blend', action='store_true', help='Save optional editable source outside public')
ARGS.add_argument('--samples', type=int, default=48)
OPTS = ARGS.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
OUT.mkdir(parents=True, exist_ok=True)
PREVIEW.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for data in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
    for item in list(data):
        if item.users == 0:
            data.remove(item)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1.0
scene.unit_settings.length_unit = 'METERS'


def material(name, color, roughness, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    p = mat.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Metallic'].default_value = metallic
    mat.diffuse_color = (*color, 1)
    return mat


STEEL = material('PowderCoat_Black', (.025, .029, .034), .66, .18)
EDGE = material('Graphite_Satin', (.053, .060, .071), .48, .38)
PLASTIC = material('Fan_Black_Polymer', (.023, .027, .032), .48)
BLADE = material('Blade_Satin_Black', (.038, .043, .050), .43)
PCB = material('PCB_Charcoal', (.017, .023, .024), .78)
HEATSINK = material('Anodized_Graphite', (.070, .079, .095), .48, .66)
ALUMINUM = material('Brushed_Nickel', (.24, .26, .28), .43, .80)
DARK = material('Connector_Black', (.010, .012, .014), .75)
RUBBER = material('Rubber_Braided_Hose', (.018, .022, .026), .82)
GOLD = material('Contact_Brass', (.32, .21, .08), .48, .75)
LABEL = material('Label_Charcoal', (.035, .039, .044), .84)
GLASS = material('TemperedGlass_Smoke', (.66, .71, .76), .025)
gp = GLASS.node_tree.nodes.get('Principled BSDF')
gp.inputs['Transmission Weight'].default_value = 1.0
gp.inputs['IOR'].default_value = 1.45
# Physical transmission, opaque alpha: no double-layer alpha sorting artifacts.
# Standard KHR_materials_transmission/ior exported by Blender, no decoder needed.
MATS = [STEEL, EDGE, PLASTIC, BLADE, PCB, HEATSINK, ALUMINUM, DARK, RUBBER, GOLD, LABEL, GLASS]
BOX_CACHE = {}


class Geo:
    """Batch primitives into a selectable part, with no per-screw scene nodes."""
    def __init__(self):
        self.v, self.f, self.mi, self.sm = [], [], [], []

    def add(self, vertices, faces, mat=STEEL, smooth=False):
        start = len(self.v)
        self.v.extend(tuple(v) for v in vertices)
        self.f.extend(tuple(start + i for i in f) for f in faces)
        self.mi.extend([MATS.index(mat)] * len(faces))
        self.sm.extend([smooth] * len(faces))

    def box(self, c, d, mat=STEEL, bevel=0, rot=None):
        key = (tuple(d), bevel)
        if key not in BOX_CACHE:
            bm = bmesh.new()
            bmesh.ops.create_cube(bm, size=1)
            for v in bm.verts:
                v.co = Vector((v.co.x*d[0], v.co.y*d[1], v.co.z*d[2]))
            if bevel:
                bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bevel, min(d)*.45), segments=3, affect='EDGES')
            bm.verts.ensure_lookup_table()
            bm.verts.index_update()
            BOX_CACHE[key] = ([tuple(v.co) for v in bm.verts], [tuple(v.index for v in f.verts) for f in bm.faces])
            bm.free()
        verts, faces = BOX_CACHE[key]
        m = rot if rot is not None else Matrix.Identity(3)
        self.add([m @ Vector(v) + Vector(c) for v in verts], faces, mat)

    def cyl(self, c, r, depth, mat=STEEL, axis=(0, 0, 1), n=48, r2=None):
        rotation = Vector((0, 0, 1)).rotation_difference(Vector(axis)).to_matrix()
        v = []
        for z, radius in ((-depth/2, r), (depth/2, r if r2 is None else r2)):
            for i in range(n):
                a = i*math.tau/n
                v.append(rotation @ Vector((radius*math.cos(a), radius*math.sin(a), z)) + Vector(c))
        self.add(v, [(i, (i+1)%n, (i+1)%n+n, i+n) for i in range(n)], mat, True)
        self.add(v, [tuple(reversed(range(n))), tuple(range(n, 2*n))], mat)

    def ring(self, c, outer, inner, depth, mat=STEEL, n=96, axis=(0, 0, 1), square=False):
        rotation = Vector((0, 0, 1)).rotation_difference(Vector(axis)).to_matrix()
        verts = []
        for z, r in ((-depth/2, outer), (-depth/2, inner), (depth/2, outer), (depth/2, inner)):
            for i in range(n):
                a = i*math.tau/n
                rr = r/max(abs(math.cos(a)), abs(math.sin(a))) if square and r == outer else r
                verts.append(rotation @ Vector((rr*math.cos(a), rr*math.sin(a), z)) + Vector(c))
        faces = []
        for i in range(n):
            j = (i+1)%n
            faces.extend([(i, j, j+2*n, i+2*n), (i+n, i+3*n, j+3*n, j+n),
                          (i+n, j+n, j, i), (i+2*n, j+2*n, j+3*n, i+3*n)])
        self.add(verts, faces, mat, not square)

    def rod(self, a, b, radius, mat=STEEL, n=12):
        a, b = Vector(a), Vector(b)
        self.cyl((a+b)/2, radius, (b-a).length, mat, b-a, n)

    def mesh(self, name, origin, parent, rotation=None):
        mesh = bpy.data.meshes.new(name + '_Geometry')
        mesh.from_pydata([Vector(v)-Vector(origin) for v in self.v], [], self.f)
        mesh.update()
        for m in MATS:
            mesh.materials.append(m)
        for poly, mi, sm in zip(mesh.polygons, self.mi, self.sm):
            poly.material_index, poly.use_smooth = mi, sm
        # Keep only used material slots (shared material datablocks across parts).
        used = sorted(set(self.mi))
        mapping = {old: new for new, old in enumerate(used)}
        mesh.materials.clear()
        for old in used:
            mesh.materials.append(MATS[old])
        for poly, mi in zip(mesh.polygons, self.mi):
            poly.material_index = mapping[mi]
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        obj.parent = parent
        obj.location = origin
        if rotation is not None:
            obj.rotation_mode = 'QUATERNION'
            obj.rotation_quaternion = rotation
        return obj


def group(name, parent=None):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    o.parent = parent
    return o


root = group('RigPilot_PC')
root['units'] = 'meters'
root['representation'] = 'Reference-informed Phase 1 visualization; not a manufacturing digital twin'
case = group('Case', root)
memory = group('Memory', root)
cooling = group('Cooling', root)
sidefans = group('SideFans', root)
bottomfans = group('BottomFans', root)
cabling = group('Cabling', root)
PARTS = {}
PRODUCTS = {
    'case': ('case-nzxt-h9-flow-2023', 'NZXT H9 Flow (2023), Black'),
    'motherboard': ('motherboard-gigabyte-b650-aorus-elite-ax-v2', 'Gigabyte B650 AORUS ELITE AX V2'),
    'gpu': ('gpu-gigabyte-rtx5070-windforce-oc-sff', 'Gigabyte GeForce RTX 5070 WINDFORCE OC SFF 12G'),
    'cooling': ('cooler-arctic-liquid-freezer-iii-pro-360', 'ARCTIC Liquid Freezer III Pro 360'),
    'memory': ('memory-gskill-flare-x5-32gb', 'G.Skill Flare X5 DDR5, 2 x 16GB, matte black'),
    'psu': ('psu-corsair-rm850e-850', 'Corsair RM850e, 850W'),
    'storage': ('storage-wd-black-1tb-m2', 'WD_BLACK 1TB M.2 NVMe; unspecified sub-model'),
    'case-fan': ('fan-black-120mm-representative', 'Representative black 120mm case airflow fan'),
}


def tag(obj, category, product, offset=(0, 0, 0), **extras):
    obj['category'] = category
    obj['productId'] = PRODUCTS[product][0]
    PARTS[obj.name] = dict(category=category, productId=PRODUCTS[product][0],
                           displayName=PRODUCTS[product][1], explodedOffset=list(offset), **extras)
    return obj


def tube(name, points, radius, mat, parent, resolution=12):
    curve = bpy.data.curves.new(name + '_Path', 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = resolution
    curve.bevel_depth = radius
    curve.bevel_resolution = 4
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points)-1)
    center = sum((Vector(p) for p in points), Vector())/len(points)
    for p, co in zip(spline.bezier_points, points):
        p.co = Vector(co)-center
        p.handle_left_type = p.handle_right_type = 'AUTO'
    o = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(o)
    o.location, o.parent = center, parent
    curve.materials.append(mat)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.convert(target='MESH')
    o.select_set(False)
    return o


def lattice(g, center, width, height, plane, pitch=.005, wire=.00065):
    """Real open steel mesh, not a black surface with painted vent dots."""
    # plane basis maps local u/v/depth to authoring world XYZ.
    basis = {'XY': Matrix.Identity(3),
             'YZ': Matrix(((0, 0, 1), (1, 0, 0), (0, 1, 0))),
             'XZ': Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))}[plane]
    for i in range(int(width/pitch)+1):
        u = -width/2 + i*pitch
        g.box(Vector(center)+basis @ Vector((u, 0, 0)), (wire, height, wire), STEEL, rot=basis)
    for j in range(int(height/pitch)+1):
        v = -height/2 + j*pitch
        g.box(Vector(center)+basis @ Vector((0, v, 0)), (width, wire, wire), STEEL, rot=basis)


# CASE: 290 x 466 x 495 mm including 21mm feet. Main chamber left,
# cable/PSU chamber right. Crucially no front-left metal corner pillar.
g = Geo()
for x in (-.127, .126):
    for y in (-.202, .202):
        g.box((x, y, .012), (.032, .040, .024), STEEL, .004)
        g.box((x, y, .0015), (.029, .036, .003), RUBBER, .001)
for z in (.037, .480):
    for x in (-.138, .138):
        g.box((x, 0, z), (.012, .466, .024), STEEL, .0014)
    for y in (-.227, .227):
        g.box((0, y, z), (.266, .012, .024), STEEL, .0014)
for x, y in ((-.137, -.227), (.137, -.227), (.137, .227)):
    g.box((x, y, .2585), (.013, .012, .419), STEEL, .0012)
# Secondary chamber front solid strip, not a third glass panel.
g.box((.092, .231, .258), (.102, .004, .421), STEEL, .0009)
# Bottom fan bracket is open.
for x in (-.118, .002):
    g.box((x, 0, .050), (.014, .405, .003), EDGE, .0005)
for y in (-.196, -.062, .062, .196):
    g.box((-.058, y, .050), (.134, .007, .003), STEEL, .0004)
lattice(g, (-.060, 0, .041), .144, .401, 'XY', .008, .0007)
# Motherboard tray, with real CPU cutout in the secondary side.
for y, z, dy, dz in ((-.205, .258, .040, .405), (-.014, .258, .071, .405),
                     (-.111, .124, .148, .137), (-.111, .417, .148, .087)):
    g.box((.042, y, z), (.0015, dy, dz), STEEL, .0004)
# Side mount extends forward from motherboard tray: 3 stacked fans.
for y in (.054, .180):
    g.box((.038, y, .257), (.003, .012, .380), EDGE, .0006)
for z in (.071, .194, .317, .440):
    g.box((.038, .117, z), (.003, .132, .009), EDGE, .0005)
# Cable bar between DIMMs and side fan stack, characteristic upright H9 bar.
g.box((.017, .033, .257), (.035, .018, .389), STEEL, .002)
g.box((-.002, .035, .257), (.002, .011, .373), EDGE, .0005)
# Top internal mounting rails.
for x in (-.118, .002):
    g.box((x, 0, .484), (.013, .418, .003), EDGE, .0004)
# Rear sheet with fan opening and I/O + seven PCIe openings.
g.box((.004, -.230, .076), (.267, .002, .052), STEEL, .0004)
g.box((-.128, -.230, .274), (.011, .002, .347), STEEL, .0004)
g.box((.027, -.230, .284), (.016, .002, .371), STEEL, .0004)
g.box((-.069, -.230, .454), (.118, .002, .029), STEEL, .0004)
g.box((-.056, -.230, .283), (.145, .002, .030), STEEL, .0004)
g.box((-.077, -.230, .126), (.097, .002, .022), STEEL, .0004)
# Seven slot rails; covers only on unused slots, GPU occupies slots 1-3.
for i in range(7):
    z = .238-i*.0203
    g.box((-.073, -.231, z), (.111, .002, .0025), EDGE, .0003)
    if i >= 3:
        for k in range(5):
            g.box((-.074, -.231, z-.009+k*.003), (.100, .0015, .0009), EDGE)
# Secondary rear: PSU aperture at midheight, grille above/below.
for z, dz in ((.142, .180), (.409, .112)):
    lattice(g, (.091, -.231, z), .091, dz, 'XZ', .007, .0008)
for x in (.047, .137):
    g.box((x, -.231, .290), (.005, .003, .160), EDGE, .0006)
# Simple nonbranded front I/O in upper frame (2023 H9 has top I/O).
for y in (.175, .193):
    g.box((.099, y, .493), (.013, .007, .002), DARK, .0006)
g.cyl((.098, .213, .493), .0042, .002, EDGE, n=32)
g.box((.118, .195, .493), (.007, .003, .002), DARK, .0007)
g.cyl((.118, .176, .493), .002, .002, DARK, n=24)
chassis = tag(g.mesh('Case_Chassis', (0, 0, .2475), case), 'case', 'case')

# Removable glass panels are thin solids with centered origins; tinted transmission.
g = Geo()
g.box((-.143, 0, .258), (.004, .457, .421), GLASS, .00065)
# Narrow rear and lower bonded edge strips, transparent corner remains unobstructed.
g.box((-.1405, -.224, .258), (.001, .006, .418), STEEL, .0003)
g.box((-.1405, 0, .050), (.001, .450, .004), STEEL, .0003)
tag(g.mesh('Case_SideGlass', (-.143, 0, .258), case), 'case-panel', 'case', (-.18, 0, 0))
g = Geo()
g.box((-.051, .231, .258), (.184, .004, .421), GLASS, .00065)
g.box((.039, .2285, .258), (.004, .001, .418), STEEL, .0003)
tag(g.mesh('Case_FrontGlass', (-.051, .231, .258), case), 'case-panel', 'case', (0, 0, -.17))
g = Geo()
for y in (-.222, .222):
    g.box((.1435, y, .257), (.003, .018, .425), STEEL, .0008)
for z in (.054, .460):
    g.box((.1435, 0, z), (.003, .430, .019), STEEL, .0008)
g.box((.1435, -.152, .257), (.003, .120, .390), STEEL, .0008)
g.box((.1435, .014, .257), (.003, .015, .390), STEEL, .0008)
lattice(g, (.1435, .112, .257), .173, .386, 'YZ', .005, .00075)
lattice(g, (.1435, -.052, .257), .113, .386, 'YZ', .005, .00075)
tag(g.mesh('Case_RearPanel', (.1435, 0, .257), case), 'case-panel', 'case', (.32, 0, 0),
    role='Removable service-side panel on secondary chamber; rear I/O frame belongs to chassis')
g = Geo()
for x in (-.134, .134):
    g.box((x, 0, .493), (.022, .466, .004), STEEL, .0008)
for y in (-.222, .222):
    g.box((0, y, .493), (.248, .022, .004), STEEL, .0008)
lattice(g, (-.016, -.015, .493), .231, .393, 'XY', .0045, .00065)
tag(g.mesh('Case_TopPanel', (0, 0, .493), case), 'case-panel', 'case', (0, .24, 0))


def fan_geometry(size=.120, depth=.025, count=7, frame=True, handed=1):
    """Local +Z = discharge; struts on +Z. Swept, twisted solid blades."""
    g = Geo()
    outer = size/2
    radius = size*.455
    if frame:
        g.ring((0, 0, 0), outer, radius+.001, depth-.0012, PLASTIC, n=128, square=True)
        # Beveled frame lips and corner rubber pads.
        for z in (-depth/2+.0008, depth/2-.0008):
            g.ring((0, 0, z), radius+.0016, radius-.0004, .0016, EDGE, n=128)
        for x in (-size*.438, size*.438):
            for y in (-size*.438, size*.438):
                g.box((x, y, 0), (.014, .014, depth), PLASTIC, .0022)
                g.ring((x, y, -depth/2+.0003), .0036, .0016, .0007, RUBBER, n=24)
                g.ring((x, y, depth/2-.0003), .0036, .0016, .0007, RUBBER, n=24)
        for a in (0, math.pi/2, math.pi, 3*math.pi/2):
            # Diagonal outlet-side support ribs expose intake vs exhaust.
            p1 = (size*.14*math.cos(a), size*.14*math.sin(a), depth/2-.003)
            p2 = (radius*math.cos(a+.24), radius*math.sin(a+.24), depth/2-.003)
            g.rod(p1, p2, .0017, PLASTIC, n=8)
    hub = size*.145
    g.cyl((0, 0, -.001), hub, depth*.62, PLASTIC, n=96, r2=hub*.93)
    g.cyl((0, 0, -depth*.34), hub*.91, .0015, BLADE, n=96)
    g.ring((0, 0, -depth*.36), hub*.91, hub*.84, .0008, EDGE, n=96)
    rows, cols = 32, 12
    for blade in range(count):
        verts, faces = [], []
        for layer in (-1, 1):
            for i in range(rows+1):
                t = i/rows
                r = hub*.88 + (radius*.974-hub*.88)*t
                sweep = handed*(.56*t-.12*t*t)
                chord = (.80 if count==5 else .58)*(1-.26*t)
                for j in range(cols+1):
                    u = j/cols
                    angle = blade*math.tau/count+sweep+handed*chord*(u-.5)
                    z = (u-.5)*depth*(.59-.25*t) + depth*.06*math.sin(u*math.pi) + layer*.00045
                    verts.append((r*math.cos(angle), r*math.sin(angle), z))
        layer_n = (rows+1)*(cols+1)
        for i in range(rows):
            for j in range(cols):
                a = i*(cols+1)+j
                faces.append((a, a+cols+1, a+cols+2, a+1))
                faces.append((a+layer_n+1, a+layer_n+cols+2, a+layer_n+cols+1, a+layer_n))
        boundary = list(range(cols+1))
        boundary += [i*(cols+1)+cols for i in range(1, rows+1)]
        boundary += [rows*(cols+1)+j for j in range(cols-1, -1, -1)]
        boundary += [i*(cols+1) for i in range(rows-1, 0, -1)]
        for k, a in enumerate(boundary):
            b = boundary[(k+1)%len(boundary)]
            faces.append((a, b, b+layer_n, a+layer_n))
        g.add(verts, faces, BLADE, True)
    return g


case_fan_geo = fan_geometry()
aio_fan_geo = fan_geometry(count=5)
FAN_MESHES = {}


def fan(name, position, direction, parent, aio=False):
    rotation = Vector((0, 0, 1)).rotation_difference(Vector(direction))
    key = 'aio' if aio else 'case'
    if key not in FAN_MESHES:
        o = (aio_fan_geo if aio else case_fan_geo).mesh(name, (0, 0, 0), parent, rotation)
        FAN_MESHES[key] = o.data
    else:
        o = bpy.data.objects.new(name, FAN_MESHES[key])
        bpy.context.collection.objects.link(o)
        o.parent = parent
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = rotation
    o.location = position
    tag(o, 'cooling-fan' if aio else 'case-fan', 'cooling' if aio else 'case-fan',
        (0, .14, 0) if aio else ((-.075, 0, 0) if name.startswith('Side') else
                                 (0, -.07, 0) if name.startswith('Bottom') else (0, 0, .10)),
        airflow= 'exhaust' if aio or name.startswith('Rear') else 'intake',
        airflowDirection=[direction[0], direction[2], -direction[1]],
        nominalSizeMm=120, assembly='top-aio' if aio else name.split('Fan')[0].lower())
    return o


for i, y in enumerate((-.122, 0, .122), 1):
    fan(f'BottomFan_{i:02}', (-.058, y, .065), (0, 0, 1), bottomfans)
for i, z in enumerate((.133, .256, .379), 1):
    fan(f'SideFan_{i:02}', (.021, .117, z), (-1, 0, 0), sidefans)
fan('RearFan_01', (-.078, -.216, .359), (0, -1, 0), root)

# ATX BOARD core footprint exactly 244 mm along Y, 305 mm vertically.
g = Geo()
g.box((.030, -.103, .2475), (.0016, .244, .305), PCB, .00025)
# Board mounting standoffs and washers, no exhaustive tiny PCB trace geometry.
for y in (-.212, -.096, .008):
    for z in (.106, .247, .388):
        g.cyl((.037, y, z), .0031, .012, EDGE, (-1, 0, 0), n=20)
        g.ring((.0288, y, z), .0033, .0014, .0006, ALUMINUM, n=24, axis=(-1, 0, 0))
# Integrated I/O / VRM armour on left and top of CPU.
g.box((.010, -.198, .350), (.036, .049, .095), HEATSINK, .0028)
g.box((.006, -.195, .372), (.037, .052, .051), EDGE, .0022)
g.box((.015, -.116, .387), (.027, .104, .020), HEATSINK, .0015)
for z in [ .309 + k*.0035 for k in range(21) ]:
    g.box((-.009, -.199, z), (.004, .043, .0017), HEATSINK, .0003)
for y in [ -.166 + k*.005 for k in range(20) ]:
    g.box((-.0005, y, .387), (.005, .0018, .018), HEATSINK, .0003)
# Diagonal machined accents on armour; no fake brand labels.
for z in (.344, .352, .360):
    g.box((-.013, -.200, z), (.001, .032, .0012), ALUMINUM,
          rot=Matrix.Rotation(.28, 3, 'X'))
# Rear integrated I/O faces negative Y, aligns rear aperture.
g.box((.003, -.226, .354), (.036, .0018, .083), ALUMINUM, .0006)
for z in (.327, .340, .353, .366):
    for x in (-.006, .009):
        g.box((x, -.2272, z), (.011, .0012, .005), DARK, .0006)
g.box((.007, -.2272, .386), (.013, .0013, .012), DARK, .0006)
for z in (.310, .316):
    g.cyl((.005, -.228, z), .0023, .003, GOLD, (0, -1, 0), n=20)
# Socket retainer surrounds covered AM5 CPU region.
g.box((.022, -.119, .325), (.012, .055, .058), DARK, .0011)
for y in (-.143, -.095):
    g.box((.014, y, .325), (.003, .004, .051), ALUMINUM, .0006)
for z in (.300, .350):
    g.box((.014, -.119, z), (.003, .046, .004), ALUMINUM, .0006)
g.rod((.013, -.148, .300), (.013, -.148, .349), .001, ALUMINUM)
# Four vertical DDR5 slots A1/A2/B1/B2 from CPU toward board edge.
DIMM_Y = (-.047, -.034, -.021, -.008)
for y in DIMM_Y:
    for yy in (y-.0027, y+.0027):
        g.box((.024, yy, .324), (.009, .0018, .137), DARK, .0003)
    for z in (.253, .395):
        g.box((.023, y, z), (.011, .009, .009), EDGE, .001)
# Primary reinforced PCIe x16 slot + two lower full length sockets.
for z, metal in ((.234, True), (.159, False), (.119, False)):
    for zz in (z-.003, z+.003):
        g.box((.025, -.151, zz), (.010, .090, .002), ALUMINUM if metal else DARK, .0004)
    g.box((.024, -.103, z), (.012, .011, .009), EDGE, .001)
    g.box((.027, -.151, z), (.004, .086, .002), DARK)
# M.2 thermal guard above GPU, lower M.2 coverage with one exposed 2280 bay.
g.box((.022, -.148, .266), (.014, .113, .025), HEATSINK, .0015)
for z in (.258, .264, .270, .276):
    g.box((.014, -.148, z), (.002, .101, .0014), EDGE, .00025)
g.box((.024, -.150, .190), (.010, .112, .034), HEATSINK, .001)
for z in (.179, .185, .191, .197):
    g.box((.018, -.149, z), (.002, .100, .0014), EDGE)
# Chipset angular armour at lower right.
g.box((.020, -.025, .170), (.018, .067, .050), HEATSINK, .0025)
for z in (.154, .162, .170, .178, .186):
    g.box((.010, -.025, z), (.002, .055, .0015), EDGE,
          rot=Matrix.Rotation(-.15, 3, 'X'))
# ATX 24-pin, SATA headers, modest major chokes/capacitors only.
g.box((.022, .010, .313), (.015, .012, .050), DARK, .0008)
for z in (.292, .303, .314, .325, .336):
    g.box((.013, .010, z), (.001, .008, .002), EDGE)
for z in (.146, .161):
    g.box((.022, .009, z), (.014, .018, .012), DARK, .0008)
for y in (-.159, -.150, -.141, -.132, -.123, -.114, -.105, -.096):
    g.box((.025, y, .366), (.009, .007, .007), EDGE, .0006)
for y in (-.162, -.153, -.144, -.135, -.126, -.117, -.108):
    g.cyl((.025, y, .357), .0025, .006, ALUMINUM, (-1, 0, 0), n=16)
for z in (.113, .125, .137, .149):
    g.cyl((.025, -.215, z), .003, .007, EDGE, (-1, 0, 0), n=20)
for y in (-.198, -.175, -.083, -.044, -.012):
    g.box((.025, y, .102), (.007, .012, .006), DARK, .0004)
motherboard = tag(g.mesh('Motherboard', (.030, -.103, .2475), root), 'motherboard', 'motherboard',
                  (-.095, 0, .035), boardFootprintMm=[305, 244], socket='AM5')

# RAM modules: exact 33mm class height normal to board, two sticks in A2/B2.
g = Geo()
g.box((0, 0, 0), (.030, .0065, .133), PLASTIC, .0007)
g.box((.0145, 0, 0), (.004, .0012, .133), PCB, .0002)
for y in (-.0036, .0036):
    g.box((-.002, y, 0), (.025, .0009, .129), HEATSINK, .0006)
    for z in (-.044, -.033, -.022, -.011, 0, .011, .022, .033, .044):
        g.box((-.004, y*1.12, z), (.012, .00055, .0024), EDGE, .0003,
              rot=Matrix.Rotation(.36, 3, 'Y'))
g.box((-.015, 0, 0), (.003, .0074, .129), PLASTIC, .0008)
for i, y in enumerate((DIMM_Y[1], DIMM_Y[3]), 1):
    if i == 1:
        o = g.mesh(f'RAM_{i:02}', (0, 0, 0), memory)
        ram_mesh = o.data
    else:
        o = bpy.data.objects.new(f'RAM_{i:02}', ram_mesh)
        bpy.context.collection.objects.link(o)
        o.parent = memory
    o.location = (.011, y, .324)
    tag(o, 'memory', 'memory', (-.13, .015, -.02), slot='A2' if i==1 else 'B2',
        capacityGB=16, nominalModuleHeightMm=33)

# M.2 2280 flat to board, exposed lower M.2 bay for independent inspection.
g = Geo()
g.box((.025, -.145, .139), (.0012, .080, .022), PCB, .0002)
g.box((.023, -.145, .139), (.002, .069, .017), LABEL, .0006)
g.box((.023, -.105, .139), (.004, .005, .024), DARK, .0003)
g.ring((.0236, -.183, .139), .0021, .0011, .0005, ALUMINUM, n=24, axis=(-1, 0, 0))
tag(g.mesh('SSD_M2', (.024, -.145, .139), root), 'storage', 'storage', (-.12, -.045, .035),
    formFactor='M.2 2280', nominalFootprintMm=[80, 22], subModel=None)

# Compact horizontal GPU. Whole assembly envelope 110 X x 282 Y x 50 Z mm.
# I/O bracket at -Y; fans face downward, not outward as with vertical mounting.
gx, gy, gz = -.030, -.086, .209
g = Geo()
# Shroud boundary rails, avoid a solid surface behind the fan openings.
for x in (-.082, .022):
    g.box((x, gy, .190), (.006, .282, .012), PLASTIC, .0022)
for y in (-.224, .052, -.134, -.038):
    g.box((gx, y, .190), (.099, .006, .012), PLASTIC, .0018)
for y in (-.179, -.086, .007):
    g.ring((gx, y, .191), .047, .044, .010, PLASTIC, n=128)
# Windforce-style layered edge facets.
for y in (-.182, -.087, .008):
    g.box((-.084, y, .197), (.002, .080, .014), EDGE, .001)
    g.box((-.083, y+.014, .198), (.001, .032, .0018), ALUMINUM,
          rot=Matrix.Rotation(.22, 3, 'X'))
# Actual fin stack with air gaps, and exposed heat pipe bends.
for i in range(92):
    g.box((gx, -.213+i*.00285, .213), (.098, .00060, .029), ALUMINUM)
for x in (-.065, -.045, -.025, -.005):
    g.rod((x, -.211, .212), (x, .043, .212), .0018, HEATSINK, n=16)
# PCB and edge connection area within overall envelope.
g.box((gx, -.104, .230), (.103, .242, .0016), PCB, .0003)
g.box((.0235, -.151, .232), (.003, .088, .004), GOLD, .0002)
# Rear triple-slot bracket, four recessed display port regions.
g.box((gx, -.226, .209), (.106, .002, .048), ALUMINUM, .0007)
for x in (-.066, -.042, -.018, .007):
    g.box((x, -.2271, .220), (.017, .0008, .006), DARK, .0007)
for x in (-.070, -.049, -.028, -.007, .014):
    for z in (.193, .200, .207):
        g.box((x, -.2271, z), (.012, .0008, .002), DARK, .0003)
# Single 16-pin power region on visible long edge, connector stays in envelope.
g.box((-.078, -.020, .224), (.010, .019, .012), DARK, .001)
for y in (-.026, -.022, -.018, -.014):
    g.box((-.084, y, .225), (.001, .002, .005), EDGE)
gpu = tag(g.mesh('GPU', (gx, gy, gz), root), 'gpu', 'gpu', (-.16, 0, -.03),
          nominalDimensionsMm=[282, 110, 50], mounting='horizontal PCIe', powerConnector='single 16-pin')
# Backplate has a real screen-cooling opening toward front end.
g = Geo()
g.box((0, -.048, .0235), (.106, .183, .003), HEATSINK, .0009)
for x in (-.048, .048):
    g.box((x, .090, .0235), (.010, .093, .003), HEATSINK, .0008)
for y in (.048, .137):
    g.box((0, y, .0235), (.090, .008, .003), HEATSINK, .0007)
for y in (.068, .085, .102, .119):
    g.box((0, y, .0235), (.086, .006, .003), HEATSINK, .0006)
for y in (-.105, -.061, -.017):
    g.box((0, y, .025), (.080, .003, .0006), EDGE, rot=Matrix.Rotation(.25, 3, 'Z'))
g.mesh('GPU_Backplate', (0, 0, 0), gpu)
for i, y in enumerate((-.093, 0, .093), 1):
    g = fan_geometry(.088, .008, count=9, frame=False, handed=-1 if i==2 else 1)
    o = g.mesh(f'GPU_Fan_{i:02}', (0, 0, 0), gpu)
    o.location = (0, y, -.0205)
    o['category'] = 'gpu-fan'

# 398 x 120 x 38 mm radiator, top mounted; 25mm P12 Pro fans underneath.
g = Geo()
for y in (-.189, .189):
    g.box((-.058, y, .463), (.120, .020, .038), STEEL, .002)
for x in (-.115, -.001):
    g.box((x, 0, .463), (.006, .360, .038), STEEL, .0007)
for y in (-.179, .179):
    g.box((-.058, y, .463), (.108, .003, .032), EDGE, .0005)
for i in range(120):
    y = -.177+i*.002975
    # Corrugated painted aluminium fin strips, visible through top and fans.
    g.box((-.058, y, .463), (.108, .00045, .032), HEATSINK)
for x in (-.092, -.058, -.024):
    g.box((x, 0, .463), (.003, .353, .033), STEEL, .0004)
tag(g.mesh('AIO_Radiator', (-.058, 0, .463), cooling), 'cooling', 'cooling', (0, .14, 0),
    nominalDimensionsMm=[398, 120, 38], assembly='top-aio')
for i, y in enumerate((-.120, 0, .120), 1):
    o = fan(f'AIO_Fan_{i:02}', (-.058, y, .4315), (0, 0, 1), cooling, aio=True)
    # Semantic aliases are empty child nodes, never duplicate visible fans.
    alias = group(f'TopFan_{i:02}', o)
    alias['aliasFor'] = o.name

# Liquid Freezer III turbine-like VRM fan/block silhouette over CPU.
g = Geo()
g.box((.016, -.119, .325), (.020, .054, .058), DARK, .004)
g.box((.023, -.119, .325), (.003, .042, .044), ALUMINUM, .001)
g.cyl((-.011, -.119, .325), .033, .039, PLASTIC, (-1, 0, 0), n=96, r2=.030)
g.ring((-.032, -.119, .325), .0335, .028, .007, EDGE, n=128, axis=(-1, 0, 0))
g.cyl((-.036, -.119, .325), .014, .005, PLASTIC, (-1, 0, 0), n=64)
for i in range(28):
    a = i*math.tau/28
    p1 = (-.034, -.119+.016*math.cos(a), .325+.016*math.sin(a))
    p2 = (-.034, -.119+.027*math.cos(a+.24), .325+.027*math.sin(a+.24))
    g.rod(p1, p2, .0012, BLADE, n=8)
# AM5 mounting ears and hose elbows at top of block.
for z in (.283, .367):
    g.box((.010, -.119, z), (.017, .060, .009), EDGE, .001)
    for y in (-.143, -.095):
        g.cyl((-.001, y, z), .0035, .007, ALUMINUM, (-1, 0, 0), n=24)
for y in (-.137, -.101):
    g.cyl((-.010, y, .365), .009, .018, DARK, (0, 0, 1), n=48)
    g.ring((-.010, y, .372), .0094, .0062, .005, EDGE, n=48)
tag(g.mesh('AIO_Pump', (-.006, -.119, .325), cooling), 'cooling', 'cooling', (-.12, .045, .015),
    socketCenter=[.030, .325, .119])
# Both hoses route forward/up, above GPU, around RAM rather than through it.
# Paths are intentionally representative; no exact tube-length claim.
paths = [
    [(-.010, -.137, .374), (-.031, -.110, .399), (-.054, -.035, .395),
     (-.063, .095, .361), (-.074, .192, .374), (-.078, .192, .428), (-.078, .192, .447)],
    [(-.010, -.101, .374), (-.041, -.071, .380), (-.073, .012, .368),
     (-.089, .110, .337), (-.098, .192, .360), (-.098, .192, .419), (-.098, .192, .447)]
]
for name, points in zip(('AIO_Tube_A', 'AIO_Tube_B'), paths):
    tag(tube(name, points, .0062, RUBBER, cooling, 16), 'cooling-tube', 'cooling', (-.06, .095, 0),
        tubeOuterDiameterMm=12.4, explodedBehavior='Rigid visual separation; hoses do not simulate deformation')
# Radiator fittings are within original tanks; hose exit collars below tank.
g = Geo()
for x in (-.078, -.098):
    g.cyl((x, .192, .444), .008, .014, DARK, (0, 0, 1), n=40)
    g.ring((x, .192, .441), .0085, .006, .004, EDGE, n=40)
fittings = g.mesh('AIO_Radiator_Fittings', (0, 0, 0), bpy.data.objects['AIO_Radiator'])
# Geo above is in world coordinates; child needs center compensation.
fittings.location = -bpy.data.objects['AIO_Radiator'].location

# PSU mounted on its side in secondary chamber; 86 X x 140 Y x 150 Z.
# Its 120mm fan faces service panel. GPU chamber remains entirely open.
px, py, pz = .094, -.158, .295
g = Geo()
for y in (py-.069, py+.069):
    g.box((px, y, pz), (.086, .002, .150), STEEL, .0008)
for z in (pz-.074, pz+.074):
    g.box((px, py, z), (.086, .136, .002), STEEL, .0008)
g.box((px-.042, py, pz), (.002, .136, .146), STEEL, .0008)
for y in (py-.064, py+.064):
    g.box((px+.042, y, pz), (.002, .010, .146), STEEL, .0006)
for z in (pz-.068, pz+.068):
    g.box((px+.042, py, z), (.002, .118, .014), STEEL, .0006)
g.ring((px+.042, py, pz), .066, .058, .002, STEEL, n=96, axis=(1, 0, 0))
for r in (.019, .026, .033, .040, .047, .054, .058):
    g.ring((px+.043, py, pz), r+.00065, r-.00065, .0012, EDGE, n=96, axis=(1, 0, 0))
for a in (0, math.pi/2, math.pi, 3*math.pi/2):
    g.rod((px+.043, py+.015*math.cos(a), pz+.015*math.sin(a)),
          (px+.043, py+.059*math.cos(a), pz+.059*math.sin(a)), .0008, EDGE)
# Fan rotor behind grille, entirely internal (not an extra case airflow fan).
rotor = fan_geometry(.114, .010, count=7, frame=False)
rotation = Vector((0, 0, 1)).rotation_difference(Vector((-1, 0, 0))).to_matrix()
g.add([rotation @ Vector(v)+Vector((px+.035, py, pz)) for v in rotor.v], rotor.f, BLADE, True)
# Modular socket face toward +Y, no invented exact connector pinout.
for x in (px-.023, px+.003, px+.025):
    for z in (pz-.045, pz-.017, pz+.011, pz+.039):
        g.box((x, py+.0702, z), (.017, .0012, .015), DARK, .0007)
        g.box((x, py+.071, z), (.012, .0006, .010), EDGE, .0004)
# Rear AC inlet and power rocker suggest external detail without labels.
g.box((px-.014, py-.0704, pz-.041), (.028, .001, .020), DARK, .001)
g.box((px+.023, py-.0704, pz-.041), (.011, .001, .016), DARK, .0006)
tag(g.mesh('PSU', (px, py, pz), root), 'psu', 'psu', (.20, 0, 0),
    nominalDimensionsMm=[140, 150, 86], chamber='secondary', variant='Year/revision unspecified; representative housing')

# Minimal clean power runs. Separate cable nodes support independent hiding.
for i in range(6):
    x = -.092-i*.0016
    tube(f'Cable_GPU_Power_{i+1:02}', [(x, -.020+i*.0018, .224), (x-.012, -.012, .251),
         (x-.014, .030, .259), (-.034, .043, .259), (.020, .049, .259)], .0010, RUBBER, cabling)
for i in range(6):
    tube(f'Cable_ATX24_{i+1:02}', [(.010, .014, .294+i*.007), (-.002, .020, .294+i*.007),
         (-.009, .042, .294+i*.007), (.027, .050, .294+i*.007)], .0011, RUBBER, cabling)


def gltf_vec(v):
    return [round(v[0], 7), round(v[2], 7), round(-v[1], 7)]


def bounds(obj, descendants=False):
    objs = [obj] + list(obj.children_recursive) if descendants else [obj]
    points = [o.matrix_world @ Vector(c) for o in objs if o.type == 'MESH' for c in o.bound_box]
    lo = Vector(tuple(min(p[k] for p in points) for k in range(3)))
    hi = Vector(tuple(max(p[k] for p in points) for k in range(3)))
    return lo, hi


bpy.context.view_layer.update()
required = ['Case_Chassis', 'Case_FrontGlass', 'Case_SideGlass', 'Case_RearPanel', 'Case_TopPanel',
            'Motherboard', 'GPU', 'RAM_01', 'RAM_02', 'AIO_Radiator', 'AIO_Pump', 'AIO_Tube_A',
            'AIO_Tube_B', 'AIO_Fan_01', 'AIO_Fan_02', 'AIO_Fan_03', 'PSU', 'SSD_M2',
            'SideFan_01', 'SideFan_02', 'SideFan_03', 'BottomFan_01', 'BottomFan_02', 'BottomFan_03', 'RearFan_01']
assert all(n in bpy.data.objects and bpy.data.objects[n].type == 'MESH' for n in required)
assert not any(o.name.startswith(('Cube', 'Object', 'Mesh_')) for o in root.children_recursive)
assert sum(o.name.startswith(('AIO_Fan_', 'SideFan_', 'BottomFan_', 'RearFan_')) for o in root.children_recursive) == 10
# Hard scale and placement anchors. Contact/mounting intersections intentional.
lo, hi = bounds(gpu, True)
assert all(abs(a-b) < .003 for a, b in zip(hi-lo, (.110, .282, .050))), (lo, hi)
assert bpy.data.objects['PSU'].location.x > .050
assert bpy.data.objects['AIO_Radiator'].location.z > .44
assert all(min(p[2] for p in path) > .33 for path in paths)

triangles = 0
unique_triangles = 0
seen = set()
for o in root.children_recursive:
    if o.type == 'MESH':
        o.data.calc_loop_triangles()
        t = len(o.data.loop_triangles)
        triangles += t
        if o.data.name not in seen:
            unique_triangles += t
            seen.add(o.data.name)
assert triangles < 500_000, triangles
for name, entry in PARTS.items():
    o = bpy.data.objects[name]
    lo, hi = bounds(o, name=='GPU')
    entry['installedTransform'] = {'translation': gltf_vec(o.location),
        'rotation': [round(o.rotation_quaternion.x, 8), round(o.rotation_quaternion.z, 8),
                     round(-o.rotation_quaternion.y, 8), round(o.rotation_quaternion.w, 8)]
                    if o.rotation_mode == 'QUATERNION' else [0, 0, 0, 1], 'scale': [1, 1, 1]}
    entry['explodedTransform'] = dict(entry['installedTransform'])
    entry['explodedTransform']['translation'] = [round(a+b, 7) for a, b in
        zip(entry['installedTransform']['translation'], entry['explodedOffset'])]
    entry['boundsMeters'] = {'min': gltf_vec((lo.x, hi.y, lo.z)), 'max': gltf_vec((hi.x, lo.y, hi.z))}
    entry['parent'] = o.parent.name

manifest = {'version': 1, 'asset': 'rigpilot-demo-pc.glb', 'units': 'meters',
    'coordinateSystem': {'up': '+Y', 'front': '-Z', 'glassSide': '-X', 'secondaryChamber': '+X',
                         'transformSpace': 'parent-local glTF; offsets are parent-local translations'},
    'representation': 'Visually accurate Phase 1 representation, not a manufacturing digital twin',
    'caseDimensionsMm': {'height': 495, 'width': 290, 'depth': 466},
    'requiredObjects': required, 'parts': PARTS,
    'aliases': {f'TopFan_{i:02}': f'AIO_Fan_{i:02}' for i in range(1, 4)},
    'assemblies': {'top-aio': ['AIO_Radiator', 'AIO_Fan_01', 'AIO_Fan_02', 'AIO_Fan_03']},
    'cableObjects': [o.name for o in cabling.children],
    'statistics': {'blenderVersion': bpy.app.version_string, 'triangles': triangles,
                   'uniqueGeometryTriangles': unique_triangles, 'meshObjects': sum(o.type=='MESH' for o in root.children_recursive),
                   'materialCount': len(MATS), 'textureCount': 0},
    'representativeDetails': ['Unspecified WD_BLACK sub-model represented as a generic black M.2 2280 module',
        'RM850e year/revision unspecified; 140 x 150 x 86 mm representative exterior',
        'Case fans unspecified; representative non-RGB 120mm fans',
        'PCB details, shroud facets, pump housing and hose paths simplified from official references',
        'M.2 lower bay exposed for inspection; primary M.2 heat guard remains installed']}

# Export asset ONLY: temporary camera/lights/studio excluded by selection.
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for o in root.children_recursive:
    o.select_set(True)
GLB = OUT / 'rigpilot-demo-pc.glb'
bpy.ops.export_scene.gltf(filepath=str(GLB), export_format='GLB', use_selection=True,
    export_yup=True, export_apply=True, export_extras=True, export_cameras=False,
    export_lights=False, export_materials='EXPORT', export_texcoords=False, export_normals=True)
manifest['statistics']['fileBytes'] = GLB.stat().st_size
assert GLB.stat().st_size < 20*1024*1024
(OUT / 'rigpilot-demo-pc.manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
print('RIGPILOT_EXPORT', json.dumps(manifest['statistics']))


def studio():
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = OPTS.samples
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1440
    scene.render.resolution_y = 1440
    scene.render.resolution_percentage = 100
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.31, .35, .40, 1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .32
    scene.view_settings.view_transform = 'AgX'
    floor_mat = material('QA_StudioFloor', (.19, .21, .235), .8)
    g = Geo()
    # floor material is preview only and never exported
    MATS.append(floor_mat)
    g.box((0, 0, -.009), (200, 200, .015), floor_mat)
    floor = g.mesh('QA_StudioFloor', (0, 0, 0), None)
    for name, position, energy, size in [
        ('QA_Key', (-.7, .1, 1.0), 10, .85), ('QA_Fill', (-.35, .8, .6), 6, .65),
        ('QA_Rim', (.5, -.5, .9), 14, .60), ('QA_Top', (.1, 0, 1.1), 5, .5)]:
        data = bpy.data.lights.new(name, 'AREA')
        data.energy, data.shape, data.size = energy, 'DISK', size
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        obj.location = position
        obj.rotation_euler = (Vector((0, 0, .24))-obj.location).to_track_quat('-Z', 'Y').to_euler()
    data = bpy.data.cameras.new('QA_Camera')
    camera = bpy.data.objects.new('QA_Camera', data)
    bpy.context.collection.objects.link(camera)
    camera.location = (-.82, .96, .69)
    camera.rotation_euler = (Vector((0, 0, .255))-camera.location).to_track_quat('-Z', 'Y').to_euler()
    data.type, data.ortho_scale = 'ORTHO', .77
    scene.camera = camera
    return camera


if OPTS.render or OPTS.save_blend:
    camera = studio()
if OPTS.save_blend:
    SOURCE.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'rigpilot-demo-pc.blend'))
if OPTS.render:
    scene.render.filepath = str(PREVIEW/'assembled.png')
    bpy.ops.render.render(write_still=True)
    for name in ('Case_SideGlass', 'Case_FrontGlass', 'Case_TopPanel'):
        bpy.data.objects[name].hide_render = True
    scene.render.filepath = str(PREVIEW/'open-panels.png')
    bpy.ops.render.render(write_still=True)
    camera.location = (-.80, -.91, .70)
    camera.rotation_euler = (Vector((0, 0, .255))-camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(PREVIEW/'rear-open.png')
    bpy.ops.render.render(write_still=True)
print('RIGPILOT_DONE', str(GLB))
