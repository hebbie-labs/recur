import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditTaskForm from "./EditTaskForm";
import type { Task } from "@/types/task";
import ConfirmDialog from "@/components/molecules/dialog/ConfirmDialog";
import useTaskCardMenu from "@/hooks/useTaskCardMenu";
import { useTasksContext } from "@/contexts/TasksContext";
import { useAuth } from "@/contexts/AuthContext";

type TaskCardMenuProps = {
  task: Task;
  onToggleMenu: () => void;
  onToggleEdit: () => void;
  onToggleArchive: () => void;
  onResetProgress: () => void;
  onDelete: () => void;
  onTaskUpdated?: (task: Task) => void;
  isArchived: boolean;
  /** Bei Gruppen-Tasks nur true für den Gruppen-Admin - persönliche Tasks immer true. */
  canEdit?: boolean;
};

function TaskCardMenu({
  task,
  onToggleEdit,
  onToggleMenu,
  onToggleArchive,
  onResetProgress,
  onDelete,
  onTaskUpdated,
  isArchived,
  canEdit = true,
}: TaskCardMenuProps) {
  const { handleToggleAssign } = useTasksContext();
  const { user } = useAuth();
  const isAssignedToMe = task.assignedMembers?.some((m) => m.id === user?.id) ?? false;
  const {
    open,
    editOpen,
    confirmDeleteOpen,
    confirmResetProgressOpen,
    canResetProgress,
    handleOpenChange,
    handleToggleEdit,
    handleToggleArchive,
    handleRequestDelete,
    handleConfirmDelete,
    handleCancelDelete,
    handleRequestResetProgress,
    handleConfirmResetProgress,
    handleCancelResetProgress,
    handleEditClose,
  } = useTaskCardMenu({
    onToggleMenu,
    onToggleEdit,
    onToggleArchive,
    onResetProgress,
    onDelete,
    isArchived,
    progress: task.progress,
  });

  return (
    <>
      {editOpen && (
        <EditTaskForm task={task} onClose={handleEditClose} onTaskUpdated={onTaskUpdated} />
      )}

      <ConfirmDialog
        severity="high"
        question="Aufgabe löschen"
        description="Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?"
        open={confirmDeleteOpen}
        onOpenChange={(next) => !next && handleCancelDelete()}
        onConfirm={handleConfirmDelete}
        confirmText="Löschen"
        cancelText="Abbrechen"
        onCancel={handleCancelDelete}
      />

      <ConfirmDialog
        severity="high"
        question="Fortschritt zurücksetzen"
        description="Sind Sie sicher, dass Sie den Fortschritt dieser Aufgabe zurücksetzen möchten?"
        open={confirmResetProgressOpen}
        onOpenChange={(next) => !next && handleCancelResetProgress()}
        onConfirm={handleConfirmResetProgress}
        confirmText="Zurücksetzen"
        cancelText="Abbrechen"
        onCancel={handleCancelResetProgress}
      />

      <DropdownMenu open={open} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger
          onClick={(e) => e.stopPropagation()}
          render={
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="Aufgaben-Menü"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          {isArchived ? (
            <>
              <DropdownMenuItem onClick={handleToggleArchive}>
                Aus Archiv Entfernen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRequestDelete} className="text-destructive">
                Löschen
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {canEdit && (
                <DropdownMenuItem onClick={handleToggleEdit}>Bearbeiten</DropdownMenuItem>
              )}
              {task.project && (
                <DropdownMenuItem onClick={() => handleToggleAssign(task.id)}>
                  {isAssignedToMe ? "Zuweisung entfernen" : "Mir zuweisen"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleToggleArchive}>Archivieren</DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleRequestResetProgress}
                disabled={!canResetProgress}
                className="text-destructive"
              >
                Fortschritt zurücksetzen
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export default TaskCardMenu;