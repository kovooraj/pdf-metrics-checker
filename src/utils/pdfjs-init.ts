
import * as pdfjsLib from 'pdfjs-dist';

const initPdfJs = () => {
  if (typeof window !== 'undefined') {
    // Force HTTPS and specific version
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;
  }
};

export default initPdfJs;
