import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 45173,
    proxy: {
      "/api": {
        target: "http://localhost:48000",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "esnext",
    outDir: "dist",
  },
});
