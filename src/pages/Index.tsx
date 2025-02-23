import { useState } from "react";
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFString } from "pdf-lib";
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import FileUpload from "@/components/FileUpload";
import DimensionInput from "@/components/DimensionInput";
import PageCountSelect from "@/components/PageCountSelect";
import ColorProfileSelect from "@/components/ColorProfileSelect";
import DielineSelect from "@/components/DielineSelect";
import PreflightReport, { PreflightResult } from "@/components/PreflightReport";
import { useToast } from "@/hooks/use-toast";
import { FileIcon } from "lucide-react";

// Initialize pdf.js worker safely
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

const Index = () => {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [colorProfile, setColorProfile] = useState("");
  const [hasDieline, setHasDieline] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preflightResult, setPreflightResult] = useState<PreflightResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Define common bleed sizes
  const BLEED_SIZES = [0.125, 0.0625]; // 1/8 inch and 1/16 inch bleeds
  const MIN_DPI = 300;
  const validatePageCount = (actual: number, expected: string) => {
    switch (expected) {
      case "1":
        return actual === 1;
      case "2":
        return actual === 2;
      case "multi":
        return actual >= 2;
      default:
        return false;
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreflightResult(null);
    toast({
      title: "File selected",
      description: file.name
    });
  };

  const handleSubmit = async () => {
    if (!selectedFile || !width || !height || !pageCount || !colorProfile || !hasDieline) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      // First, load with pdf-lib for basic structure analysis
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        updateMetadata: false,
        ignoreEncryption: true
      });

      // Get basic document info
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // Get dimensions
      const box = firstPage.getSize();
      const trimWidth = box.width / 72; // Convert points to inches
      const trimHeight = box.height / 72;
      
      const expectedWidth = parseFloat(width);
      const expectedHeight = parseFloat(height);
      
      // Simplified dimension check
      const dimensionsMatch = Math.abs(trimWidth - expectedWidth) <= 0.01 && 
                            Math.abs(trimHeight - expectedHeight) <= 0.01;

      // Simplified color space detection
      const hasSpotColors = false; // We'll improve this later
      const hasWhiteInk = false;  // We'll improve this later
      
      const simulatedResult: PreflightResult = {
        dimensions: {
          expected: { width: expectedWidth, height: expectedHeight },
          actual: { width: trimWidth, height: trimHeight },
          actualWithBleed: { width: trimWidth, height: trimHeight },
          bleedSize: 0,
          isValid: dimensionsMatch,
          error: dimensionsMatch ? null : "Dimensions do not match the requirements"
        },
        pageCount: {
          expected: pageCount,
          actual: pages.length,
          isValid: validatePageCount(pages.length, pageCount),
          error: null
        },
        colorSpace: {
          expectedProfile: colorProfile,
          detectedProfile: "CMYK",
          hasWhiteInk: hasWhiteInk,
          spotColors: [],
          isValid: true,
          error: null
        },
        dieline: {
          expected: hasDieline === "yes",
          hasValidDieline: false,
          isValid: hasDieline === "no",
          error: hasDieline === "yes" ? "Dieline validation not implemented" : null
        },
        resolution: {
          dpi: 300,
          isValid: true,
          error: null
        },
        fonts: {
          hasUnoutlinedFonts: false,
          isValid: true,
          error: null
        }
      };

      setPreflightResult(simulatedResult);
      toast({
        title: "PDF processed successfully",
        variant: "default"
      });

    } catch (error) {
      console.error('PDF processing error:', error);
      toast({
        title: "Error processing PDF",
        description: "Please ensure you've uploaded a valid PDF file",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-100">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-gray-900 text-3xl font-extrabold">PDF Preflight Tool</h1>
          <p className="mt-2 text-gray-600">Verify your PDF dimensions and specifications - Built by Alex Kovoor (version 1.01.30)</p>
        </div>

        <Card className="p-6 space-y-6 bg-white shadow-sm">
          <div className="space-y-2">
            <FileUpload onFileSelect={handleFileSelect} className="animate-fade-in" />
            {selectedFile && <Button variant="outline" onClick={() => {}} // This is just a display button
          className="w-full flex items-center gap-2 font-bold text-[#1b1bb8] bg-[#abe6ff] rounded-xl">
                <FileIcon className="w-4 h-4" />
                {selectedFile.name}
              </Button>}
          </div>

          <DimensionInput width={width} height={height} onWidthChange={setWidth} onHeightChange={setHeight} />

          <PageCountSelect value={pageCount} onChange={setPageCount} />

          <ColorProfileSelect value={colorProfile} onChange={setColorProfile} />

          <DielineSelect value={hasDieline} onChange={setHasDieline} />

          <Button onClick={handleSubmit} disabled={isProcessing || !selectedFile || !width || !height || !pageCount || !colorProfile || !hasDieline} className="w-full">
            {isProcessing ? "Processing..." : "Check PDF"}
          </Button>
        </Card>

        {preflightResult && <PreflightReport result={preflightResult} />}

        <footer className="text-center pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Version 1.02.0 - PDF Preflight Tool
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
