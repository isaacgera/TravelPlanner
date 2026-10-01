import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Option B experiment: Svelte 5 + Vite.
// base "./" keeps built asset paths relative so a `vite build` output can be
// opened from a static host subfolder (mirrors the shipped app's portability).
export default defineConfig({
  base: "./",
  plugins: [svelte()],
});
