# Homepage 3D hero

The current hero renders the existing [RigPilot GLB](../public/assets/3d/README.md). `HeroPcScene.tsx` owns the sticky section and scroll ref; lazy `three/HeroPc3D.tsx` owns the demand-rendered scene, studio lighting and cinematic camera. No orbit controls, postprocessing, remote HDR or labels are used. Three.js loads after the first paint when the hero is visible. The shared `ThreeDLoadingState` displays the RigPilot mark, real Drei asset progress when available, and an indeterminate line during chunk loading. The scene fades in over 280ms; reduced motion disables animation. Loading and error states never use a photograph.

`src/domain/three/homepage-explosion.ts` centralizes staged timing and compact, parent-local offsets based on the manifest. Panels open before hardware moves. Seated memory, pump and SSD follow the board until their own stage. Only the two cloned hose geometries deform to retain their endpoint connections; shared loader geometry and builder behavior remain unchanged. Mobile uses shorter travel and retains the board, RAM, PSU and SSD in the case. Reduced motion retains the real assembled GLB.

Validation: `npm test`, `npm run build`, `npx playwright test tests/hero.spec.ts`. Browser tests cover the real scene, opening order, reverse-scroll restoration, clear glass, responsive layouts, reduced motion, lazy loading and WebGL fallback.

## Archived raster layer implementation

The following records earlier photographic assets for provenance. They are no longer animated by the homepage hero. Reference and audit notes are in [public/assets/hero-pc/README.md](../public/assets/hero-pc/README.md).

The eight transparent photographic WebPs in `public/images/hero/photo/` share one **1600 × 1600 coordinate system**. Each contains its hardware at the assembled position with transparent padding around it. The scroll scene moves these individual raster layers; it does not animate the existing flat `pc-exploded.png`. The old SVG hardware assets have been removed. Exact generation prompts, source resolution, provenance and registration details are in [hero-photo-assets.md](hero-photo-assets.md).

| Scene layer | Photographic asset | Content |
| --- | --- | --- |
| `case` | `case.webp` | Empty graphite chassis and rear structure, with the open side facing camera |
| `panel` | `side-panel.webp` | Photographic graphite frame, glass center with clear alpha |
| `motherboard` | `motherboard.webp` | Representative motherboard and blank CPU, without cooler or RAM |
| `gpu` | `gpu.webp` | Horizontal graphics card aligned with the motherboard PCIe slot |
| `cooler` | `cooler.webp` | Two-fan AIO radiator, fans, tubing and pump as one assembly |
| `ram` | `ram.webp` | Two memory modules aligned with the motherboard slots |
| `psu` | `psu.webp` | Power supply aligned with the bottom bay |
| `storage` | `storage.webp` | M.2 NVMe drive aligned with the motherboard slot |

Use restrained, unbranded, transparent assets with no embedded text. The HTML callouts and build data provide labels. Preserve the same canvas and mechanical positions when replacing retailer photography. All eight WebPs are preloaded; the total is 371,286 bytes. Scroll changes transforms rather than image bounds. Mobile keeps minor parts assembled and moves only the panel and GPU. UI icons and HTML connector rules remain separate from the hardware.

The hardware photography is representative, not verified exact-SKU manufacturer imagery. `heroBuild` in `HeroPcScene.tsx` resolves the Vortex sample catalogue configuration with `cool-240` selected and calculates its sample price using the same pricing function as the builder.
