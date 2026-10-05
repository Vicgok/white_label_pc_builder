# Custom PC Builder

A reusable retailer sales prototype: choose a workload and budget, get a deterministic recommendation, customize parts, review compatibility and prepare a structured enquiry. React, TypeScript, Vite, Tailwind CSS, React Router and Zustand. No backend, checkout or live inventory.

## Run

Requires Node.js 22+.

```sh
npm install
npm run dev
```

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Browser checks (one-time browser installation):

```sh
npx playwright install chromium
npm run test:browser
```

## Brand previews

Use `/?brand=byos`, `satnam`, `jaicomputech`, `microcenter`, `computergarage360` or `itfixer`. Query overrides `VITE_ACTIVE_BRAND`, then the app defaults to `byos`. Brand choice follows internal links. `/demo` offers a switcher **during development only**. See [BRANDING.md](BRANDING.md).

Routes: `/`, `/builder`, `/builds`, `/builds/:slug`, `/components`, `/why-us`, `/support`; unknown routes have an intentional fallback. Static hosting must rewrite application routes to `index.html`.

## Where things live

- `src/config/`: typed brand configuration and resolution.
- `src/data/`: 54 illustrative components and four ready configurations. Edit these local files to replace catalog data and prices.
- `src/domain/`: framework-independent compatibility, recommendation, power, pricing, suitability, serialization and enquiry logic.
- `src/store/`: persisted Zustand builder draft and explicit device-local save.
- `src/components/`, `src/pages/`: shared UI, light marketing pages and dark builder workspace.

## Builder rules

Compatibility checks model CPU socket, CPU/motherboard memory support, case form factor, GPU length, cooler socket/height/radiator fit, cooler capacity and PSU capacity/headroom. Missing required parts remain visible. Integrated graphics can satisfy office builds. These checks are **not exhaustive hardware validation**: BIOS support, connectors, memory QVL, cooler/RAM clearance and exact radiator arrangements still need retailer review.

Power = modeled CPU allowance + GPU board power + 70W. Recommended PSU adds 25% headroom, rounds up to 50W, and respects the GPU's modeled minimum. Intel high-power CPUs use a peak allowance in the sample catalog.

Recommendations compare compatible CPU/GPU/memory/storage combinations, choosing inexpensive compatible supporting parts. Workload weights favor GPU performance for gaming, CPU/RAM for editing, NVIDIA VRAM for local AI, and integrated graphics/value for office use. Results stay within budget; an insufficient budget returns a clear minimum-budget action. Suitability labels are heuristics, with no fabricated benchmarks or FPS claims.

Drafts survive refresh. Saved builds, context, reference IDs and timestamps stay in LocalStorage. Shared links contain a validated, versioned parts/context payload plus brand ID. Incoming preset/share context is consumed once so refresh preserves subsequent edits. Share and copy use the clipboard with manual-copy fallback.

All retailer contacts start empty. WhatsApp buttons appear only when a number is configured; messages include reference, all chosen parts, sample total, workload and resolution. Quote/callback forms demonstrate a **local success state**, explicitly confirming nothing was sent. Screenshot intake stores only a filename, without uploading or OCR.

PC and hardware imagery uses locally stored, generated photorealistic studio images: graphite metal, tempered glass, neutral backgrounds, physically grounded shadows and restrained white lighting. Ten optimized JPEG assets live in `public/images/products/`; their mapping is in `src/config/product-images.ts`. Air and liquid coolers have separate images. Images are representative, not verified photographs of exact SKUs; an optional `image` field on each catalog component can supply its real product photo. Generation prompts and provenance are in [docs/product-image-prompts.md](docs/product-image-prompts.md). No runtime image-generation service or external image dependency is used.

Generated images must be unbranded and contain no readable labels, model/specification text, stickers, serial numbers or badges. CPU, GPU, Memory and Cooling callouts are rendered separately in semantic HTML/CSS by `ProductCallouts`, using the actual selected catalog data. Desktop callouts use leader lines and markers; smaller screens show a readable specification grid. Never ask an image generator to paint specification text into the photograph.

**All prices and specifications are illustrative prototype data.** Stock, warranty, retailer services and final quotations must be verified with the retailer. No business statistics or unverified contact details are supplied.
