
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

export interface PreflightResult {
  dimensions: {
    expected: { width: number; height: number };
    actual: { width: number; height: number };
    isValid: boolean;
  };
  pageCount: {
    expected: string;
    actual: number;
    isValid: boolean;
  };
}

interface PreflightReportProps {
  result: PreflightResult;
}

const PreflightReport = ({ result }: PreflightReportProps) => {
  const isValid = result.dimensions.isValid && result.pageCount.isValid;

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
              <p className="text-gray-500">Actual</p>
              <p>
                {result.dimensions.actual.width.toFixed(2)}" × {result.dimensions.actual.height.toFixed(2)}"
              </p>
            </div>
          </div>
          {!result.dimensions.isValid && (
            <p className="text-error text-sm">Dimensions do not match the expected size</p>
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
          {!result.pageCount.isValid && (
            <p className="text-error text-sm">Page count does not match the expected count</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PreflightReport;
