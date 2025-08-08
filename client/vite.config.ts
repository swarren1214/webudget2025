// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Removed flowbitePlugin import; it's only for Tailwind, not Vite

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    emptyOutDir: true,
  },
  // Configure Vite to load .env files from the project root
  envDir: path.resolve(__dirname, ".."),
  server: {
    https: {
      key: process.env.SSL_KEY_PATH || path.resolve(__dirname, "../certs/localhost-key.pem"),
      cert: process.env.SSL_CERT_PATH || path.resolve(__dirname, "../certs/localhost.pem"),
    },
  },
});