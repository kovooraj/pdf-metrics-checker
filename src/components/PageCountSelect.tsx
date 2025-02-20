import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface PageCountSelectProps {
  value: string;
  onChange: (value: string) => void;
}
const PageCountSelect = ({
  value,
  onChange
}: PageCountSelectProps) => {
  return <div className="space-y-2">
      <Label htmlFor="pageCount">Printed Sides Count</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="pageCount" className="w-full">
          <SelectValue placeholder="Select page count" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1-Sided (1 page)</SelectItem>
          <SelectItem value="2">2-Sided (2 pages)</SelectItem>
          <SelectItem value="multi">Multi-Page (2+ pages)</SelectItem>
        </SelectContent>
      </Select>
    </div>;
};
export default PageCountSelect;