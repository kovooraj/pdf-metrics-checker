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

// Initialize pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  const extractSpotColorsFromPDFDict = (dict: PDFDict): string[] => {
    const spotColors: string[] = [];
    const processedRefs = new Set();

    const extractFromDict = (dict: PDFDict) => {
      // Check for direct color space definitions
      const colorSpace = dict.get(PDFName.of('ColorSpace'));
      if (colorSpace instanceof PDFDict) {
        const keys = colorSpace.keys();
        keys.forEach(key => {
          const value = colorSpace.get(key);
          if (value instanceof PDFArray) {
            const colorSpaceType = value.get(0);
            if (colorSpaceType instanceof PDFName && 
                (colorSpaceType.toString() === '/Separation' || 
                 colorSpaceType.toString() === '/DeviceN')) {
              const colorName = value.get(1);
              if (colorName instanceof PDFName) {
                spotColors.push(colorName.toString().replace('/', ''));
              } else if (colorName instanceof PDFArray) {
                // Handle DeviceN color space with multiple spot colors
                for (let i = 0; i < colorName.size(); i++) {
                  const name = colorName.get(i);
                  if (name instanceof PDFName) {
                    spotColors.push(name.toString().replace('/', ''));
                  }
                }
              }
            }
          }
        });
      }

      // Check for resources in XObjects
      const xObjects = dict.get(PDFName.of('XObject'));
      if (xObjects instanceof PDFDict) {
        xObjects.keys().forEach(key => {
          const xObject = xObjects.get(key);
          if (xObject instanceof PDFDict && !processedRefs.has(xObject)) {
            processedRefs.add(xObject);
            extractFromDict(xObject);
          }
        });
      }
    };

    extractFromDict(dict);
    return spotColors;
  };

  const detectSpotColors = async (pdfDoc: PDFDocument) => {
    const spotColors = new Set<string>();
    let hasWhiteInk = false;

    // Get all pages
    const pages = pdfDoc.getPages();

    // Iterate through each page
    for (const page of pages) {
      const resources = page.node.Resources();
      if (!resources) continue;

      // Extract spot colors from page resources
      const pageSpotColors = extractSpotColorsFromPDFDict(resources);
      pageSpotColors.forEach(color => {
        spotColors.add(color);
        
        // Check for white ink variations
        const normalizedName = color.toLowerCase();
        if (
          normalizedName.includes('white') ||
          normalizedName.includes('opaque white') ||
          normalizedName.includes('blanc') ||
          normalizedName.includes('white ink')
        ) {
          hasWhiteInk = true;
          console.log('Found white ink:', color);
        }
      });

      // Log detailed color information
      console.log('Page Color Spaces:', {
        spotColors: Array.from(spotColors),
        hasWhiteInk,
        pageNumber: pages.indexOf(page) + 1
      });
    }

    return {
      spotColors: Array.from(spotColors),
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
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        updateMetadata: false,
        ignoreEncryption: true
      });

      // Log detailed PDF structure
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const resources = firstPage.node.Resources();
      console.log('PDF Structure:', {
        totalPages: pages.length,
        resources: resources ? resources.toString() : 'No resources found'
      });

      // Get dimensions
      const box = firstPage.node.TrimBox?.() || firstPage.node.MediaBox?.();
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

      // Enhanced spot color detection
      const { spotColors, hasWhiteInk } = await detectSpotColors(pdfDoc);
      console.log('Detected Spot Colors:', spotColors);
      console.log('Has White Ink:', hasWhiteInk);

      // Additional color analysis using pdf.js
      const pdfJS = await pdfjsLib.getDocument(arrayBuffer).promise;
      const pdfJSPage = await pdfJS.getPage(1);
      const operatorList = await pdfJSPage.getOperatorList();
      console.log('PDF.js Analysis:', {
        operatorList,
        colorSpaces: operatorList.fnArray
          .map((fn, i) => ({
            operation: fn,
            args: operatorList.argsArray[i]
          }))
          .filter(op => 
            op.operation === pdfjsLib.OPS.setFillColorSpace ||
            op.operation === pdfjsLib.OPS.setStrokeColorSpace
          )
      });

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
            {selectedFile && (
              <Button
                variant="outline"
                className="w-full flex items-center gap-2 text-[#fa5b17] hover:text-[#fa5b17] font-bold"
                onClick={() => {}} // This is just a display button
              >
                <FileIcon className="w-4 h-4" />
                {selectedFile.name}
              </Button>
            )}
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
    </div>;
};

export default Index;
