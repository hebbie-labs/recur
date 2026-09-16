import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { type Task } from "@/services/taskService";
import TaskFavorite from "@/components/atoms/TaskFavorite";
import TaskCardMenu from "./TaskCardMenu";
import TaskDescription from "@/components/atoms/TaskDescription";
import TaskTimeFrame from "@/components/atoms/TaskTimeFrame";
import TaskTitle from "@/components/atoms/TaskTitle";
import ProgressIndicator from "@/components/atoms/ProgressIndicator";
import useTaskCard from "@/hooks/useTaskCard";
import { categoryLabels } from "@/lib/taskCategoryStyles";
import { categoryDot } from "@/utils/calendarGrid";
import { useTasksContext } from "@/contexts/TasksContext";

type TaskCardProps = {
  task: Task;
  className?: string;
  onToggleFavorite?: () => void;
  onToggleMenu?: () => void;
  onToggleEdit?: () => void;
  onToggleArchive?: () => void;
  onResetProgress?: () => void;
  onDelete?: () => void;
  onToggleDone?: () => void;
  onTaskUpdated?: (task: Task) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
};

function TaskCard({
  task,
  className,
  onToggleFavorite,
  onToggleEdit,
  onToggleMenu,
  onToggleArchive,
  onResetProgress,
  onDelete,
  onToggleDone,
  onTaskUpdated,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: TaskCardProps) {
  const { isArchivedForCurrentUser } = useTasksContext();
  const {
    clampedProgress,
    handleDone,
    handleToggleFavorite,
    handleToggleEdit,
    handleToggleMenu,
    handleToggleArchive,
    handleDelete,
    handleResetProgress,
  } = useTaskCard({
    progress: task.progress,
    onToggleFavorite,
    onToggleEdit,
    onToggleMenu,
    onToggleArchive,
    onResetProgress,
    onDelete,
    onToggleDone,
  });

  // Im Auswahlmodus wählt ein Klick auf die Card das Habit aus/ab,
  // statt wie sonst handleDone (Fortschritt erhöhen) auszulösen.
  const handleCardClick = () => {
    if (selectMode) {
      onToggleSelect?.();
      return;
    }
    handleDone();
  };

  return (
    <Card
      className={cn(
        "flex h-full flex-col cursor-pointer transition-colors",
        selectMode && selected && "ring-2 ring-primary",
        className
      )}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={
        selectMode
          ? selected
            ? `${task.name} abwählen`
            : `${task.name} auswählen`
          : `${task.name}, Fortschritt erhöhen`
      }
      onKeyDown={(e) => {
        // Nur reagieren, wenn die Card selbst (nicht ein verschachteltes
        // Steuerelement wie TaskCardMenu/TaskFavorite oder ein daraus
        // geöffneter Dialog) das Ziel des Events ist. Sonst bubbelt z.B. ein
        // Leerzeichen beim Tippen im Bearbeiten-Dialog hierher hoch und
        // erhöht ungewollt den Fortschritt, während es im Eingabefeld
        // verschluckt wird.
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <CardHeader
        className="flex flex-row items-center justify-between gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <ProgressIndicator value={clampedProgress} />
        {selectMode ? (
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect?.()}
            aria-label={selected ? "Aufgabe abwählen" : "Aufgabe auswählen"}
          />
        ) : (
          <TaskCardMenu
            task={task}
            onToggleMenu={handleToggleMenu}
            onToggleEdit={handleToggleEdit}
            onToggleArchive={handleToggleArchive}
            onDelete={handleDelete}
            onResetProgress={handleResetProgress}
            onTaskUpdated={onTaskUpdated}
            isArchived={isArchivedForCurrentUser(task)}
          />
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", categoryDot[task.category])} />
          {categoryLabels[task.category]}
          {task.project && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
              {task.project.name}
            </span>
          )}
        </div>
        <div className="line-clamp-1">
          <TaskTitle title={task.name} />
        </div>
        <div className="line-clamp-2 flex-1">
          <TaskDescription description={task.description} />
        </div>
        <div className="mt-auto flex items-center gap-4 justify-between">
          <TaskTimeFrame start={task.startTime ?? null} end={task.dateUntil} />
          <div className="flex items-center gap-2">
            {task.project && task.assignedMembers && task.assignedMembers.length > 0 && (
              <div className="flex -space-x-2">
                {task.assignedMembers.map((member) => (
                  <Avatar
                    key={member.id}
                    size="sm"
                    className="ring-2 ring-background"
                    title={`Zugewiesen: ${member.firstName} ${member.lastName}`}
                  >
                    <AvatarImage src={member.avatarUrl ?? undefined} />
                    <AvatarFallback>
                      {`${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
            {task.completedBy && (
              <Avatar
                size="sm"
                title={`Erledigt von ${task.completedBy.firstName} ${task.completedBy.lastName}`}
              >
                <AvatarImage src={task.completedBy.avatarUrl ?? undefined} />
                <AvatarFallback>
                  {`${task.completedBy.firstName[0] ?? ""}${task.completedBy.lastName[0] ?? ""}`.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <TaskFavorite
              isFavorite={task.isFavorite || false}
              onClick={handleToggleFavorite}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TaskCard;
