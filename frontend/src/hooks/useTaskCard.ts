import { useMemo, type MouseEvent } from "react";
import type { Task } from "@/types/task";
import { isDoneForCurrentPeriod } from "@/utils/taskCompletions";

type UseTaskCardParams = {
  progress: number | null | undefined;
  task: Pick<Task, "frequency" | "dateCreated" | "completions" | "lastAmountDidAt" | "project">;
  onToggleFavorite?: () => void;
  onToggleEdit?: () => void;
  onToggleMenu?: () => void;
  onToggleArchive?: () => void;
  onResetProgress?: () => void;
  onDelete?: () => void;
  onToggleDone?: () => void;
};

function useTaskCard({
  progress,
  task,
  onToggleFavorite,
  onToggleEdit,
  onToggleMenu,
  onToggleArchive,
  onResetProgress,
  onDelete,
  onToggleDone,
}: UseTaskCardParams) {
  const clampedProgress = useMemo(
    () => Math.min(100, Math.max(0, progress ?? 0)),
    [progress]
  );

  // Ob das aktuelle Frequenz-Intervall bereits erledigt ist (#152: für
  // persönliche Tasks completion-basiert und toggle-bar - ein erneuter Klick
  // macht die Completion rückgängig, siehe TasksContext#handleToggleDone;
  // für geteilte Projekt-Tasks weiterhin die alte zeitbasierte Sperre, siehe
  // taskCompletions#isDoneForCurrentPeriod). Kein useMemo, da beide Zweige
  // von der aktuellen Zeit abhängen und nicht memoized werden dürfen.
  const doneForCurrentPeriod = isDoneForCurrentPeriod({ ...task, progress });

  const handleDone = () => {
    onToggleDone?.();
  };

  const handleToggleFavorite = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggleFavorite?.();
  };

  const handleToggleEdit = () => onToggleEdit?.();
  const handleToggleMenu = () => onToggleMenu?.();
  const handleToggleArchive = () => onToggleArchive?.();
  const handleDelete = () => onDelete?.();
  const handleResetProgress = () => onResetProgress?.();

  return {
    clampedProgress,
    doneForCurrentPeriod,
    handleDone,
    handleToggleFavorite,
    handleToggleEdit,
    handleToggleMenu,
    handleToggleArchive,
    handleDelete,
    handleResetProgress,
  };
}

export default useTaskCard;
