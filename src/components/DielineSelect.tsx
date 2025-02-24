import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
interface DielineSelectProps {
  value: string;
  onChange: (value: string) => void;
}
const DielineSelect = ({
  value,
  onChange
}: DielineSelectProps) => {
  return <div className="space-y-2">
      <Label htmlFor="dieline">Does file have a custom shape? (if yes - Checks for spot color "Dieline")</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="dieline" className="w-full">
          <SelectValue placeholder="Select yes/no" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="yes">Yes</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
    </div>;
};
export default DielineSelect;