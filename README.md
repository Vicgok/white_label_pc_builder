# RigPilot

One retailer-neutral custom PC configuration prototype: choose a workload and budget, get a deterministic recommendation, customize parts, review compatibility and prepare a structured enquiry. React, TypeScript, Vite, Tailwind CSS, React Router and Zustand. No backend, checkout or live inventory.

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

## One product, one deployment

RigPilot uses one centralized product configuration in `src/config/product.ts`. No retailer environment variable, query parameter, logo or contact setup is required. The same production URL serves every prospect. See [BRANDING.md](BRANDING.md).

Routes: `/`, `/builder`, `/builds`, `/builds/:slug`, `/components`, `/how-it-works`, `/support`, `/for-retailers`. The former `/why-us` route redirects to How It Works. Unknown routes have an intentional fallback.

Deploy the standard `npm run build` output in `dist/`. Static hosting must rewrite application routes to `index.html`; the included `vercel.json` provides this for Vercel. No backend or retailer-specific production configuration is needed.

### Vercel deployment

- Framework preset: **Vite**; project root: this repository root.
- Install: `npm ci` (include development dependencies for TypeScript/Vite).
- Build: `npm run build` (includes TypeScript); output: `dist`.
- Required environment variables: **none**. No retailer configuration is needed.
- Keep the existing SPA rewrite: application URLs resolve to `index.html`, while `/assets/` and `/images/` remain static asset paths. See [Vercel's Vite guidance](https://vercel.com/docs/frameworks/frontend/vite).
- Before a Git-based deployment, commit all intended changes, including the new hero/story/loading source files and the staged `public/assets/3d/` files. Local untracked files are not deployed from Git. The GLB is 4,342,904 bytes (4.14 MiB); it and the manifest are copied unchanged into `dist/assets/3d/`. Their stable filenames intentionally have no custom year-long immutable caching.

## Where things live

- `src/config/`: centralized product identity, copy and accent theme.
- `src/data/`: 54 illustrative components and four ready configurations. Edit these local files to replace catalog data and prices.
- `src/domain/`: framework-independent compatibility, recommendation, power, pricing, suitability, serialization and enquiry logic.
- `src/store/`: persisted Zustand builder draft and explicit device-local save.
- `src/components/`, `src/pages/`: shared UI, light marketing pages and dark builder workspace.

## Builder rules

Compatibility checks model CPU socket, CPU/motherboard memory support, case form factor, GPU length, cooler socket/height/radiator fit, cooler capacity and PSU capacity/headroom. Missing required parts remain visible. Integrated graphics can satisfy office builds. These checks are **not exhaustive hardware validation**: BIOS support, connectors, memory QVL, cooler/RAM clearance and exact radiator arrangements still need retailer review.

Power = modeled CPU allowance + GPU board power + 70W. Recommended PSU adds 25% headroom, rounds up to 50W, and respects the GPU's modeled minimum. Intel high-power CPUs use a peak allowance in the sample catalog.

Recommendations compare compatible CPU/GPU/memory/storage combinations, choosing inexpensive compatible supporting parts. Workload weights favor GPU performance for gaming, CPU/RAM for editing, NVIDIA VRAM for local AI, and integrated graphics/value for office use. Results stay within budget; an insufficient budget returns a clear minimum-budget action. Suitability labels are heuristics, with no fabricated benchmarks or FPS claims.

Drafts survive refresh. Saved builds, context, reference IDs and timestamps stay in LocalStorage. Shared links contain a validated, versioned parts/context payload without retailer identity. Incoming preset/share context is consumed once so refresh preserves subsequent edits. Share and copy use the clipboard with manual-copy fallback.

Copy Build produces a portable parts list with workload, target, estimated price, system power and compatibility notices. Share Build copies a link that reconstructs the configuration. Request a Quote explains how to take the build to a preferred retailer, with Copy Build and Copy Share Link actions. No personal contact information is collected, and there is no backend quotation submission. Get Help explains the guided configuration flow.

PC and hardware imagery uses locally stored, generated photorealistic studio images: graphite metal, tempered glass, neutral backgrounds, physically grounded shadows and restrained white lighting. Ten optimized JPEG assets live in `public/images/products/`; their mapping is in `src/config/product-images.ts`. Air and liquid coolers have separate images. Images are representative, not verified photographs of exact SKUs; an optional `image` field on each catalog component can supply its real product photo. Generation prompts and provenance are in [docs/product-image-prompts.md](docs/product-image-prompts.md). No runtime image-generation service or external image dependency is used.

The homepage hero lazily renders the existing `rigpilot-demo-pc.glb` in a real R3F scene after its first paint. Scroll opens the glass and panels before separating the GPU, board and cooling into a compact composition; the chassis stays fixed. Hero-specific timing and restrained manifest offsets live in `src/domain/three/homepage-explosion.ts`. The camera is cinematic, with no orbit controls. Mobile keeps smaller components installed; reduced motion keeps the 3D build assembled. Homepage and builder loading use the shared RigPilot mark, Drei asset progress and a short fade into the scene; loading/errors never use a static photo. No hardware labels or connector lines appear, and the builder scene is unchanged. See [docs/hero-assets.md](docs/hero-assets.md).

Generated images must be unbranded and contain no readable labels, model/specification text, stickers, serial numbers or badges. CPU, GPU, Memory and Cooling callouts are rendered separately in semantic HTML/CSS by `ProductCallouts`, using the actual selected catalog data. Desktop callouts use leader lines and markers; smaller screens show a readable specification grid. Never ask an image generator to paint specification text into the photograph.

**All prices and specifications are illustrative prototype data.** Stock, warranty, retailer services and final quotations must be verified with the retailer. No business statistics or unverified contact details are supplied.

## Interactive 3D Preview

Start or load a build, then switch between **Configure** and **3D Preview**. Recommendations offer **Explore in 3D**, and contextual part prompts open and focus the corresponding hardware. **Change GPU** (or another part) returns to its Configure category. `/builder?view=3d` opens Preview using the existing draft; incomplete builds show the reference chassis and selected hardware. Orbit, zoom, glass removal, camera focus/reset, fullscreen and the manifest-driven explode slider remain available.

The homepage leads with an interactive demo at `/#3d-preview`. Three.js and the existing single GLB are prefetched on viewport proximity or intent, with the demo canvas mounted only after activation. The demo never writes builder data. Builder mode loads Three.js only on Preview activation or explicit hover/focus intent. Both viewers render on demand.

Future analytics can listen to `rigpilot:preview` window events; their typed `detail` is defined in `src/domain/three/preview-events.ts`. No analytics service is installed.

This is a representative showcase, including for catalog SKUs with different geometry. HTML panels show the actual selected catalog products, prices and messages from the existing compatibility engine. Geometry does not perform collision checks. The viewer clones the cached scene/materials, preserves installed transforms and renders on demand. WebGL/model failures stay within the preview tab.

Asset generation notes are in [public/assets/3d/README.md](public/assets/3d/README.md). Validation: `npm run typecheck`, `npm test`, `npm run build`, and `npx playwright test tests/flagship3d.spec.ts tests/preview3d.spec.ts`. Browser tests use port 3000 and cover discovery, recommendation/inspection/editing, lazy loading, orbit/zoom, exact assembly, draft persistence, compatibility notices, retry, WebGL fallback and layouts at 1440/1280/1024/768/390px.
