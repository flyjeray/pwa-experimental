import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'

export default ({ mode }: { mode: string }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    base: process.env.VITE_URL_BASE || "/",
    plugins: [react(), tailwindcss()],
    css: {
      modules: {
        localsConvention: "camelCase",
      },
    },
  });
};
