
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DimensionInputProps {
  width: string;
  height: string;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
}

const DimensionInput = ({
  width,
  height,
  onWidthChange,
  onHeightChange,
}: DimensionInputProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="width">Width (inches)</Label>
        <Input
          id="width"
          type="number"
          step="0.1"
          value={width}
          onChange={(e) => onWidthChange(e.target.value)}
          placeholder="Enter width"
          className="transition-all duration-200"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="height">Height (inches)</Label>
        <Input
          id="height"
          type="number"
          step="0.1"
          value={height}
          onChange={(e) => onHeightChange(e.target.value)}
          placeholder="Enter height"
          className="transition-all duration-200"
        />
      </div>
    </div>
  );
};

export default DimensionInput;
