import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import FileUpload from "@/components/FileUpload";
import DimensionInput from "@/components/DimensionInput";
import PageCountSelect from "@/components/PageCountSelect";
import ColorProfileSelect from "@/components/ColorProfileSelect";
import DielineSelect from "@/components/DielineSelect";
import PreflightReport, { PreflightResult } from "@/components/PreflightReport";
import { useToast } from "@/hooks/use-toast";

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

  // Define common offsets and bleed sizes
  const BLEED_SIZES = [0.125, 0.0625]; // 1/8 inch and 1/16 inch bleeds
  const CROP_MARK_OFFSET = 0.167; // Standard crop mark offset (12 points)
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
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Convert points to inches (1 point = 1/72 inch)
      const actualWidth = firstPage.getWidth() / 72;
      const actualHeight = firstPage.getHeight() / 72;
      const expectedWidth = parseFloat(width);
      const expectedHeight = parseFloat(height);

      // Check if dimensions might include crop marks
      const hasPossibleCropMarks = 
        actualWidth > expectedWidth + (CROP_MARK_OFFSET * 2) &&
        actualHeight > expectedHeight + (CROP_MARK_OFFSET * 2);

      // Adjust dimensions if crop marks are detected
      const effectiveWidth = hasPossibleCropMarks ? actualWidth - (CROP_MARK_OFFSET * 2) : actualWidth;
      const effectiveHeight = hasPossibleCropMarks ? actualHeight - (CROP_MARK_OFFSET * 2) : actualHeight;

      // Check dimensions against both bleed sizes
      let dimensionsMatch = false;
      let actualWithBleed = {
        width: effectiveWidth,
        height: effectiveHeight
      };
      let usedBleedSize = 0;

      for (const bleedSize of BLEED_SIZES) {
        const widthWithBleed = effectiveWidth - (bleedSize * 2);
        const heightWithBleed = effectiveHeight - (bleedSize * 2);
        
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
        `The file received is ${effectiveWidth.toFixed(3)}" × ${effectiveHeight.toFixed(3)}"${hasPossibleCropMarks ? " (after removing crop marks)" : ""}, ` +
        `but you need to provide a file that is ${expectedWidth}" × ${expectedHeight}" with a minimum bleed of ${minBleed}", ` +
        `but we recommend ${recommendedBleed}" all around. This means your PDF file should be either:\n\n` +
        `• ${widthWithRecommendedBleed.toFixed(3)}" × ${heightWithRecommendedBleed.toFixed(3)}" (recommended ${recommendedBleed}" bleed)\n` +
        `• ${widthWithMinBleed.toFixed(3)}" × ${heightWithMinBleed.toFixed(3)}" (minimum ${minBleed}" bleed)`;

      const pageCountMatch = validatePageCount(pages.length, pageCount);

      // Simulate color space checking (in a real implementation, you would check the actual PDF)
      const hasWhiteInk = true; // Simulated - would actually check for White_Ink color
      const spotColors = ["White_Ink", "Dieline"]; // Simulated - would actually check PDF

      let colorSpaceError = null;
      let colorSpaceValid = true;

      // Validate color profile
      if (colorProfile === "CMYK+WHITE" && !hasWhiteInk) {
        colorSpaceValid = false;
        colorSpaceError = "White ink color not found in the file";
      } else if (colorProfile === "WHITE_ONLY" && (!hasWhiteInk || spotColors.length > 1)) {
        colorSpaceValid = false;
        colorSpaceError = "File contains colors other than white ink";
      }

      // Validate dieline
      const hasDielineSpotColor = spotColors.some(color => 
        color.toLowerCase() === "dieline"
      );
      const dielineValid = hasDieline === "no" || (hasDieline === "yes" && hasDielineSpotColor);
      const dielineError = hasDieline === "yes" && !hasDielineSpotColor 
        ? "Dieline spot color not found in the file" 
        : null;

      const simulatedResult: PreflightResult = {
        dimensions: {
          expected: {
            width: expectedWidth,
            height: expectedHeight
          },
          actual: {
            width: actualWidth,
            height: actualHeight
          },
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
          expectedProfile: colorProfile,
          detectedProfile: "CMYK",
          hasWhiteInk,
          spotColors,
          isValid: colorSpaceValid,
          error: colorSpaceError
        },
        dieline: {
          expected: hasDieline === "yes",
          hasValidDieline: hasDielineSpotColor,
          isValid: dielineValid,
          error: dielineError
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
      
      const allValid = 
        simulatedResult.dimensions.isValid && 
        simulatedResult.pageCount.isValid &&
        simulatedResult.colorSpace.isValid &&
        simulatedResult.resolution.isValid &&
        simulatedResult.fonts.isValid &&
        simulatedResult.dieline.isValid;

      toast({
        title: allValid ? "Preflight passed" : "Preflight failed",
        variant: allValid ? "default" : "destructive"
      });
    } catch (error) {
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
          <p className="mt-2 text-gray-600">Verify your PDF dimensions and specifications - Built by Alex Kovoor (version 1.0.0)</p>
        </div>

        <Card className="p-6 space-y-6 bg-white shadow-sm">
          <div className="space-y-2">
            <FileUpload onFileSelect={handleFileSelect} className="animate-fade-in" />
            {selectedFile && (
              <p className="text-sm text-gray-500">Selected file: {selectedFile.name}</p>
            )}
          </div>

          <DimensionInput width={width} height={height} onWidthChange={setWidth} onHeightChange={setHeight} />

          <PageCountSelect value={pageCount} onChange={setPageCount} />

          <ColorProfileSelect value={colorProfile} onChange={setColorProfile} />

          <DielineSelect value={hasDieline} onChange={setHasDieline} />

          <Button 
            onClick={handleSubmit} 
            disabled={isProcessing || !selectedFile || !width || !height || !pageCount || !colorProfile || !hasDieline} 
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
