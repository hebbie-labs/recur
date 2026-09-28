import { useCallback, useState } from "react";
import { showSuccessToast } from "@/lib/toast";

type UseArchiveSelectionParams = {
  taskIds: string[];
  onDelete: (id: string, silent?: boolean) => Promise<void> | void;
};

function useArchiveSelection({ taskIds, onDelete }: UseArchiveSelectionParams) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(taskIds));
  }, [taskIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const enterSelectMode = useCallback(() => {
    setSelectMode(true);
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    clearSelection();
  }, [clearSelection]);

  const selectedCount = selectedIds.size;
  const allSelected = taskIds.length > 0 && selectedCount === taskIds.length;

  const toggleAllSelected = useCallback(() => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [allSelected, clearSelection, selectAll]);

  const requestBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    setConfirmBulkDeleteOpen(true);
  }, [selectedIds]);

  const confirmBulkDelete = useCallback(async () => {
    await Promise.all(Array.from(selectedIds).map((id) => onDelete(id, true)));
    setConfirmBulkDeleteOpen(false);
    showSuccessToast(`${selectedCount} ${selectedCount === 1 ? "Aufgabe wurde" : "Aufgaben wurden"} gelöscht.`);
    exitSelectMode();
  }, [selectedIds, selectedCount, onDelete, exitSelectMode]);

  const cancelBulkDelete = useCallback(() => {
    setConfirmBulkDeleteOpen(false);
  }, []);

  return {
    selectMode,
    selectedIds,
    selectedCount,
    allSelected,
    isSelected,
    toggleSelect,
    selectAll,
    clearSelection,
    enterSelectMode,
    exitSelectMode,
    toggleAllSelected,
    confirmBulkDeleteOpen,
    requestBulkDelete,
    confirmBulkDelete,
    cancelBulkDelete,
  };
}

export default useArchiveSelection;