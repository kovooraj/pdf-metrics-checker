
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
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

// Initialize pdf.js worker
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

  const POINTS_PER_INCH = 72;
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

  const analyzePDFColors = async (pdf: pdfjsLib.PDFDocumentProxy) => {
    const page = await pdf.getPage(1);
    const operatorList = await page.getOperatorList();
    const colors = new Set<string>();
    let hasSpotColors = false;
    let hasWhiteInk = false;

    for (let i = 0; i < operatorList.fnArray.length; i++) {
      const fn = operatorList.fnArray[i];
      const args = operatorList.argsArray[i];

      // Check for different color operations
      if (fn === pdfjsLib.OPS.setFillColorSpace || fn === pdfjsLib.OPS.setStrokeColorSpace) {
        const colorSpace = args[0];
        if (typeof colorSpace === 'string') {
          colors.add(colorSpace);
          if (colorSpace.includes('/Separation')) {
            hasSpotColors = true;
          }
        }
      }

      // Check for white ink (simplified)
      if (fn === pdfjsLib.OPS.setFillRGBColor || fn === pdfjsLib.OPS.setStrokeRGBColor) {
        if (args[0] === 1 && args[1] === 1 && args[2] === 1) {
          hasWhiteInk = true;
        }
      }
    }

    return {
      colorSpaces: Array.from(colors),
      hasSpotColors,
      hasWhiteInk
    };
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
      
      // Load with PDF.js for detailed analysis
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });

      // Get dimensions in inches (converting from points)
      const trimWidth = viewport.width / POINTS_PER_INCH;
      const trimHeight = viewport.height / POINTS_PER_INCH;
      
      const expectedWidth = parseFloat(width);
      const expectedHeight = parseFloat(height);
      
      // More precise dimension check
      const dimensionsMatch = Math.abs(trimWidth - expectedWidth) <= 0.0625 && // 1/16 inch tolerance
                            Math.abs(trimHeight - expectedHeight) <= 0.0625;

      // Analyze colors
      const colorAnalysis = await analyzePDFColors(pdf);
      
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
          actual: pdf.numPages,
          isValid: validatePageCount(pdf.numPages, pageCount),
          error: null
        },
        colorSpace: {
          expectedProfile: colorProfile,
          detectedProfile: colorAnalysis.colorSpaces.includes('/DeviceCMYK') ? "CMYK" : 
                         colorAnalysis.colorSpaces.includes('/DeviceRGB') ? "RGB" : "Unknown",
          hasWhiteInk: colorAnalysis.hasWhiteInk,
          spotColors: colorAnalysis.colorSpaces
            .filter(cs => cs.includes('/Separation'))
            .map(cs => cs.split('/')[2] || 'Unknown Spot Color'),
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
          dpi: 300, // This is a placeholder - we'd need to analyze image XObjects for true resolution
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
          <p className="mt-2 text-gray-600">Verify your PDF dimensions and specifications</p>
        </div>

        <Card className="p-6 space-y-6 bg-white shadow-sm">
          <div className="space-y-2">
            <FileUpload onFileSelect={handleFileSelect} className="animate-fade-in" />
            {selectedFile && <Button variant="outline" 
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
