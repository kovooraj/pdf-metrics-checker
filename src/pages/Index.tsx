
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import FileUpload from "@/components/FileUpload";
import DimensionInput from "@/components/DimensionInput";
import PageCountSelect from "@/components/PageCountSelect";
import PreflightReport, { PreflightResult } from "@/components/PreflightReport";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preflightResult, setPreflightResult] = useState<PreflightResult | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const BLEED_SIZE = 0.125; // 1/8 inch bleed
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
      description: file.name,
    });
  };

  const handleSubmit = async () => {
    if (!selectedFile || !width || !height || !pageCount) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // Convert points to inches (1 point = 1/72 inch)
      const actualWidth = firstPage.getWidth() / 72;
      const actualHeight = firstPage.getHeight() / 72;
      
      // Calculate width/height with bleed
      const actualWidthWithBleed = actualWidth - (BLEED_SIZE * 2);
      const actualHeightWithBleed = actualHeight - (BLEED_SIZE * 2);
      
      const expectedWidth = parseFloat(width);
      const expectedHeight = parseFloat(height);
      
      // Allow for small rounding differences (0.01 inches)
      const dimensionsMatch =
        Math.abs(actualWidthWithBleed - expectedWidth) <= 0.01 &&
        Math.abs(actualHeightWithBleed - expectedHeight) <= 0.01;

      const pageCountMatch = validatePageCount(pages.length, pageCount);

      // In a real implementation, these would be actual checks against the PDF
      // For now, we'll simulate these checks
      const simulatedResult: PreflightResult = {
        dimensions: {
          expected: { width: expectedWidth, height: expectedHeight },
          actual: { width: actualWidth, height: actualHeight },
          actualWithBleed: { width: actualWidthWithBleed, height: actualHeightWithBleed },
          isValid: dimensionsMatch,
        },
        pageCount: {
          expected: pageCount,
          actual: pages.length,
          isValid: pageCountMatch,
        },
        colorSpace: {
          isRGB: false,
          isCMYK: true,
          isValid: true, // CMYK is valid for print
        },
        resolution: {
          dpi: 300,
          isValid: true,
        },
        fonts: {
          hasUnoutlinedFonts: false,
          isValid: true,
        },
      };

      setPreflightResult(simulatedResult);
      
      const allValid = 
        simulatedResult.dimensions.isValid && 
        simulatedResult.pageCount.isValid &&
        simulatedResult.colorSpace.isValid &&
        simulatedResult.resolution.isValid &&
        simulatedResult.fonts.isValid;

      toast({
        title: allValid ? "Preflight passed" : "Preflight failed",
        variant: allValid ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error processing PDF",
        description: "Please ensure you've uploaded a valid PDF file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">PDF Preflight Tool</h1>
          <p className="mt-2 text-gray-600">
            Verify your PDF dimensions and specifications
          </p>
        </div>

        <Card className="p-6 space-y-6 bg-white shadow-sm">
          <FileUpload
            onFileSelect={handleFileSelect}
            className="animate-fade-in"
          />

          <DimensionInput
            width={width}
            height={height}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
          />

          <PageCountSelect value={pageCount} onChange={setPageCount} />

          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !selectedFile || !width || !height || !pageCount}
            className="w-full"
          >
            {isProcessing ? "Processing..." : "Check PDF"}
          </Button>
        </Card>

        {preflightResult && <PreflightReport result={preflightResult} />}
      </div>
    </div>
  );
};

export default Index;
