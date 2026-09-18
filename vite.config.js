import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "https://panipuristore.onrender.com",
        changeOrigin: true,
      },
      "/uploads": {
        target: "https://panipuristore.onrender.com",
        changeOrigin: true,
      },
      "/ws": {
        target: "https://panipuristore.onrender.com",
        ws: true,
      },
    },
  },
  define: {
    global: "window",
  },
});
