# Homepage PC hero assets

These are locally stored, unbranded **generated photographic raster assets**, not verified photographs of the reference manufacturers' exact SKUs. No retailer inventory, stock or availability is claimed.

- `assembled/pc.webp`: a transparent 1600 × 1600 WebP (about 203 KB), used only for explicit `prefers-reduced-motion: reduce`.
- `layers/hero-*.webp`: active transparent shared-canvas photographic layers for the case, motherboard, GPU, cooler, RAM, PSU and storage. Normal rendering uses this same stack at both the assembled and exploded stages, avoiding a jump between mismatched photographs.
- Mobile composites keep the PSU in the stationary case and RAM/SSD on the moving motherboard. The GPU, motherboard and cooler partially separate. All rendered layers are preloaded; one missing or slow image never gates the available layers.
- Source PNG masters are retained in `artifacts/hero-originals/` (Git-ignored). Previous built-in imagegen prompts are archived in `docs/hero-photo-assets.md`.
- `scripts/prepare-hero-assets.mjs` registers every source using **one uniform scale factor**, preserving its original proportions. No new hardware pixels are drawn.
- The earlier side-panel frame was rejected: without a convincing glass reflection it looked like loose chassis beams.
- Images contain no specification labels. All labels, leader lines and connector dots were removed from the scene. Build specs appear in the separate HTML summary.
- The first 18% holds the assembled layer stack. Components then separate sequentially while the chassis stays anchored. Every layer settles by 82% and holds through 94%; the separate HTML summary reveals at 78–92%. The final 6% subtly scales/fades the scene into the next section.
- The disabling `photographicLayersApproved` flag and all-or-nothing decode fallback have been removed. Failed images are hidden individually. The existing native RAF renderer changes only transforms/opacity and uses cached layout measurements, with no React scroll-frame state.
- Desktop/tablet use a 220vh section with a sticky viewport scene. Tablet (768–1023px) reduces travel by 30%; mobile (below 768px) uses 160vh. Browser regression tests and visual captures cover 1440, 1280, 1024, 768 and 390px.
- No external manufacturer image is shipped or hotlinked. Native source resolution is 1254px, recorded in `layers/manifest.json`.

## Manufacturer references / attribution

Official product pages below were consulted only as visual/product references. Reuse permissions were not established, so none of their product images are used directly. Replace the generated layers with user-supplied licensed imagery only when its camera, light, proportions and shared-canvas registration fit this scene.

| Manufacturer | Reference product | Official source URL | Usage |
| --- | --- | --- | --- |
| AMD | Ryzen 7 9700X | https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-7-9700X.html | Reference only |
| NVIDIA | GeForce RTX 5070 | https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/ | Reference only |
| MSI | MAG B850 TOMAHAWK MAX WIFI | https://us.msi.com/Motherboard/MAG-B850-TOMAHAWK-MAX-WIFI/Gallery | Reference only |
| Corsair | Vengeance 32GB DDR5 Black | https://www.corsair.com/us/en/p/memory/cmk32gx5m2b6000c36/vengeance-32gb-2x16gb-ddr5-dram-6000mhz-c36-memory-kit-black-cmk32gx5m2b6000c36 | Reference only |
| Samsung | 990 EVO Plus NVMe 1TB | https://www.samsung.com/us/memory-storage/nvme-ssd/990-evo-plus-gen4-nvme-ssd-1tb-sku-mz-v9s1t0b-am/ | Reference only |
| Corsair | RM750e | https://www.corsair.com/us/en/p/psu/cp-9020295-na/rme-series-rm750e-fully-modular-low-noise-atx-power-supply-cp-9020295-na | Reference only |
| Corsair | 4000D Airflow Black | https://www.corsair.com/us/en/p/pc-case/cc-9011200-ww/4000d-airflow-tempered-glass-mid-tower-atx-case-cc-9011200-ww | Reference only |
| Corsair | Nautilus 240 RS Black | https://www.corsair.com/ww/en/p/cpu-coolers/CW-9060088-WW/nautilus-240-rs-liquid-cpu-cooler-cw-9060088-ww | Reference only |

Google Images discovery was attempted but the search page was inaccessible through the browser tool. Official manufacturer pages were used instead. No Google thumbnails, Google CDN URLs, random retailer photos, or downloaded manufacturer images are in production.

The displayed hero build remains the existing sample catalogue's Vortex configuration with its 240mm AIO substitution. Its total is calculated from catalogue data; the reference hardware above is not added to inventory. Customize Build opens this exact sample configuration.
