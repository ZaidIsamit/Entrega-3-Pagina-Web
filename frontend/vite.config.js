import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En desarrollo (npm run dev) las llamadas a /api se redirigen a la API local.
// En Docker, nginx hace lo mismo (ver nginx.conf).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": process.env.VITE_API_PROXY || "http://localhost:3000"
    }
  }
});
