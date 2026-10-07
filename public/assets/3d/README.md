# RigPilot Phase 1 PC asset

`rigpilot-demo-pc.glb` is the single assembled, interactive black H9 Flow **2023** demonstration PC. Geometry is authored locally from official references; see [REFERENCES.md](REFERENCES.md). No viewer or application integration is included.

## Generate and validate

Tested with **Blender 5.2.2 LTS** and Node.js 26.3.0. The generator uses Blender's standard Python API and bundled glTF exporter, with no add-ons or Python dependencies. Run from the repository root:

```sh
blender --background --python scripts/build-rigpilot-demo-pc.py -- --render
node scripts/validate-rigpilot-glb.mjs
```

On this Windows workstation:

```powershell
& 'D:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python scripts/build-rigpilot-demo-pc.py -- --render
node scripts/validate-rigpilot-glb.mjs
```

Omit `--render` for a fast export. Add `--save-blend` to save an optional editable source at `assets-source/3d/rigpilot-demo-pc.blend`. Studio renders go to ignored `artifacts/rigpilot-3d/`; cameras, lights and the studio floor are excluded from the GLB. The script regenerates the GLB **and manifest** together.

## Scale and transforms

One Blender unit and one glTF unit equal **one meter**. The exported asset uses **+Y up**, **-Z front**, **-X glass side**, **+X secondary chamber**. Case exterior: 0.290 × 0.495 × 0.466 m (X/Y/Z). The case stands on Y=0. Required part pivots are centered on their geometry; fan pivots are on their rotation axes.

The root is `RigPilot_PC`; grouping nodes have identity transforms. The manifest records parent-local installed translations, quaternions, unit scales, exploded offsets and suggested exploded transforms. GPU children follow `GPU`; radiator fittings follow `AIO_Radiator`. Apply transforms to the named part roots, and traverse their children for material highlighting because glTF may represent multiple material primitives as child meshes.

`Case_RearPanel` is the removable **service-side panel over the secondary chamber**. The rear I/O/PCIe frame is part of `Case_Chassis`. `TopFan_01`–`TopFan_03` are empty aliases parented to `AIO_Fan_01`–`AIO_Fan_03`; there are exactly ten visible airflow fans, with no duplicate top fan geometry. GPU and PSU cooling rotors are additional hardware details, not case airflow fans.

Exploded offsets are suggestions for visual inspection. The hoses are rigid selectable meshes; disconnect/hide them during an exploded animation or animate them independently. Cable names are listed in the manifest for hiding during part removal. RAM and SSD are independently rooted; their transforms must be applied separately when moving the motherboard.

## Optimization and size

The generator/export command above also performs the production optimization: joined detail geometry per interactive part, indexed vertices, linked fan/RAM geometry, shared materials, unused material slots removed, no UVs/textures and no hidden internal electronics. Approximate assembled total: **313,460 triangles**; **169,392 unique geometry triangles**. Final GLB: **4,342,904 bytes / 4.14 MiB**, 42 authoring mesh objects, 12 materials, zero textures. No Draco/Meshopt decoder dependency.

Further optional optimization, if glTF Transform is installed, can be performed on a copy:

```sh
gltf-transform dedup public/assets/3d/rigpilot-demo-pc.glb artifacts/rigpilot-3d/dedup.glb
gltf-transform weld artifacts/rigpilot-3d/dedup.glb artifacts/rigpilot-3d/weld.glb
```

Keep named nodes and material boundaries. Avoid `flatten`, `join`, `instance`, and default leaf pruning because the interaction hierarchy and empty top-fan aliases must survive. Inspect and validate any candidate before adopting it; update manifest statistics if its size or geometry counts change. These optional commands were not needed for the delivered 4.14 MiB export. [CLI reference](https://gltf-transform.dev/cli).

## Interactive names

```text
Case_Chassis       Case_FrontGlass    Case_SideGlass
Case_RearPanel     Case_TopPanel      Motherboard
GPU                RAM_01            RAM_02
AIO_Radiator       AIO_Pump           AIO_Tube_A
AIO_Tube_B         AIO_Fan_01         AIO_Fan_02
AIO_Fan_03         PSU                SSD_M2
SideFan_01         SideFan_02         SideFan_03
BottomFan_01       BottomFan_02       BottomFan_03
RearFan_01
```

All names are present in the active glTF scene and remain independently selectable. The validator checks the exported binary, object reachability, dimensions, indices, triangle/file budgets, reusable fans, glass material, and manifest transforms. Delivery QA also passed Khronos glTF Validator with **zero errors, warnings, infos or hints**, and Three.js 0.180.0 `GLTFLoader.parseAsync` with all **25 `scene.getObjectByName(...)` lookups** succeeding. QA dependencies were installed only under ignored `artifacts/rigpilot-3d/qa`, outside the application's dependencies.

## Materials and representative products

PBR metal/rough materials have no baked lighting or emission. Glass uses `KHR_materials_transmission` and `KHR_materials_ior`, with real panel thickness, subtle smoke tint and low roughness; the later viewer should provide suitable environment lighting. Standard contemporary Three.js GLTFLoader supports these material extensions.

The SSD is a generic **WD_BLACK-style 1TB M.2 2280** with no exact sub-model. Case fans are representative black 120mm fans; the RM850e housing represents the specified dimensions with no assumed year/revision. PCB cosmetics, blade profiles, cooler housing and cable paths are simplified. This is a visually accurate Phase 1 representation, not a manufacturing digital twin.
