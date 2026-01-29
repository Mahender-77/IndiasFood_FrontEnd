import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  optimizeDeps: {
    exclude: ["olamaps-web-sdk"],
  },

  define: {
    "process.env": {},
  },

  // 🔥 THIS IS THE IMPORTANT FIX
  build: {
    target: "es2022",
  },

  esbuild: {
    target: "es2022",
  },
}));
