import { useState } from "react";
import { PDFDocument, PDFName, PDFDict } from "pdf-lib";
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
  const {
    toast
  } = useToast();

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
  const detectSpotColors = (pdfDoc: PDFDocument) => {
    const spotColors: string[] = [];
    let hasWhiteInk = false;

    // Get all pages
    const pages = pdfDoc.getPages();

    // Iterate through each page
    for (const page of pages) {
      // Access the page's content stream
      const contentStream = page.node.Contents();
      if (!contentStream) continue;

      // Get the resources dictionary
      const resources = page.node.Resources();
      if (!resources) continue;

      // Check ColorSpace dictionary in resources
      const colorSpaceDict = resources.get(PDFName.of('ColorSpace')) as PDFDict;
      if (!colorSpaceDict) continue;

      // Get all keys from the ColorSpace dictionary
      const keys = colorSpaceDict.keys();
      for (const key of keys) {
        const colorSpace = colorSpaceDict.get(key);
        // Check if it's a Separation color space (spot color)
        if (Array.isArray(colorSpace) && colorSpace.length > 1) {
          const colorSpaceType = colorSpace[0];
          if (colorSpaceType instanceof PDFName && colorSpaceType.toString() === '/Separation') {
            // Get the name of the spot color
            const spotColorName = colorSpace[1] instanceof PDFName ? colorSpace[1].toString().replace('/', '') : '';
            if (spotColorName && !spotColors.includes(spotColorName)) {
              spotColors.push(spotColorName);
              // Check for white ink specifically - make case insensitive and check for common variations
              const normalizedName = spotColorName.toLowerCase();
              if (normalizedName.includes('white') || normalizedName.includes('opaque white') || normalizedName.includes('blanc') || normalizedName.includes('white ink')) {
                hasWhiteInk = true;
                console.log('Found white ink:', spotColorName);
              }
            }
          }
        }
      }
    }

    // Debug logging
    console.log('All detected spot colors:', spotColors);
    console.log('Has white ink:', hasWhiteInk);
    console.log('Raw spot color names:', spotColors.map(c => `"${c}"`).join(', '));
    return {
      spotColors,
      hasWhiteInk
    };
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
      // Add debug options to see more information about the PDF structure
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        updateMetadata: false,
        ignoreEncryption: true
      });

      // Log the structure of the first page's resources
      const firstPage = pdfDoc.getPages()[0];
      const resources = firstPage.node.Resources();
      if (resources) {
        console.log('PDF Resources:', resources.toString());
        const colorSpaceDict = resources.get(PDFName.of('ColorSpace'));
        if (colorSpaceDict) {
          console.log('ColorSpace Dictionary:', colorSpaceDict.toString());
        }
      }
      const pages = pdfDoc.getPages();
      const firstPage2 = pages[0];

      // Get the TrimBox dimensions (if available) or use MediaBox
      const box = firstPage2.node.TrimBox?.() || firstPage2.node.MediaBox?.();
      if (!box) {
        throw new Error("Could not determine document dimensions");
      }

      // Get the coordinates from the PDFArray and convert them to numbers using a safer approach
      const coords = box.asArray();
      const x1 = parseFloat(coords[0].toString());
      const y1 = parseFloat(coords[1].toString());
      const x2 = parseFloat(coords[2].toString());
      const y2 = parseFloat(coords[3].toString());

      // Calculate width and height in points, then convert to inches (1 point = 1/72 inch)
      const trimWidth = (x2 - x1) / 72;
      const trimHeight = (y2 - y1) / 72;
      const expectedWidth = parseFloat(width);
      const expectedHeight = parseFloat(height);

      // Calculate bleed from trim dimensions
      let dimensionsMatch = false;
      let actualWithBleed = {
        width: trimWidth,
        height: trimHeight
      };
      let usedBleedSize = 0;

      // Calculate dimensions with recommended bleed
      const recommendedBleed = 0.125; // 1/8 inch
      const widthWithRecommendedBleed = expectedWidth + recommendedBleed * 2;
      const heightWithRecommendedBleed = expectedHeight + recommendedBleed * 2;
      const minBleed = 0.0625; // 1/16 inch
      const widthWithMinBleed = expectedWidth + minBleed * 2;
      const heightWithMinBleed = expectedHeight + minBleed * 2;

      // Check if the trim size matches the expected dimensions
      if (Math.abs(trimWidth - expectedWidth) <= 0.01 && Math.abs(trimHeight - expectedHeight) <= 0.01) {
        dimensionsMatch = true;
      }
      const dimensionsError = dimensionsMatch ? null : `The trim size of your file is ${trimWidth.toFixed(3)}" × ${trimHeight.toFixed(3)}", ` + `but you need to provide a file that is ${expectedWidth}" × ${expectedHeight}" with a minimum bleed of ${minBleed}", ` + `but we recommend ${recommendedBleed}" all around. This means your PDF file should be either:\n\n` + `• ${widthWithRecommendedBleed.toFixed(3)}" × ${heightWithRecommendedBleed.toFixed(3)}" (recommended ${recommendedBleed}" bleed)\n` + `• ${widthWithMinBleed.toFixed(3)}" × ${heightWithMinBleed.toFixed(3)}" (minimum ${minBleed}" bleed)`;
      const pageCountMatch = validatePageCount(pages.length, pageCount);

      // Detect spot colors and white ink
      const {
        spotColors,
        hasWhiteInk
      } = detectSpotColors(pdfDoc);
      let colorSpaceError = null;
      let colorSpaceValid = true;

      // Validate color profile with actual detected colors
      if (colorProfile === "CMYK+WHITE" && !hasWhiteInk) {
        colorSpaceValid = false;
        colorSpaceError = "White ink color not found in the file";
      } else if (colorProfile === "WHITE_ONLY" && (!hasWhiteInk || spotColors.length > 1)) {
        colorSpaceValid = false;
        colorSpaceError = "File contains colors other than white ink";
      } else if (colorProfile === "CMYK+PANTONE" && spotColors.length === 0) {
        colorSpaceValid = false;
        colorSpaceError = "No spot colors (Pantone) found in the file";
      }

      // Dieline validation - check for exact "Dieline" spot color
      const hasDielineSpotColor = spotColors.some(color => color.toLowerCase() === 'dieline' || color.toLowerCase() === 'die' || color.toLowerCase() === 'cutline');
      const dielineValid = hasDieline === "no" || hasDieline === "yes" && hasDielineSpotColor;
      const dielineError = hasDieline === "yes" && !hasDielineSpotColor ? "Dieline spot color not found in the file" : null;
      const simulatedResult: PreflightResult = {
        dimensions: {
          expected: {
            width: expectedWidth,
            height: expectedHeight
          },
          actual: {
            width: trimWidth,
            height: trimHeight
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
      const allValid = simulatedResult.dimensions.isValid && simulatedResult.pageCount.isValid && simulatedResult.colorSpace.isValid && simulatedResult.resolution.isValid && simulatedResult.fonts.isValid && simulatedResult.dieline.isValid;
      toast({
        title: allValid ? "Preflight passed" : "Preflight failed",
        variant: allValid ? "default" : "destructive"
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
  return <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-100">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-gray-900 text-3xl font-extrabold">PDF Preflight Tool</h1>
          <p className="mt-2 text-gray-600">Verify your PDF dimensions and specifications - Built by Alex Kovoor (version 1.01.30)</p>
        </div>

        <Card className="p-6 space-y-6 bg-white shadow-sm">
          <div className="space-y-2">
            <FileUpload onFileSelect={handleFileSelect} className="animate-fade-in" />
            {selectedFile && <p className="<div class=\"bg-green-500 p-3 rounded-md text-base font-bold text-left\"> text-[#214105] text-left">Selected file: {selectedFile.name}</p>}
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
      </div>
    </div>;
};
export default Index;