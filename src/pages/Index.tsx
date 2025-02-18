
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
      
      // Allow for small rounding differences (0.1 inches)
      const dimensionsMatch =
        Math.abs(actualWidth - expectedWidth) <= 0.1 &&
        Math.abs(actualHeight - expectedHeight) <= 0.1;

      const pageCountMatch = validatePageCount(pages.length, pageCount);

      const result: PreflightResult = {
        dimensions: {
          expected: { width: expectedWidth, height: expectedHeight },
          actual: { width: actualWidth, height: actualHeight },
          isValid: dimensionsMatch,
        },
        pageCount: {
          expected: pageCount,
          actual: pages.length,
          isValid: pageCountMatch,
        },
      };

      setPreflightResult(result);
      
      toast({
        title: result.dimensions.isValid && result.pageCount.isValid ? "Preflight passed" : "Preflight failed",
        variant: result.dimensions.isValid && result.pageCount.isValid ? "default" : "destructive",
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
            Verify your PDF dimensions and page count
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
