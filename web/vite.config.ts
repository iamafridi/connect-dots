import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root,
  base: "./",
  plugins: [react()],
  build: {
    outDir: path.resolve(root, "..", "public"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    watch: {
      ignored: ["**/*.mp4", "**/public/**"],
    },
  },
});