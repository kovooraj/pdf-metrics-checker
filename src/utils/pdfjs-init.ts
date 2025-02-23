
import * as pdfjsLib from 'pdfjs-dist';

const initPdfJs = () => {
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.js`;
  }
};

export default initPdfJs;
