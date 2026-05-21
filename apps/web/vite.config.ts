import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Cible interne du proxy Vite (server-side) :
// - en local hors Docker : http://localhost:3001 (Fastify sur le host)
// - en dev Docker : http://api:3001 (résolution réseau du service compose)
// NB: différent de VITE_API_URL qui sert au client (browser), où "localhost"
// est l'host du dev, pas le container web.
const proxyTarget = process.env.API_PROXY_TARGET || "http://localhost:3001";

export default defineConfig({
  envDir: path.resolve(__dirname, "../.."),
  server: {
    host: "::",
    port: 5173,
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
      },
      "/uploads": {
        target: proxyTarget,
        changeOrigin: true,
      },
      "/sitemap.xml": {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    // Force VITE_API_URL vide en tests pour que les fetch passent en chemin relatif
    // (sinon le .env racine met une URL absolue qui désynchronise les handlers MSW).
    env: {
      VITE_API_URL: "",
    },
  },
});
