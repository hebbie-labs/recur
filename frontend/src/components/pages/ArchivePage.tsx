import Empty from "@/components/molecules/Empty";
import ConfirmDialog from "@/components/molecules/dialog/ConfirmDialog";
import ArchiveSelectionToolbar from "@/components/molecules/ArchiveSelectionToolbar";
import { OctagonXIcon } from "lucide-react";
import { useTasksContext } from "@/contexts/TasksContext";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import TaskCardGrid from "@/components/molecules/task/TaskCardGrid";
import useArchiveSelection from "@/hooks/useArchiveSelection";
import TaskCardGridSkeleton from "../molecules/task/TaskCardGridSkeleton";

function ArchivePage() {
  const router = useRouter();

  const {
    archivedTasks,
    loading,
    handleToggleFavorite,
    handleToggleArchive,
    handleDelete,
  } = useTasksContext();

  const archivedTaskIds = useMemo(() => archivedTasks.map((task) => task.id), [archivedTasks]);

  const {
    selectMode,
    selectedIds,
    selectedCount,
    allSelected,
    toggleSelect,
    enterSelectMode,
    exitSelectMode,
    toggleAllSelected,
    confirmBulkDeleteOpen,
    requestBulkDelete,
    confirmBulkDelete,
    cancelBulkDelete,
  } = useArchiveSelection({ taskIds: archivedTaskIds, onDelete: handleDelete });

  const handlers = useMemo(
    () => ({
      onToggleFavorite: handleToggleFavorite,
      onToggleArchive: handleToggleArchive,
      onDelete: handleDelete,
      onToggleSelect: toggleSelect,
    }),
    [handleToggleFavorite, handleToggleArchive, handleDelete, toggleSelect],
  );

  if (loading) return <TaskCardGridSkeleton count={6} direction="column" />;

  if (archivedTasks.length === 0) {
    return (
      <Empty
        title="Keine archivierten Aufgaben"
        description="Es gibt derzeit keine archivierten Aufgaben."
        buttonText="Zurück zu den Aufgaben"
        onButtonClick={() => router.push("/")}
        icon={() => <OctagonXIcon className="h-12 w-12 text-muted-foreground" />}
      />
    );
  }

  return (
    <div className="w-full pb-20">
      <ConfirmDialog
        severity="high"
        question="Aufgaben löschen"
        description={`Sind Sie sicher, dass Sie ${selectedCount} ${selectedCount === 1 ? "Aufgabe" : "Aufgaben"} löschen möchten? Dies kann nicht rückgängig gemacht werden.`}
        open={confirmBulkDeleteOpen}
        onOpenChange={(next) => !next && cancelBulkDelete()}
        onConfirm={confirmBulkDelete}
        onCancel={cancelBulkDelete}
        confirmText="Löschen"
        cancelText="Abbrechen"
      />

      <ArchiveSelectionToolbar
        selectMode={selectMode}
        selectedCount={selectedCount}
        allSelected={allSelected}
        onEnterSelectMode={enterSelectMode}
        onExitSelectMode={exitSelectMode}
        onToggleAllSelected={toggleAllSelected}
        onRequestBulkDelete={requestBulkDelete}
      />

      <TaskCardGrid
        sortedTasks={archivedTasks}
        handlers={handlers}
        direction="column"
        selectMode={selectMode}
        selectedIds={selectedIds}
      />
    </div>
  );
}

export default ArchivePage;