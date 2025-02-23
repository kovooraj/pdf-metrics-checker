
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
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
    exclude: ['pdfjs-dist/build/pdf.worker.js']
  },
  build: {
    commonjsOptions: {
      include: [/pdfjs-dist/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          pdfWorker: ['pdfjs-dist/build/pdf.worker.js'],
        },
      },
    },
  }
}));
