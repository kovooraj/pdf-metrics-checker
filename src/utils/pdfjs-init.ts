
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

// Initialize PDF.js worker with local worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default pdfjsLib;
