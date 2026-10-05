# Homepage hero layer assets

The eight transparent SVGs in `public/images/hero/` are aligned illustration placeholders. The scroll scene uses each as a separate image layer; it does not animate or stretch the existing flat `pc-exploded.png`. To move to photorealistic production art, replace these with transparent WebP or PNG renders from **one camera angle and one 700 × 700 coordinate system**. Keep transparent padding and registration identical across all files, then update the `layers` paths in `src/components/HeroPcScene.tsx` and the hero image preloads in `index.html`.

| Scene layer | Current placeholder | Production asset content |
| --- | --- | --- |
| `case` | `case.svg` | Empty graphite chassis and rear structure, with the open side facing camera |
| `panel` | `side-panel.svg` | Tempered-glass side panel on its own transparent canvas |
| `motherboard` | `motherboard.svg` | Installed AM5 motherboard, without CPU cooler or RAM |
| `gpu` | `gpu.svg` | RTX 5070 class graphics card, aligned with the motherboard PCIe slot |
| `cooler` | `cooler.svg` | 240 mm AIO radiator, fans, tubing and pump as one assembly |
| `ram` | `ram.svg` | Two DDR5 DIMMs aligned with the motherboard slots |
| `psu` | `psu.svg` | Power supply aligned with the bottom bay |
| `storage` | `storage.svg` | M.2 NVMe drive aligned with the motherboard slot |

Use restrained, unbranded, transparent assets with no embedded text. The HTML callouts and build data provide labels. Export around 700 × 700 px at 1× (or 1400 × 1400 px at 2×), then compress each asset before shipping. The current SVG placeholders are under a few kilobytes each and all eight are preloaded.

The hero configuration is illustrative. Its displayed price and hardware live in `heroBuild` in `HeroPcScene.tsx`; the general builder is a separate sample catalog and confirms its own pricing.
