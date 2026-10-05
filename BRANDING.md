# Add or personalize a retailer

All retailer content lives in `src/config/brands.ts`. Generic UI components obtain it through `useBrand()` and semantic theme variables.

1. Copy an existing `BrandConfig` entry under a new key matching its `id`.
2. Set name, short name, tagline, theme colors, hero copy and trust points. Use dark primary colors for readable white button text.
3. Add only verified contact information, locations and service claims. Omit unknown fields. WhatsApp must include the country code; an empty number hides all WhatsApp actions. Instagram accepts a handle or HTTPS profile URL.
4. Optionally put a logo in `public/` and set `logo: '/your-logo.svg'`. Without a logo, the configured short name renders as a wordmark.
5. Copy `.env.example` to `.env.local` and set `VITE_ACTIVE_BRAND=mybrand`. Restart Vite after changing environment variables; production variables are applied at build time.

No generic component edits are needed. The development `/demo` switcher automatically includes the new entry.

Preview with `/?brand=mybrand`. The query overrides the environment setting, which overrides the default (`byos`). Invalid brand IDs show a small notice and the fallback retailer. Internal navigation and shared build links preserve branding.

Example fields to add to **your verified brand entry**:

```ts
contact: {
  whatsapp: 'COUNTRY_CODE_AND_VERIFIED_NUMBER', // replace with digits, no placeholder in a public demo
  phone: 'VERIFIED_PHONE_NUMBER',
  email: 'VERIFIED_EMAIL',
  instagram: 'VERIFIED_HANDLE',
  address: 'VERIFIED_ADDRESS',
},
locations: [{ name: 'VERIFIED_STORE_NAME', address: 'VERIFIED_ADDRESS' }],
```

The supplied retailer names come from the project brief. Colors and copy are preview choices, not assertions about official brand guidelines. Default trust copy describes configurator guidance; assembly, stress testing, warranty and service commitments require retailer confirmation before being published as claims.
