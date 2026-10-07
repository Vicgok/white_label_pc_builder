# RigPilot product identity

The application is one retailer-neutral product. All identity, positioning, hero copy, accent colors, guidance steps and pricing disclaimers live in `src/config/product.ts` as `productConfig`.

Components read this single configuration. The wordmark renders its product name as text with a small CSS mark, without an external logo. Marketing uses the existing light neutral palette and the builder keeps its dark neutral workspace.

Deploy once with `npm run build` and share the same public URL with every prospect. There is no active retailer selector, retailer query requirement, contact setup or demo theme switcher. Shared build URLs contain only the existing versioned build payload.

RigPilot provides configurations and illustrative estimates. A preferred retailer confirms live prices, availability, assembly and warranty terms. Copy Build and Share Build make configurations portable; Request a Quote provides these actions without a backend.

Future retailer integration can be added as a separate store experience. No tenant infrastructure is implemented in this prototype.
