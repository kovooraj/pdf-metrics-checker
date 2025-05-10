
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import pdfjsLib from "../utils/pdfjs-init";

export interface PreflightResult {
  dimensions: {
    expected: { width: number; height: number };
    actual: { width: number; height: number };
    actualWithBleed: { width: number; height: number };
    bleedSize: number;
    safeZone: { width: number; height: number };
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
    totalInkCoverage: number;
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
    embeddedFonts: boolean;
    isValid: boolean;
    error: string | null;
  };
  images: {
    allImagesInCMYK: boolean;
    oversizedImages: boolean;
    isValid: boolean;
    error: string | null;
  };
  transparency: {
    hasTransparency: boolean;
    isFlattened: boolean;
    isValid: boolean;
    error: string | null;
  };
  printMarks: {
    hasCropMarks: boolean;
    hasRegistrationMarks: boolean;
    hasColorBars: boolean;
    isValid: boolean;
    error: string | null;
  };
  overprint: {
    hasOverprint: boolean;
    whitesSetToKnockout: boolean;
    isValid: boolean;
    error: string | null;
  };
  specialFinishes: {
    hasSpotUV: boolean;
    hasFoil: boolean;
    hasEmbossing: boolean;
    isValid: boolean;
    error: string | null;
  };
  contentVerification: {
    hasSpellCheck: boolean;
    allImagesPlaced: boolean;
    correctPageOrder: boolean;
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
    result.dieline.isValid &&
    result.images?.isValid !== false &&
    result.transparency?.isValid !== false &&
    result.printMarks?.isValid !== false &&
    result.overprint?.isValid !== false &&
    result.specialFinishes?.isValid !== false &&
    result.contentVerification?.isValid !== false;

  useEffect(() => {
    const loadPdfPreview = async () => {
      if (!file) return;
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        
        const viewport = page.getViewport({ scale: 1.5 });
        
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

  const StatusIndicator = ({ isValid }: { isValid: boolean | undefined }) => (
    isValid ? (
      <div className="flex items-center text-green-500 gap-2">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">PASS</span>
      </div>
    ) : (
      <div className="flex items-center text-red-500 gap-2">
        <XCircle className="w-5 h-5" />
        <span className="font-medium">FAIL</span>
      </div>
    )
  );

  const SectionHeader = ({ title, isValid }: { title: string, isValid: boolean | undefined }) => (
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-lg font-medium">{title}</h4>
      {isValid !== undefined && <StatusIndicator isValid={isValid} />}
    </div>
  );

  const ErrorMessage = ({ error }: { error: string | null }) => (
    error ? (
      <div className="mt-3 p-4 bg-red-50 text-red-500 rounded-lg text-sm">
        {error}
      </div>
    ) : null
  );

  return (
    <Card className="p-6 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Preflight Report</h3>
        <StatusIndicator isValid={isValid} />
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
        {/* 1. Document Dimensions & Layout */}
        <div>
          <SectionHeader title="Dimensions & Layout" isValid={result.dimensions.isValid} />
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-gray-600 mb-1">Expected Trim Size</p>
              <p className="text-lg">
                {result.dimensions.expected.width}" × {result.dimensions.expected.height}"
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Detected with Bleed</p>
              <p className="text-lg">
                {result.dimensions.actualWithBleed.width.toFixed(3)}" × {result.dimensions.actualWithBleed.height.toFixed(3)}"
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-8">
            <div>
              <p className="text-gray-600 mb-1">Bleed Size</p>
              <p className="text-lg">{result.dimensions.bleedSize.toFixed(3)}" all around</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Safe Zone</p>
              <p className="text-lg">0.125" from trim edge</p>
            </div>
          </div>
          <ErrorMessage error={result.dimensions.error} />
        </div>

        {/* 2. Page Count */}
        <div>
          <SectionHeader title="Page Count" isValid={result.pageCount.isValid} />
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
          <ErrorMessage error={result.pageCount.error} />
        </div>

        {/* 3. Color Space */}
        <div>
          <SectionHeader title="Color Space" isValid={result.colorSpace.isValid} />
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-gray-600 mb-1">Expected</p>
              <p className="text-lg">{result.colorSpace.expectedProfile}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Actual</p>
              <p className="text-lg">{result.colorSpace.detectedProfile}</p>
              {result.colorSpace.totalInkCoverage > 0 && (
                <p className="text-gray-600 text-sm mt-1">Total Ink Coverage: {result.colorSpace.totalInkCoverage}%</p>
              )}
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
          <ErrorMessage error={result.colorSpace.error} />
        </div>

        {/* 4. Image Quality */}
        {result.images && (
          <div>
            <SectionHeader title="Image Quality" isValid={result.images.isValid} />
            <div>
              <p className="text-lg">Resolution: {result.resolution.dpi} DPI</p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${result.images.allImagesInCMYK ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p>All images in CMYK: {result.images.allImagesInCMYK ? 'Yes' : 'No'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${!result.images.oversizedImages ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p>Images properly sized: {!result.images.oversizedImages ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
            <ErrorMessage error={result.images.error || result.resolution.error} />
          </div>
        )}

        {/* 5. Fonts */}
        <div>
          <SectionHeader title="Typography & Fonts" isValid={result.fonts.isValid} />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${result.fonts.embeddedFonts ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p>Fonts embedded: {result.fonts.embeddedFonts ? 'Yes' : 'No'}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${!result.fonts.hasUnoutlinedFonts ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p>Fonts outlined: {!result.fonts.hasUnoutlinedFonts ? 'Yes' : 'No'}</p>
            </div>
          </div>
          <ErrorMessage error={result.fonts.error} />
        </div>

        {/* 6. Dieline */}
        <div>
          <SectionHeader title="Dieline" isValid={result.dieline.isValid} />
          <p className="text-lg">
            {result.dieline.expected ? "Required" : "Not Required"}{" "}
            {result.dieline.hasValidDieline && "- Found"}
          </p>
          <ErrorMessage error={result.dieline.error} />
        </div>

        {/* 7. Transparency & Layers */}
        {result.transparency && (
          <div>
            <SectionHeader title="Transparency & Layers" isValid={result.transparency.isValid} />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${!result.transparency.hasTransparency || result.transparency.isFlattened ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p>Transparency flattened: {result.transparency.hasTransparency ? (result.transparency.isFlattened ? 'Yes' : 'No') : 'N/A'}</p>
              </div>
            </div>
            <ErrorMessage error={result.transparency.error} />
          </div>
        )}

        {/* 8. Print Marks & Guides */}
        {result.printMarks && (
          <div>
            <SectionHeader title="Print Marks & Guides" isValid={result.printMarks.isValid} />
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${result.printMarks.hasCropMarks ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p>Crop Marks: {result.printMarks.hasCropMarks ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${result.printMarks.hasRegistrationMarks ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p>Registration Marks: {result.printMarks.hasRegistrationMarks ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${result.printMarks.hasColorBars ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p>Color Bars: {result.printMarks.hasColorBars ? 'Yes' : 'No'}</p>
              </div>
            </div>
            <ErrorMessage error={result.printMarks.error} />
          </div>
        )}

        {/* 9. Special Finishes & Effects */}
        {result.specialFinishes && (
          <div>
            <SectionHeader title="Special Finishes & Effects" isValid={result.specialFinishes.isValid} />
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-gray-500`}></div>
                <p>Spot UV: {result.specialFinishes.hasSpotUV ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-gray-500`}></div>
                <p>Foil: {result.specialFinishes.hasFoil ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-gray-500`}></div>
                <p>Embossing: {result.specialFinishes.hasEmbossing ? 'Yes' : 'No'}</p>
              </div>
            </div>
            <ErrorMessage error={result.specialFinishes.error} />
          </div>
        )}

        {/* 10. Overprint & Knockout Settings */}
        {result.overprint && (
          <div>
            <SectionHeader title="Overprint & Knockout" isValid={result.overprint.isValid} />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${result.overprint.hasOverprint ? 'bg-gray-500' : 'bg-gray-500'}`}></div>
                <p>Overprint detected: {result.overprint.hasOverprint ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${result.overprint.whitesSetToKnockout ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p>Whites set to knockout: {result.overprint.whitesSetToKnockout ? 'Yes' : 'No'}</p>
              </div>
            </div>
            <ErrorMessage error={result.overprint.error} />
          </div>
        )}

        {/* 11. Content Verification */}
        {result.contentVerification && (
          <div>
            <SectionHeader title="Content Verification" isValid={result.contentVerification.isValid} />
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${result.contentVerification.hasSpellCheck ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p>Spell checked: {result.contentVerification.hasSpellCheck ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${result.contentVerification.allImagesPlaced ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p>Images placed: {result.contentVerification.allImagesPlaced ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${result.contentVerification.correctPageOrder ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p>Page order: {result.contentVerification.correctPageOrder ? 'Correct' : 'Check'}</p>
              </div>
            </div>
            <ErrorMessage error={result.contentVerification.error} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default PreflightReport;
