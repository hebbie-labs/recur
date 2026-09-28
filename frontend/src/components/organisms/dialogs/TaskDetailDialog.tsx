import { format } from "date-fns";
import { de } from "date-fns/locale";
import { TaskFrequency, type Task } from "@/types/task";
import { categoryLabels, frequencyLabels } from "@/lib/taskCategoryStyles";
import { categoryDot } from "@/utils/calendarGrid";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ProgressIndicator from "@/components/atoms/ProgressIndicator";
import DetailDialog from "@/components/molecules/dialog/DetailDialog";
import TaskCardMenu from "@/components/organisms/task/TaskCardMenu";
import { pastIntervals, parseDateOnly } from "@/utils/taskCompletions";
import { useTasksContext } from "@/contexts/TasksContext";

type TaskDetailDialogProps = {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onToggleArchive: () => void;
  onResetProgress: () => void;
  onDelete: () => void;
  onToggleDone: () => void;
  onTaskUpdated?: (task: Task) => void;
  isArchived: boolean;
  /** Ob das aktuelle Frequenz-Intervall bereits erledigt ist - von TaskCard/useTaskCard übernommen, damit beide Stellen exakt dieselbe (Projekt- vs. persönliche Task-)Logik verwenden (#152). */
  doneForCurrentPeriod: boolean;
  /** Bei Gruppen-Tasks nur true für den Gruppen-Admin - persönliche Tasks immer true. */
  canEdit?: boolean;
};

/** Verlauf vergangener Frequenz-Intervalle mit Nachtrag/Rückgängig pro Tag (#152) - nur für persönliche, wiederkehrende Tasks (ONCE hat kein Intervall-Konzept, Projekt-Tasks liegen ausserhalb des Feature-Scopes). Bei einem archivierten Habit read-only (#155), das Backend lehnt die Requests ohnehin ab. */
function CompletionHistoryList({ task, isArchived }: { task: Task; isArchived: boolean }) {
  const { handleAddCompletion, handleRemoveCompletion } = useTasksContext();
  const intervals = pastIntervals(task);

  if (intervals.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <span className="text-xs text-muted-foreground">Verlauf</span>
      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
        {intervals.map((interval) => (
          <label
            key={interval.index}
            className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted"
          >
            <Checkbox
              checked={interval.completedOn !== null}
              disabled={isArchived}
              onCheckedChange={() =>
                interval.completedOn
                  ? handleRemoveCompletion(task.id, interval.completedOn)
                  : handleAddCompletion(task.id, interval.representativeDate)
              }
            />
            {format(parseDateOnly(interval.representativeDate), "dd.MM.yyyy", { locale: de })}
          </label>
        ))}
      </div>
    </div>
  );
}

/** Read-only Task-Detailansicht (Name, Kategorie, Beschreibung, Zeitrahmen, Fortschritt) mit Zugriff auf das ⋮-Menü. Ursprünglich im Kalender gebaut, für die Habit-Card-Detailansicht (#136) hierher extrahiert, damit beide Stellen exakt dasselbe zeigen statt zu drifted. */
function TaskDetailDialog({
  task,
  open,
  onClose,
  onToggleArchive,
  onResetProgress,
  onDelete,
  onToggleDone,
  onTaskUpdated,
  isArchived,
  doneForCurrentPeriod,
  canEdit = true,
}: TaskDetailDialogProps) {
  return (
    <DetailDialog open={open} onClose={onClose} title={task?.name}>
      {task && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span className={`size-2 rounded-full ${categoryDot[task.category]}`} />
              {categoryLabels[task.category]}
            </div>
            <TaskCardMenu
              task={task}
              onToggleMenu={() => {}}
              onToggleEdit={() => {}}
              onToggleArchive={onToggleArchive}
              onResetProgress={onResetProgress}
              onDelete={onDelete}
              onTaskUpdated={onTaskUpdated}
              isArchived={isArchived}
              canEdit={canEdit}
            />
          </div>

          <div className="flex flex-col gap-2 text-sm">
            {task.description && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Beschreibung</span>
                <span style={{ wordWrap: "break-word" }}>{task.description}</span>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Wiederholung</span>
              <span>{frequencyLabels[task.frequency]}</span>
            </div>
            {task.startTime && (
              <div className="flex gap-6">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Datum</span>
                  <span>{format(new Date(task.startTime), "dd.MM.yyyy", { locale: de })}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Uhrzeit</span>
                  <span>{format(new Date(task.startTime), "HH:mm", { locale: de })}</span>
                </div>
                {task.durationMinutes && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Dauer</span>
                    <span>{task.durationMinutes} Min.</span>
                  </div>
                )}
              </div>
            )}
            {task.dateUntil && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Fällig bis</span>
                <span>{format(new Date(task.dateUntil), "dd.MM.yyyy", { locale: de })}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
            <div className="flex items-center gap-3">
              <ProgressIndicator value={task.progress} size={40} strokeWidth={4} />
              <span className="text-xs text-muted-foreground">Fortschritt</span>
            </div>
            {!isArchived && (
              <Button
                size="sm"
                variant={doneForCurrentPeriod ? "outline" : "default"}
                disabled={Boolean(task.project) && doneForCurrentPeriod}
                onClick={onToggleDone}
                title={
                  !task.project && doneForCurrentPeriod
                    ? "Klicken, um rückgängig zu machen"
                    : undefined
                }
              >
                {doneForCurrentPeriod ? "Erledigt" : "Als erledigt markieren"}
              </Button>
            )}
          </div>

          {!task.project && task.frequency !== TaskFrequency.ONCE && (
            <CompletionHistoryList task={task} isArchived={isArchived} />
          )}
        </div>
      )}
    </DetailDialog>
  );
}

export default TaskDetailDialog;
