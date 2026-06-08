import { defineConfig, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

const appRoot = path.resolve(__dirname);
const highwayHustleFrontendSrc = path.resolve(
  __dirname,
  "../../highway-hustle/highway-hustle-frontend/src"
);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    hmr: {
      overlay: false,
    },
    fs: {
      allow: [
        searchForWorkspaceRoot(__dirname),
        appRoot,
        highwayHustleFrontendSrc,
      ],
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@highway-hustle": highwayHustleFrontendSrc,
    },
  },
}));
