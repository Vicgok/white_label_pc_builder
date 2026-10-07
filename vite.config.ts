import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { productConfig } from "./src/config/product";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "product-metadata",
      transformIndexHtml(html) {
        const escapeAttribute = (value: string) =>
          value
            .replaceAll("&", "&amp;")
            .replaceAll('"', "&quot;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");
        return html
          .replace(
            "%PRODUCT_TITLE%",
            escapeAttribute(`${productConfig.name} | ${productConfig.tagline}`),
          )
          .replace(
            "%PRODUCT_DESCRIPTION%",
            escapeAttribute(productConfig.description),
          );
      },
    },
  ],
  server: { host: "0.0.0.0", port: 3000 },
  test: { include: ["src/**/*.test.ts"] },
} as Parameters<typeof defineConfig>[0]);
