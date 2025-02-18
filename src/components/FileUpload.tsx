
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { LucideUpload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

const FileUpload = ({ onFileSelect, className }: FileUploadProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-gray-300 hover:border-primary",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <LucideUpload className="w-8 h-8 text-gray-400" />
        <p className="text-sm text-gray-600">
          {isDragActive
            ? "Drop your PDF here"
            : "Drag & drop your PDF here, or click to select"}
        </p>
      </div>
    </div>
  );
};

export default FileUpload;
