
import * as pdfjsLib from 'pdfjs-dist';

// Initialize pdf.js worker using the bundled worker
const initPdfJs = () => {
  if (typeof window !== 'undefined') {
    const pdfjsWorker = new Worker(
      new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url)
    );
    pdfjsLib.GlobalWorkerOptions.workerPort = pdfjsWorker;
  }
};

export default initPdfJs;
