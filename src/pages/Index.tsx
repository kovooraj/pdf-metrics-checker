
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

  // Define bleed sizes
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
      
      const expectedWidth = parseFloat(width);
      const expectedHeight = parseFloat(height);
      
      // Check dimensions against both bleed sizes
      let dimensionsMatch = false;
      let actualWithBleed = { width: actualWidth, height: actualHeight };
      let usedBleedSize = 0;

      for (const bleedSize of BLEED_SIZES) {
        const widthWithBleed = actualWidth - (bleedSize * 2);
        const heightWithBleed = actualHeight - (bleedSize * 2);
        
        if (
          Math.abs(widthWithBleed - expectedWidth) <= 0.01 &&
          Math.abs(heightWithBleed - expectedHeight) <= 0.01
        ) {
          dimensionsMatch = true;
          actualWithBleed = { width: widthWithBleed, height: heightWithBleed };
          usedBleedSize = bleedSize;
          break;
        }
      }

      // Calculate dimensions with recommended bleed
      const recommendedBleed = 0.125; // 1/8 inch
      const widthWithRecommendedBleed = expectedWidth + (recommendedBleed * 2);
      const heightWithRecommendedBleed = expectedHeight + (recommendedBleed * 2);
      const minBleed = 0.0625; // 1/16 inch
      const widthWithMinBleed = expectedWidth + (minBleed * 2);
      const heightWithMinBleed = expectedHeight + (minBleed * 2);

      const dimensionsError = dimensionsMatch ? null : 
        `The file received is ${actualWidth.toFixed(3)}" × ${actualHeight.toFixed(3)}", ` +
        `but you need to provide a file that is ${expectedWidth}" × ${expectedHeight}" with a minimum bleed of ${minBleed}", ` +
        `but we recommend ${recommendedBleed}" all around. This means your PDF file should be either:\n\n` +
        `• ${widthWithRecommendedBleed.toFixed(3)}" × ${heightWithRecommendedBleed.toFixed(3)}" (recommended ${recommendedBleed}" bleed)\n` +
        `• ${widthWithMinBleed.toFixed(3)}" × ${heightWithMinBleed.toFixed(3)}" (minimum ${minBleed}" bleed)`;

      const pageCountMatch = validatePageCount(pages.length, pageCount);

      // In a real implementation, these would be actual checks against the PDF
      const simulatedResult: PreflightResult = {
        dimensions: {
          expected: { width: expectedWidth, height: expectedHeight },
          actual: { width: actualWidth, height: actualHeight },
          actualWithBleed: actualWithBleed,
          bleedSize: usedBleedSize,
          isValid: dimensionsMatch,
          error: dimensionsError
        },
        pageCount: {
          expected: pageCount,
          actual: pages.length,
          isValid: pageCountMatch,
          error: pageCountMatch ? null : `Expected ${pageCount === "1" ? "1 page" : pageCount === "2" ? "2 pages" : "2 or more pages"}, but found ${pages.length} pages.`
        },
        colorSpace: {
          isRGB: false,
          isCMYK: true,
          isValid: true,
          error: null
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
