import Empty from "@/components/molecules/Empty";
import { OctagonXIcon } from "lucide-react";
import { useTasksContext } from "@/contexts/TasksContext";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import TaskCardGrid from "@/components/molecules/TaskCardGrid";
import TaskCardGridSkeleton from "../molecules/TaskCardGridSkeleton";

function FavoritesPage() {
  const router = useRouter();

  const {
    loading,
    favoriteTasks,
    handleToggleFavorite,
    handleToggleArchive,
    handleDelete,
  } = useTasksContext();

  const handlers = useMemo(
    () => ({
      onToggleFavorite: handleToggleFavorite,
      onToggleArchive: handleToggleArchive,
      onDelete: handleDelete,
    }),
    [handleToggleFavorite, handleToggleArchive, handleDelete],
  );

  if (loading) {
    return <TaskCardGridSkeleton count={6} direction="row" />;
  }

  if (favoriteTasks.length === 0) {
    return (
      <Empty
        icon={() => <OctagonXIcon className="w-12 h-12 text-gray-400" />}
        title="Keine favorisierten Aufgaben"
        description="Es gibt derzeit keine favorisierten Aufgaben."
        buttonText="Zurück zu den Aufgaben"
        onButtonClick={() => router.push("/")}
      />
    );
  }

  return (
    <div>
      <TaskCardGrid
        sortedTasks={favoriteTasks}
        handlers={handlers}
        direction="row"
      />
    </div>
  );
}

export default FavoritesPage;