import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // El repo vive en una unidad de red (Z:/SMB): el watcher nativo falla con
    // `stat UNKNOWN` cuando el share parpadea. Polling con intervalo holgado +
    // ignorar node_modules reduce la presión de stat sobre la red y lo estabiliza.
    watch: {
      usePolling: true,
      interval: 700,
      ignored: ["**/node_modules/**", "**/.git/**"],
    },
  },
});
