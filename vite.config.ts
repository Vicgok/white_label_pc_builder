import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: false, port: 3000 },
  test: { include: ["src/**/*.test.ts"] },
} as Parameters<typeof defineConfig>[0]);
