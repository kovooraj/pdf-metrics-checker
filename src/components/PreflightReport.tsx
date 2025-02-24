
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import pdfjsLib from "../utils/pdfjs-init";

export interface PreflightResult {
  dimensions: {
    expected: { width: number; height: number };
    actual: { width: number; height: number };
    actualWithBleed: { width: number; height: number };
    bleedSize: number;
    isValid: boolean;
    error: string | null;
  };
  pageCount: {
    expected: string;
    actual: number;
    isValid: boolean;
    error: string | null;
  };
  colorSpace: {
    expectedProfile: string;
    detectedProfile: string;
    hasWhiteInk: boolean;
    spotColors: string[];
    isValid: boolean;
    error: string | null;
  };
  dieline: {
    expected: boolean;
    hasValidDieline: boolean;
    isValid: boolean;
    error: string | null;
  };
  resolution: {
    dpi: number;
    isValid: boolean;
    error: string | null;
  };
  fonts: {
    hasUnoutlinedFonts: boolean;
    isValid: boolean;
    error: string | null;
  };
}

interface PreflightReportProps {
  result: PreflightResult;
  file?: File;
}

const PreflightReport = ({ result, file }: PreflightReportProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isValid = 
    result.dimensions.isValid && 
    result.pageCount.isValid &&
    result.colorSpace.isValid &&
    result.resolution.isValid &&
    result.fonts.isValid &&
    result.dieline.isValid;

  useEffect(() => {
    const loadPdfPreview = async () => {
      if (!file) return;
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        
        const viewport = page.getViewport({ scale: 1 });
        
        const canvas = document.createElement('canvas');
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = viewport.width * pixelRatio;
        canvas.height = viewport.height * pixelRatio;
        
        const context = canvas.getContext('2d');
        if (!context) return;

        context.scale(pixelRatio, pixelRatio);
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        setPreviewUrl(canvas.toDataURL());
      } catch (error) {
        console.error('Error generating PDF preview:', error);
      }
    };

    loadPdfPreview();
  }, [file]);

  return (
    <Card className="p-6 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Preflight Report</h3>
        {!isValid && (
          <div className="flex items-center text-error gap-2">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">FAIL</span>
          </div>
        )}
      </div>

      {previewUrl && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50 flex justify-center items-center mb-6">
          <div className="relative max-w-[200px]">
            <img 
              src={previewUrl} 
              alt="PDF Preview" 
              className="w-full h-auto"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-red-500 font-bold text-2xl text-center leading-tight">
                DO NOT<br />DROP
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div>
          <h4 className="text-lg font-medium mb-4">Dimensions</h4>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-gray-600 mb-1">Expected</p>
              <p className="text-lg">
                {result.dimensions.expected.width}" × {result.dimensions.expected.height}"
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Detected Trim flat size</p>
              <p className="text-lg">
                {result.dimensions.actualWithBleed.width.toFixed(3)}" × {result.dimensions.actualWithBleed.height.toFixed(3)}"
              </p>
            </div>
          </div>
          {!result.dimensions.isValid && result.dimensions.error && (
            <div className="mt-4 p-4 bg-red-50 text-red-500 rounded-lg text-sm">
              {result.dimensions.error}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-lg font-medium mb-4">Page Count</h4>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-gray-600 mb-1">Expected</p>
              <p className="text-lg">{result.pageCount.expected}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Actual</p>
              <p className="text-lg">{result.pageCount.actual} pages</p>
            </div>
          </div>
          {!result.pageCount.isValid && result.pageCount.error && (
            <div className="mt-4 p-4 bg-red-50 text-red-500 rounded-lg text-sm">
              {result.pageCount.error}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-lg font-medium mb-4">Color Space</h4>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-gray-600 mb-1">Expected</p>
              <p className="text-lg">{result.colorSpace.expectedProfile}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Actual</p>
              <p className="text-lg">{result.colorSpace.detectedProfile}</p>
              {(result.colorSpace.hasWhiteInk || result.colorSpace.spotColors.length > 0) && (
                <div className="mt-2 space-y-1">
                  {result.colorSpace.hasWhiteInk && (
                    <p className="text-gray-600">• White Ink</p>
                  )}
                  {result.colorSpace.spotColors.length > 0 && (
                    <div className="text-gray-600">
                      <p>• Spot Colors:</p>
                      <ul className="list-inside pl-4">
                        {result.colorSpace.spotColors.map((color, index) => (
                          <li key={index}>{color}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {!result.colorSpace.isValid && result.colorSpace.error && (
            <div className="mt-4 p-4 bg-red-50 text-red-500 rounded-lg text-sm">
              {result.colorSpace.error}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-lg font-medium mb-4">Dieline</h4>
          <p className="text-lg">
            {result.dieline.expected ? "Required" : "Not Required"}{" "}
            {result.dieline.hasValidDieline && "- Found"}
          </p>
          {!result.dieline.isValid && result.dieline.error && (
            <div className="mt-4 p-4 bg-red-50 text-red-500 rounded-lg text-sm">
              {result.dieline.error}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-lg font-medium mb-4">Resolution</h4>
          <p className="text-lg">{result.resolution.dpi} DPI</p>
          {!result.resolution.isValid && result.resolution.error && (
            <div className="mt-4 p-4 bg-red-50 text-red-500 rounded-lg text-sm">
              {result.resolution.error}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-lg font-medium mb-4">Fonts</h4>
          <p className="text-lg">
            {result.fonts.hasUnoutlinedFonts ? "Unoutlined fonts detected" : "All fonts outlined"}
          </p>
          {!result.fonts.isValid && result.fonts.error && (
            <div className="mt-4 p-4 bg-red-50 text-red-500 rounded-lg text-sm">
              {result.fonts.error}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PreflightReport;
