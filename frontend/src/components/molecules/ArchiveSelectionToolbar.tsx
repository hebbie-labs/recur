import { Button } from "@/components/ui/button";
import { CheckSquareIcon, Square, SquareCheck, Trash2Icon, XIcon } from "lucide-react";

type ArchiveSelectionToolbarProps = {
  selectMode: boolean;
  selectedCount: number;
  allSelected: boolean;
  onEnterSelectMode: () => void;
  onExitSelectMode: () => void;
  onToggleAllSelected: () => void;
  onRequestBulkDelete: () => void;
};

function ArchiveSelectionToolbar({
  selectMode,
  selectedCount,
  allSelected,
  onEnterSelectMode,
  onExitSelectMode,
  onToggleAllSelected,
  onRequestBulkDelete,
}: ArchiveSelectionToolbarProps) {
  if (!selectMode) {
    return (
      <div className="flex items-center justify-between gap-4 px-4 pt-4">
        <div />
        <Button variant="outline" size="sm" onClick={onEnterSelectMode}>
          <CheckSquareIcon className="h-4 w-4 mr-1" />
          Auswählen
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-4">
      <span className="text-sm text-muted-foreground">{selectedCount} ausgewählt</span>
      <div className="flex items-center gap-1.5">
        {selectedCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full"
            aria-label={`${selectedCount} ${selectedCount === 1 ? "Aufgabe" : "Aufgaben"} löschen`}
            onClick={onRequestBulkDelete}
          >
            <Trash2Icon className="size-5" />
            {selectedCount}
          </Button>
        )}
        {/* Icon allein wäre hier zu unklar (Square/SquareCheck ohne Kontext) -
            deshalb mit kurzem Label, anders als bei Löschen (Zahl reicht) und
            Abbrechen (X ist selbsterklärend). */}
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          aria-label={allSelected ? "Auswahl aufheben" : "Alle auswählen"}
          onClick={onToggleAllSelected}
        >
          {allSelected ? <SquareCheck className="size-5" /> : <Square className="size-5" />}
          Alle
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Abbrechen"
          onClick={onExitSelectMode}
        >
          <XIcon className="size-5" />
        </Button>
      </div>
    </div>
  );
}

export default ArchiveSelectionToolbar;