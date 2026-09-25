import { useMemo, useState } from "react";
import TaskCard from "@/components/organisms/task/TaskCard";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import Pagination from "@/components/atoms/Pagination";
import { type Task } from "@/types/task";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

type TaskCardHandlers = {
  onToggleFavorite?: (taskId: string) => void;
  onToggleMenu?: (taskId: string) => void;
  onToggleArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onResetProgress?: (taskId: string) => void;
  onToggleDone?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onTaskUpdated?: (task: Task) => void;
  onToggleSelect?: (taskId: string) => void;
};

type TaskCardGridProps = {
  sortedTasks: Task[];
  direction?: "row" | "column";
  handlers: TaskCardHandlers;
  selectMode?: boolean;
  selectedIds?: Set<string>;
  paginate?: boolean;
};

function TaskCardGrid({
  sortedTasks,
  handlers,
  direction,
  selectMode = false,
  selectedIds,
  paginate = false,
}: TaskCardGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [prevSortedTasks, setPrevSortedTasks] = useState(sortedTasks);

  if (sortedTasks !== prevSortedTasks) {
    setPrevSortedTasks(sortedTasks);
    setCurrentPage(1);
  }

  const totalPages = paginate ? Math.max(1, Math.ceil(sortedTasks.length / PAGE_SIZE)) : 1;

  const visibleTasks = useMemo(() => {
    if (!paginate) {
      return sortedTasks;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedTasks.slice(start, start + PAGE_SIZE);
  }, [sortedTasks, paginate, currentPage]);

  return (
    <div>
      <div
        className={cn(
          "grid w-full gap-4 p-4",
          direction === "column" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}
      >
        {visibleTasks.map((task) => (
          <ReactErrorBoundary
            key={task.id}
            variant="inline"
            errorMessage="Diese Aufgabe konnte nicht angezeigt werden."
          >
            <TaskCard
              task={task}
              onToggleFavorite={() => handlers.onToggleFavorite?.(task.id)}
              onToggleMenu={() => handlers.onToggleMenu?.(task.id)}
              onToggleArchive={() => handlers.onToggleArchive?.(task.id)}
              onResetProgress={() => handlers.onResetProgress?.(task.id)}
              onDelete={() => handlers.onDelete?.(task.id)}
              onToggleEdit={() => handlers.onEdit?.(task.id)}
              onToggleDone={() => handlers.onToggleDone?.(task.id)}
              onTaskUpdated={handlers.onTaskUpdated}
              selectMode={selectMode}
              selected={selectedIds?.has(task.id) ?? false}
              onToggleSelect={() => handlers.onToggleSelect?.(task.id)}
            />
          </ReactErrorBoundary>
        ))}
      </div>

      {paginate && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

export default TaskCardGrid;