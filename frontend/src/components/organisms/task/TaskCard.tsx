import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { type Task } from "@/types/task";
import TaskFavorite from "@/components/atoms/task/TaskFavorite";
import TaskCardMenu from "./TaskCardMenu";
import TaskDescription from "@/components/atoms/task/TaskDescription";
import TaskTimeFrame from "@/components/atoms/task/TaskTimeFrame";
import TaskTitle from "@/components/atoms/task/TaskTitle";
import ProgressIndicator from "@/components/atoms/ProgressIndicator";
import TaskDetailDialog from "@/components/organisms/dialogs/TaskDetailDialog";
import useTaskCard from "@/hooks/useTaskCard";
import { categoryLabels } from "@/lib/taskCategoryStyles";
import { categoryDot } from "@/utils/calendarGrid";
import { useTasksContext } from "@/contexts/TasksContext";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupsContext } from "@/contexts/GroupsContext";

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
  const { user } = useAuth();
  const { groups, projectsByGroupId } = useGroupsContext();

  // Die Gruppe eines Task-Projekts ist auf Task selbst nicht bekannt (nur
  // project.id/name) - über projectsByGroupId zurück auflösen.
  const projectGroup = useMemo(() => {
    if (!task.project) return null;
    const groupId = Object.entries(projectsByGroupId).find(([, projects]) =>
      projects.some((p) => p.id === task.project!.id)
    )?.[0];
    return groups.find((g) => g.id === groupId) ?? null;
  }, [task.project, projectsByGroupId, groups]);

  // Man selbst immer an erster Stelle im Avatar-Stack.
  const groupMembers = useMemo(() => {
    if (!projectGroup) return [];
    const self = projectGroup.members.find((m) => m.id === user?.id);
    const others = projectGroup.members.filter((m) => m.id !== user?.id);
    return self ? [self, ...others] : others;
  }, [projectGroup, user?.id]);

  const visibleGroupMembers = groupMembers.slice(0, 3);
  const overflowMemberCount = groupMembers.length - visibleGroupMembers.length;

  // Nur der Gruppen-Admin darf einen geteilten Projekt-Task bearbeiten
  // (siehe TaskService#isGroupAdmin im Backend) - persönliche Tasks bleiben
  // unbeschränkt.
  const canEditTask = !projectGroup || projectGroup.createdBy?.id === user?.id;

  const {
    clampedProgress,
    doneForCurrentPeriod,
    handleDone,
    handleToggleFavorite,
    handleToggleEdit,
    handleToggleMenu,
    handleToggleArchive,
    handleDelete,
    handleResetProgress,
  } = useTaskCard({
    progress: task.progress,
    task,
    onToggleFavorite,
    onToggleEdit,
    onToggleMenu,
    onToggleArchive,
    onResetProgress,
    onDelete,
    onToggleDone,
  });

  const [detailOpen, setDetailOpen] = useState(false);

  // Im Auswahlmodus wählt ein Klick auf die Card das Habit aus/ab. Sonst
  // öffnet die restliche Card-Fläche die Detailansicht - der Fortschritt
  // wird nur noch über den dedizierten Abhaken-Button geändert (#136).
  const handleCardClick = () => {
    if (selectMode) {
      onToggleSelect?.();
      return;
    }
    setDetailOpen(true);
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
          : `${task.name}, Details anzeigen`
      }
      onKeyDown={(e) => {
        // Nur reagieren, wenn die Card selbst (nicht ein verschachteltes
        // Steuerelement wie TaskCardMenu/TaskFavorite/Abhaken-Button oder ein
        // daraus geöffneter Dialog) das Ziel des Events ist. Sonst bubbelt
        // z.B. ein Leerzeichen beim Tippen im Bearbeiten-Dialog hierher hoch
        // und öffnet ungewollt die Detailansicht, während es im Eingabefeld
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
        <div className="flex items-center gap-2">
          {!selectMode && !isArchivedForCurrentUser(task) && (
            <Button
              size="sm"
              variant={doneForCurrentPeriod ? "outline" : "default"}
              // Geteilte Projekt-Tasks (ausserhalb von #152) behalten die alte
              // Sperre; persönliche Tasks sind stattdessen toggle-bar (Klick
              // macht das Häkchen wieder rückgängig).
              disabled={Boolean(task.project) && doneForCurrentPeriod}
              onClick={handleDone}
              title={
                !task.project && doneForCurrentPeriod
                  ? "Klicken, um rückgängig zu machen"
                  : undefined
              }
            >
              {doneForCurrentPeriod ? "Erledigt" : "Abhaken"}
            </Button>
          )}
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
              canEdit={canEditTask}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", categoryDot[task.category])} />
          {categoryLabels[task.category]}
          {task.project && (
            groupMembers.length > 0 ? (
              <div className="flex -space-x-1.5" title={task.project.name}>
                {visibleGroupMembers.map((member) => (
                  <Avatar
                    key={member.id}
                    size="sm"
                    className={cn(
                      "ring-2",
                      member.id === user?.id ? "ring-foreground" : "ring-background"
                    )}
                    title={`${member.firstName} ${member.lastName}`}
                  >
                    <AvatarImage src={member.avatarUrl ?? undefined} />
                    <AvatarFallback>
                      {`${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`.toUpperCase()}
                    </AvatarFallback>
                    {projectGroup?.createdBy?.id === member.id && (
                      <AvatarBadge className="top-0 right-0 bottom-auto text-[8px]">
                        A
                      </AvatarBadge>
                    )}
                  </Avatar>
                ))}
                {overflowMemberCount > 0 && (
                  <AvatarGroupCount className="size-6 text-[10px] ring-2 ring-background">
                    +{overflowMemberCount}
                  </AvatarGroupCount>
                )}
              </div>
            ) : (
              <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                {task.project.name}
              </span>
            )
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

      {/* stopPropagation: Klicks im Dialog bubbeln sonst über den React-Tree
          (Radix rendert per Portal, das DOM-Nesting schützt hier nicht) zum
          Card-onClick hoch und würden ungewollt handleCardClick auslösen. */}
      <div onClick={(e) => e.stopPropagation()}>
        <TaskDetailDialog
          task={task}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          onToggleArchive={handleToggleArchive}
          onResetProgress={handleResetProgress}
          onDelete={handleDelete}
          onToggleDone={handleDone}
          onTaskUpdated={onTaskUpdated}
          isArchived={isArchivedForCurrentUser(task)}
          doneForCurrentPeriod={doneForCurrentPeriod}
          canEdit={canEditTask}
        />
      </div>
    </Card>
  );
}

export default TaskCard;
