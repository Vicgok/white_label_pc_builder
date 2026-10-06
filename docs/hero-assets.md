# Homepage hero layer assets

Current deployed assets and audit decisions are documented in [public/assets/hero-pc/README.md](../public/assets/hero-pc/README.md). The current hero animates seven photographic layers on desktop/tablet and four on mobile; only explicit reduced motion uses the flat assembled photograph. The section below records the previous eight-layer implementation for provenance; its callouts and panel have since been removed.

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
