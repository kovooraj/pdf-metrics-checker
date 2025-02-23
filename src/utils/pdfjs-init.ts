
import * as pdfjsLib from 'pdfjs-dist';

const initPdfJs = () => {
  if (typeof window !== 'undefined') {
    // Use CloudFlare CDN for reliability
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
};

export default initPdfJs;
