import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  appType: "mpa",
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "pages/login.html"),
        dashboard: resolve(__dirname, "pages/dashboard.html"),
        inventory: resolve(__dirname, "pages/inventory.html"),
        orders: resolve(__dirname, "pages/orders.html"),
        patients: resolve(__dirname, "pages/patients.html"),
        pos: resolve(__dirname, "pages/pos.html"),
        prescriptions: resolve(__dirname, "pages/prescriptions.html")
      }
    }
  }
});