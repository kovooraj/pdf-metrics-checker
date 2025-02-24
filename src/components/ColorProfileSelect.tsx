import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
export type ColorProfile = "CMYK" | "CMYK+WHITE" | "WHITE_ONLY" | "CMYK+PANTONE" | "BLACK_ONLY";
interface ColorProfileSelectProps {
  value: string;
  onChange: (value: string) => void;
}
const ColorProfileSelect = ({
  value,
  onChange
}: ColorProfileSelectProps) => {
  return <div className="space-y-2">
      <Label htmlFor="colorProfile">Ink requirement ( if White ink - Checks for spot color "White_Ink")
    </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="colorProfile" className="w-full">
          <SelectValue placeholder="Select color profile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="CMYK">CMYK</SelectItem>
          <SelectItem value="CMYK+WHITE">CMYK+WHITE</SelectItem>
          <SelectItem value="WHITE_ONLY">WHITE ONLY</SelectItem>
          <SelectItem value="CMYK+PANTONE">CMYK+PANTONE</SelectItem>
          <SelectItem value="BLACK_ONLY">BLACK ONLY</SelectItem>
        </SelectContent>
      </Select>
    </div>;
};
export default ColorProfileSelect;