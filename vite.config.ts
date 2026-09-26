import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rolldownOptions: {
      output: {
        // Three.js wird nur über den lazy geladenen NeuralTerrainCanvas erreicht und bleibt damit
        // aus dem Einstiegs-Chunk heraus. React Three Fiber importiert den kompletten THREE-Namespace,
        // Tree-Shaking greift dort nicht. Als ein Chunk läge Three.js bei rund 737 kB. Deshalb wird es
        // entlang seiner eigenen Build-Dateien geteilt: three.core.js und der Rest von three.
        // Beide Teile bleiben unter der Standardgrenze von 500 kB und werden parallel geladen.
        codeSplitting: {
          groups: [
            { name: "three-core", test: /[\\/]node_modules[\\/]three[\\/]build[\\/]three\.core\.js$/ },
            { name: "three", test: /[\\/]node_modules[\\/]three[\\/]/ },
          ],
        },
      },
    },
  },
});
