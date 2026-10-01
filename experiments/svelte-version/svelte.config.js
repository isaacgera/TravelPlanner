import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  // Svelte 5 defaults to runes mode when runes are used; vitePreprocess lets
  // us use modern JS/CSS features inside <script>/<style> blocks.
  preprocess: vitePreprocess(),
};
