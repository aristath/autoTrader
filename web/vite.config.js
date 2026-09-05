import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "esnext",
    // Vite 8's Oxc minifier corrupts Lit's binding part indexes.
    minify: false,
    outDir: "dist",
  },
});
