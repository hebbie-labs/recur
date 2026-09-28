import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { type SortOptions, SORT_OPTIONS } from "@/utils/sortTasks";

type SorterProps = {
  sortBy: SortOptions;
  setSortBy: (value: SortOptions) => void;
};

function Sorter({ sortBy, setSortBy }: SorterProps) {
  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      <Label htmlFor="sortBy" className="sr-only">
        Sortieren nach
      </Label>
      <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOptions)}>
        {/* shrink-0: an explicit width alone doesn't stop a flex ancestor from
            squeezing this trigger down to icon-only (#139, regressed from #54
            after an unrelated layout change). Opt out of shrinking entirely so
            it can't happen again regardless of what changes around it. */}
        <SelectTrigger id="sortBy" className="w-[200px] shrink-0 gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <SelectValue>
            {(value: SortOptions) =>
              SORT_OPTIONS.find((option) => option.value === value)?.label
            }
          </SelectValue>
        </SelectTrigger>
        {/* Base UI's --anchor-width var (used by the shared SelectContent's
            w-(--anchor-width)) only gets set when Floating UI's size()
            middleware runs, which isn't wired up here - so it silently
            resolves to nothing. Match the trigger's width explicitly instead
            of relying on that. */}
        <SelectContent className="w-[200px] min-w-0">
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default Sorter;