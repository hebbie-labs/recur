import TaskCardSkeleton from "@/components/organisms/task/TaskCardSkeleton";
import { cn } from "@/lib/utils";

type TaskCardSkeletonGridProps = {
  count?: number;
  direction?: "row" | "column";
};

function TaskCardSkeletonGrid({
  count = 6,
  direction,
}: TaskCardSkeletonGridProps) {
  return (
    <div
      className={cn(
        "grid w-full gap-4 p-4",
        direction === "column" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <TaskCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default TaskCardSkeletonGrid;