
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker using a direct path
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export default pdfjsLib;
