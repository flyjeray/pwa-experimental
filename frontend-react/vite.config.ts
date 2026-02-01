import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "/pwa-experimental/",
  plugins: [
    react(),
    VitePWA({
      manifest: {
        short_name: "PWA Guide",
        start_url: "/pwa-experimental/",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      },
    }),
  ],
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});
