
import * as pdfjsLib from 'pdfjs-dist';

const initPdfJs = () => {
  if (typeof window !== 'undefined') {
    try {
      // Try to use local worker first
      const worker = new Worker(
        new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url),
        { type: 'module' }
      );
      pdfjsLib.GlobalWorkerOptions.workerPort = worker;
    } catch (error) {
      console.log('Falling back to CDN worker');
      // Fallback to CDN if local worker fails
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
  }
};

export default initPdfJs;
