import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

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
}

const PreflightReport = ({ result }: PreflightReportProps) => {
  const isValid = 
    result.dimensions.isValid && 
    result.pageCount.isValid &&
    result.colorSpace.isValid &&
    result.resolution.isValid &&
    result.fonts.isValid &&
    result.dieline.isValid;

  return (
    <Card className="p-6 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Preflight Report</h3>
        {isValid ? (
          <div className="flex items-center text-success gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>PASS</span>
          </div>
        ) : (
          <div className="flex items-center text-error gap-2">
            <XCircle className="w-5 h-5" />
            <span>FAIL</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">Dimensions</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Expected</p>
              <p>
                {result.dimensions.expected.width}" × {result.dimensions.expected.height}"
              </p>
            </div>
            <div>
              <p className="text-gray-500">Detected Trim flat size</p>
              <p>
                {result.dimensions.actualWithBleed.width.toFixed(3)}" × {result.dimensions.actualWithBleed.height.toFixed(3)}"
                {result.dimensions.isValid && result.dimensions.bleedSize > 0 && (
                  <span className="text-gray-500 block">
                    (bleed detected ({result.dimensions.bleedSize}"))
                  </span>
                )}
              </p>
            </div>
          </div>
          {!result.dimensions.isValid && result.dimensions.error && (
            <p className="text-error text-sm whitespace-pre-line">{result.dimensions.error}</p>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Page Count</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Expected</p>
              <p>{result.pageCount.expected}</p>
            </div>
            <div>
              <p className="text-gray-500">Actual</p>
              <p>{result.pageCount.actual} pages</p>
            </div>
          </div>
          {!result.pageCount.isValid && result.pageCount.error && (
            <p className="text-error text-sm">{result.pageCount.error}</p>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Color Space</h4>
          <div className="text-sm space-y-1">
            <p className="text-gray-500">Expected Profile</p>
            <p>{result.colorSpace.expectedProfile}</p>
            <p className="text-gray-500 mt-2">Detected Colors</p>
            <p>{result.colorSpace.detectedProfile}</p>
            {result.colorSpace.hasWhiteInk && (
              <p className="text-gray-500">White Ink detected</p>
            )}
            {result.colorSpace.spotColors.length > 0 && (
              <div>
                <p className="text-gray-500">Spot Colors:</p>
                <ul className="list-disc list-inside">
                  {result.colorSpace.spotColors.map((color, index) => (
                    <li key={index}>{color}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {!result.colorSpace.isValid && result.colorSpace.error && (
            <p className="text-error text-sm">{result.colorSpace.error}</p>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Dieline</h4>
          <div className="text-sm">
            <p>
              {result.dieline.expected ? "Required" : "Not Required"}{" "}
              {result.dieline.hasValidDieline && "- Found"}
            </p>
          </div>
          {!result.dieline.isValid && result.dieline.error && (
            <p className="text-error text-sm">{result.dieline.error}</p>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Resolution</h4>
          <div className="text-sm">
            <p>{result.resolution.dpi} DPI</p>
          </div>
          {!result.resolution.isValid && result.resolution.error && (
            <p className="text-error text-sm">{result.resolution.error}</p>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Fonts</h4>
          <div className="text-sm">
            <p>{result.fonts.hasUnoutlinedFonts ? "Unoutlined fonts detected" : "All fonts outlined"}</p>
          </div>
          {!result.fonts.isValid && result.fonts.error && (
            <p className="text-error text-sm">{result.fonts.error}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PreflightReport;
