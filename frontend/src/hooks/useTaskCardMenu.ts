import { useState } from "react";
import { showUndoToast } from "@/lib/toast";

type UseTaskCardMenuParams = {
  onToggleMenu: () => void;
  onToggleEdit: () => void;
  onToggleArchive: () => void;
  onResetProgress: () => void;
  onDelete: () => void;
  isArchived: boolean;
  progress: number;
};

function useTaskCardMenu({
  onToggleMenu,
  onToggleEdit,
  onToggleArchive,
  onResetProgress,
  onDelete,
  isArchived,
  progress,
}: UseTaskCardMenuParams) {
  const [editOpen, setEditOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmResetProgressOpen, setConfirmResetProgressOpen] = useState(false);

  const canResetProgress = progress > 0;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onToggleMenu();
  };

  const handleToggleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditOpen(true);
    onToggleEdit();
  };

  const handleToggleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleArchive();
    showUndoToast(isArchived ? "Aufgabe wiederhergestellt" : "Aufgabe archiviert", () => {
      onToggleArchive();
    });
  };

  const handleRequestDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
    setConfirmDeleteOpen(false);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
  };

  // Bei Fortschritt 0 gibt es nichts zurückzusetzen — Dialog erst gar
  // nicht öffnen, auch falls das DropdownMenuItem trotz disabled einen
  // Klick durchlässt.
  const handleRequestResetProgress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canResetProgress) return;
    setOpen(false);
    setConfirmResetProgressOpen(true);
  };

  const handleConfirmResetProgress = () => {
    onResetProgress();
    setConfirmResetProgressOpen(false);
  };

  const handleCancelResetProgress = () => {
    setConfirmResetProgressOpen(false);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    onToggleEdit();
  };

  return {
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
  };
}

export default useTaskCardMenu;