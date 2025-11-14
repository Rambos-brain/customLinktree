import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "@rollup/wasm-node";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      plugins: [wasm()]
    }
  }
});
