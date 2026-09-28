import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3 p-4">
      {currentPage > 1 && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Vorherige Seite"
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft />
        </Button>
      )}

      <span className="text-sm text-muted-foreground tabular-nums">
        {currentPage} / {totalPages}
      </span>

      {currentPage < totalPages && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Nächste Seite"
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight />
        </Button>
      )}
    </div>
  );
}

export default Pagination;
