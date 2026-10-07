# Photographic scroll hero assets

This is the archived generation prompt set. The candidate cutouts were subsequently rejected for inconsistent perspective and opening registration. The current hero renders the existing GLB with a shared CSS loader, without a photographic loading/error fallback or hardware callouts. See [hero-assets.md](hero-assets.md) for the current scene and [public/assets/hero-pc/README.md](../public/assets/hero-pc/README.md) for the archived imagery, audit decisions and manufacturer reference URLs.

Built-in imagegen generated one master and eight transparent cutouts using the same camera/light reference. `public/images/hero/photo/*.webp` are the delivered 1600 × 1600 shared-canvas assets. Hardware content was generated/edited only with imagegen; `scripts/prepare-hero-assets.mjs` performs registration, resampling and WebP encoding at quality 0.95 with browser canvas. PNG source masters are saved in `artifacts/hero-originals/` (ignored by Git). `photo/manifest.json` records native source dimensions, useful-pixel bounds, placements and encoded sizes. The generation tool returned 1254px PNG originals; these are downscaled into their mechanically aligned positions on the 1600px export canvas, not claimed as native 1600px detail. No white rectangles; all backgrounds have genuine alpha. The glass center is clear alpha rather than opaque fill.

Desktop uses all eight moving layers; mobile retains all eight for a complete assembled PC but moves only the glass and GPU. Motion uses translate3d, one-degree rotation at most, subtle depth scaling and requestAnimationFrame. Reduced motion presents one static final configuration. Image decode completes before showing the whole assembly. Existing lazy-loaded catalogue photography remains lazy. Specifications and the example price are derived from the catalogue's Vortex configuration with its cooler changed to `cool-240` (240mm AIO), separate from all image pixels. Photography is representative, not exact manufacturer SKU verification.

## Master prompt

Use case: product-mockup. Asset type: master photographic reference for an assembled-to-exploded custom desktop PC web animation.
Create a square 1800-by-1800 transparent-background studio product cutout of ONE assembled premium graphite desktop PC tower in three-quarter perspective. A real physical computer photographed with a full-frame camera, 85mm lens, moderate three-quarter angle looking through open left side with front mesh face visible on the right. Camera just above case middle height, very slight downward view, no isometric or illustration look. Entire tower centered with generous empty transparent margin, occupies approximately middle 55% of canvas width and 65% height.
The left tempered-glass side panel is removed for this reference and NOT in the image. A clean black metal chassis with textured mesh front, plausible front ports, screws and mounting rails. Inside: unbranded realistic black motherboard, two black memory sticks, one horizontally installed black GPU with side facing camera and real heatsink, a top-mounted two-fan AIO radiator with tubes and circular pump on CPU, slim M.2 storage mounted near bottom of motherboard, and a modular PSU at the bottom. Prefer an OPEN lower PSU bay without opaque shroud so the PSU is visible and can later separate. Neatly routed black cables. Realistic photographic assembly and relative sizes, motherboard behind components, PSU on case floor. Every piece feels mechanically mounted.
Lighting: large softbox upper left, gentle fill right and restrained rim, neutral white studio, accurate brushed aluminum, matte powder-coated steel, PCB texture and plastic. Subtle reflections, surface grain and imperfections, no RGB or glow. Background must have genuine alpha transparency, no floor, no checkerboard baked into pixels, no rectangle, no cast floor shadow.
Critical: completely unbranded blank hardware surfaces; no letters, digits, model numbers, serials, logos, badges, stickers, printed silkscreen words, etched or molded text, pseudo-text anywhere, including ports and all chips. No text, callouts, annotations, UI or watermark. Avoid vector, SVG aesthetic, illustration, icons, cartoon, low-poly, CGI-looking materials, synthetic shiny reflections, stylized 3D, game-art, fantasy hardware.
This serves as the exact shared camera/layout reference for extracting each moving photographic layer.

## Shared layer extraction prompt

Use case: precise-object-edit / background-extraction. Input image is the assembled PC photographic master. Extract one photographic animation layer on a genuine transparent background. Output square high-resolution 2048x2048 RGBA PNG if possible. Match the exact original full square canvas framing and retain the object's EXACT original canvas location, perspective, focal length, dimensions and softbox upper-left illumination. Do not recenter, enlarge, zoom, turn, rotate, crop tightly or change camera. Keep empty transparent margin where removed objects were.
Natural premium electronics studio photography with real matte painted steel, brushed metal, PCB, capacitors, fan blades, screws and braided cables. Every hardware surface completely unbranded: remove all lettering, digits, labels, logos, stickers, etched/molded words, printed PCB words and pseudo-text. No letters or text even microscopic. Keep circuit traces and solder joints.
No backdrop, no floor shadow, no checkerboard baked in, no UI callouts or graphic lines. No SVG/vector drawing, CGI look, cartoon or illustration. All pixels outside this one object's silhouette must be fully transparent. Preserve semi-transparent materials naturally.
Extraction target:

### case

Keep ONLY the empty case/chassis itself, including front mesh, feet, front/rear mounting rails, empty motherboard tray, top and bottom steel structure, rear slots and optional single rear exhaust fan. REMOVE motherboard, GPU, RAM, SSD, PSU and all its cables, AIO radiator, pump and hoses. Reconstruct the empty steel motherboard tray and bottom bay naturally. Keep outer case silhouette, perspective, position and size exactly unchanged.

### motherboard

Keep ONLY the motherboard (the board mounted on the rear internal tray) including its black heatsinks, blank processor seated in socket, capacitors, connectors, real PCIe slots and circuit traces. REMOVE the chassis, PSU, GPU, RAM sticks, AIO radiator, pump/block, tubes, cable bundles, case fan and SSD drive. Reconstruct the motherboard areas obscured by those objects, including CPU socket area and board expansion slots. The board alone remains EXACTLY at its original rear-plane position, size and perspective, no stand or mounting tray.

### gpu

Keep ONLY the horizontally mounted GPU including its realistic black shroud, heatsink fins, PCB, rear PCIe bracket and short plugged-in power lead. REMOVE every other object: chassis, motherboard, RAM, storage, cooler, PSU and unrelated cabling. Complete the GPU where obscured. Keep the installed GPU's original horizontal side-on three-quarter angle, position and size exactly unchanged; do NOT turn it around to show three large fan circles.

### cooler

Keep ONLY the complete AIO liquid CPU cooler as ONE connected assembly: top-mounted two-fan radiator, circular CPU pump, its two connected braided tubes, brackets and a thin pump lead. REMOVE all chassis, motherboard, RAM, GPU, storage, PSU and unrelated cabling. Preserve the radiator at top and pump in middle, exact original size, placement and perspective and natural tube routing. Correct round blank pump face, real blades and fins, no floating detached subparts.

### ram

Keep ONLY the two installed vertical black memory modules at the right side of the CPU socket, with real thin heatspreaders and a slim edge connector. REMOVE motherboard and every other hardware part. Retain the two sticks' exact original vertical angle, size and positions so they plug back into the motherboard when stacked. Complete hidden portions naturally. No motherboard sockets attached to the modules.

### psu

Keep ONLY the modular PSU at the case bottom, including its realistic black metal housing, grille and neatly routed short black sleeved power cable leads. REMOVE chassis, motherboard, GPU, RAM, storage, radiator, pump and cooler tubes. Complete obscured PSU housing, but keep its original installed position at bottom left, size, shape, side-on camera angle and proportions unchanged.

### storage

Keep ONLY the slim horizontal M.2 SSD/heatsink assembly originally at the lower motherboard beneath the GPU (a narrow dark horizontal bar). REMOVE chassis, motherboard, GPU, RAM, PSU, cooling and all cabling. The SSD is a tiny narrow real rectangular 22x80mm module with black simple heatsink and tiny mounting notch, accurate size relative to motherboard. Keep exactly its mounted position near lower motherboard, original horizontal angle, scale and perspective.

### side-panel

Create ONLY the removed tempered-glass LEFT side panel that would close the reference chassis. Match the precise left-side opening projected polygon and size: back edge at left, front edge at right, upper edge subtly rises to the right. Place this glass panel exactly flush in its installed position over the reference case's left side, on the same canvas with the same camera. Do not include the chassis or hardware behind it. Four plausible small corner screws, thin graphite border, almost clear neutral glass with VERY subtle softbox reflection. Most glass pixels should be genuinely semitransparent (low alpha), not opaque black or grey. Empty scene around the panel fully transparent; no solid filled rectangle. It must overlay and allow the photographed internal components from other layers to remain visible. No ghost image of PC or any hardware reflected into glass.

## Chassis cleanup

Use case: precise-object-edit. Edit this transparent photographic EMPTY chassis layer. There are unwanted motherboard parts and a PSU still left inside. Remove the large angular black motherboard heatsink just to the right of the rear exhaust fan, and remove any remaining PCB attached to rear fan. Keep the rear fan as a normal single attached case fan. Completely remove the large PSU metal box and all PSU cables in the bottom bay; show an empty case floor with mounting holes, no shroud or large black box. Interior should contain ONLY case structure: empty steel motherboard tray with screw standoffs, cable cutouts, rails, single rear exhaust fan, mounting screw holes, bottom empty floor. No motherboard, heatsinks, CPU, RAM, GPU, PSU, SSD, radiator, pump, hoses or cables. Retain exact outer case shape, camera, full 1280-square canvas position, mesh front, texture, feet, lighting and genuine background transparency. Photorealistic natural matte steel, no text, logos, silkscreen or labels. Reconstruct only naturally empty chassis metal where removed objects were.

## Glass cleanup prompts

Use case: background-extraction / precise-object-edit. Edit this photographed tempered-glass PC side panel cutout. The large white glass center is wrong: REMOVE ALL WHITE/OPAQUE FILL inside the frame. Make the entire glass area truly transparent RGBA pixels with alpha approximately 0 to 30 out of 255, preserving only a very faint semitransparent softbox highlight or thin diagonal reflection. Behind the glass there is NOTHING; fully transparent background should be visible through it. Keep the black/graphite perimeter frame and four screw fittings opaque, photographic, exactly same shape, position, proportions, angle, lighting, full square canvas dimensions. BOTH the region outside the frame and the glass region inside the frame must be transparent; this is essentially a real thin graphite photographic frame with nearly invisible clear glass. Do not replace glass with white, gray or black solid plane, checkerboard or frosted surface. No tint that blocks the future internal hardware layers. No text, logos, labels, icons or drawings.

Use case: precise-object-edit / background-extraction. Remove the ENTIRE white triangular reflection from inside this side panel. Retain ONLY the photographed thin graphite perimeter frame and four corner screws, exact geometry, position, camera perspective, studio lighting and 1280-square canvas. The whole interior enclosed by the frame must be completely empty transparent RGBA pixels with alpha ZERO, with NO reflection, no glass tint, no triangle, no white fill, no frost, no shape inside. Background outside frame also fully transparent. This is a clear tempered-glass panel extracted as its physical frame only; nearly invisible clear glass. Do not add any elements. No illustration, no text.
