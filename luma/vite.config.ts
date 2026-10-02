import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the built prop runs from any folder / static host / USB stick.
export default defineConfig({
  base: "./",
  plugins: [react()],
  // Isolate from the parent RTG project's PostCSS/Tailwind config.
  css: { postcss: { plugins: [] } },
  server: { port: 5174, host: true },
});
