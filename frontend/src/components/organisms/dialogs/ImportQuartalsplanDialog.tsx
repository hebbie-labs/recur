import { useState, type ClipboardEvent } from "react";
import AppDialog from "@/components/molecules/dialog/AppDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { createTask } from "@/services/taskService";
import { TaskCategory, TaskFrequency } from "@/types/task";
import { useTasksContext } from "@/contexts/TasksContext";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  parseClipboardTable,
  buildDraftTasks,
  detectReferenceYear,
  recomputeComputedDates,
  type DraftTask,
  type QuartalsplanRow,
} from "@/utils/parseQuartalsplan";

type ImportQuartalsplanDialogProps = {
  onClose: () => void;
};

function ImportQuartalsplanDialog({ onClose }: ImportQuartalsplanDialogProps) {
  const { fetchTasks } = useTasksContext();

  const [rows, setRows] = useState<QuartalsplanRow[]>([]);
  const [drafts, setDrafts] = useState<DraftTask[]>([]);
  const [referenceYear, setReferenceYear] = useState<number>(
    new Date().getFullYear()
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const step = rows.length === 0 ? "paste" : "preview";
  const selectedCount = drafts.filter((d) => d.selected).length;

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html") || null;
    const text = event.clipboardData.getData("text/plain") || null;

    const parsedRows = parseClipboardTable(html, text);
    if (parsedRows.length === 0) {
      setParseError(
        "Keine Tabellenzeilen erkannt. Bitte die Quartalsplan-Tabelle direkt aus Smartlearn kopieren und hier einfügen."
      );
      return;
    }

    const year = detectReferenceYear(parsedRows);
    setParseError(null);
    setRows(parsedRows);
    setReferenceYear(year);
    setDrafts(buildDraftTasks(parsedRows, year));
  }

  function handleReferenceYearChange(value: string) {
    const year = Number(value);
    if (isNaN(year)) return;
    setReferenceYear(year);
    setDrafts((prev) => recomputeComputedDates(prev, year));
  }

  function updateDraft(id: string, patch: Partial<DraftTask>) {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
    );
  }

  function handleStartOver() {
    setRows([]);
    setDrafts([]);
    setParseError(null);
  }

  async function handleSubmit() {
    const selected = drafts.filter((d) => d.selected);
    if (selected.length === 0) return;

    setLoading(true);
    const results = await Promise.allSettled(
      selected.map((draft) =>
        createTask({
          name: draft.name,
          description: draft.description,
          category: TaskCategory.SCHOOL,
          frequency: TaskFrequency.ONCE,
          dateUntil: draft.dateUntil,
          progress: 0,
        })
      )
    );
    setLoading(false);

    const succeededIds = new Set<string>();
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        succeededIds.add(selected[index].id);
      }
    });

    const failCount = selected.length - succeededIds.size;

    if (succeededIds.size > 0) {
      await fetchTasks();
    }

    if (failCount === 0) {
      showSuccessToast(
        `${succeededIds.size} von ${selected.length} Aufgaben importiert`
      );
      onClose();
      return;
    }

    showErrorToast(
      `${succeededIds.size} von ${selected.length} Aufgaben importiert, ${failCount} fehlgeschlagen`
    );
    setDrafts((prev) =>
      prev.map((d) =>
        selected.some((s) => s.id === d.id)
          ? { ...d, selected: !succeededIds.has(d.id) }
          : d
      )
    );
  }

  return (
    <AppDialog
      open
      onClose={onClose}
      title="Quartalsplan importieren"
      onSubmit={step === "preview" ? handleSubmit : undefined}
      loading={loading}
      submitDisabled={step === "paste" || selectedCount === 0}
      contentClassName="sm:max-w-3xl"
      submitLabel="Importieren"
    >
      {step === "paste" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Kopiere die Quartalsplan-Tabelle aus Smartlearn (Strg+C) und füge
            sie hier mit Strg+V ein.
          </p>
          <div
            role="textbox"
            aria-label="Quartalsplan hier einfügen"
            tabIndex={0}
            onPaste={handlePaste}
            className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-input text-center text-sm text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Hier klicken und Strg+V drücken
          </div>
          {parseError && (
            <p className="text-sm text-destructive">{parseError}</p>
          )}
        </div>
      )}

      {step === "preview" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="referenceYear" className="text-sm font-medium">
                Referenzjahr
              </label>
              <Input
                id="referenceYear"
                type="number"
                className="w-24"
                value={referenceYear}
                onChange={(e) => handleReferenceYearChange(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleStartOver}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Neu einfügen
            </button>
          </div>

          <Separator />

          <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto pr-1">
            {drafts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Keine Prüfungen oder Abgabetermine in dieser Tabelle gefunden.
              </p>
            )}
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex flex-col gap-2 rounded-lg border border-input p-3 sm:flex-row sm:items-start"
              >
                <div className="flex items-center gap-2 pt-1.5">
                  <Checkbox
                    checked={draft.selected}
                    onCheckedChange={(checked) =>
                      updateDraft(draft.id, { selected: checked === true })
                    }
                  />
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    KW {draft.kw} · {draft.source}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  <div>
                    <Input
                      value={draft.name}
                      maxLength={40}
                      onChange={(e) =>
                        updateDraft(draft.id, { name: e.target.value })
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {draft.name.length}/40
                    </span>
                  </div>
                  <div>
                    <Textarea
                      value={draft.description}
                      maxLength={200}
                      onChange={(e) =>
                        updateDraft(draft.id, { description: e.target.value })
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {draft.description.length}/200
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Input
                    type="date"
                    className="w-40"
                    value={draft.dateUntil}
                    onChange={(e) =>
                      updateDraft(draft.id, {
                        dateUntil: e.target.value,
                        dateSource: "explicit",
                        warning: undefined,
                      })
                    }
                  />
                  {draft.warning && (
                    <span className="text-xs text-amber-600 dark:text-amber-500">
                      {draft.warning}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {selectedCount} von {drafts.length} Aufgaben ausgewählt
          </p>
        </div>
      )}
    </AppDialog>
  );
}

export default ImportQuartalsplanDialog;
