import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: "0.0.0.0",
    port: 5173,

    https: {
      key: fs.readFileSync(path.resolve(__dirname, "certs/dev-key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "certs/dev-cert.pem")),
    },

    proxy: {
      "/api": {
        target: "http://backend:8000",
        changeOrigin: true,
      },

      "/media": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
    },
  },
});
