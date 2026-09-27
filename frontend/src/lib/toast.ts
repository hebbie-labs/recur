import { toast } from "sonner";

const commonOptions = {
  duration: 3000,
};

export function showToast(message: string) {
  toast(message, commonOptions);
}

type ToastAction = {
  label: string;
  onClick: () => void;
};

export function showToastWithAction(message: string, action: ToastAction) {
  toast(message, {
    ...commonOptions,
    action,
  });
}

export function showUndoToast(message: string, onUndo: () => void) {
  toast(message, {
    ...commonOptions,
    action: {
      label: "Rückgängig",
      onClick: onUndo,
    },
  });
}

export function showInfoToast(message: string) {
  toast.info(message, {
    ...commonOptions,
    className: "!bg-info !text-info-foreground",
  });
}

export function showErrorToast(message: string) {
  toast.error(message, {
    ...commonOptions,
    className: "!bg-destructive !text-destructive-foreground",
  });
}

export function showSuccessToast(message: string) {
  toast.success(message, {
    ...commonOptions,
    className: "!bg-success !text-success-foreground",
  });
}

export function showWarningToast(message: string) {
  toast.warning(message, {
    ...commonOptions,
    className: "!bg-warning !text-warning-foreground",
  });
}

const SYNC_ERROR_TOAST_ID = "auto-sync-error";

/** Bleibt sichtbar bis dismissSyncErrorToast() (nächster erfolgreicher Poll). */
export function showSyncErrorToast(message: string) {
  toast.warning(message, {
    id: SYNC_ERROR_TOAST_ID,
    duration: Infinity,
    className: "!bg-warning !text-warning-foreground",
  });
}

export function dismissSyncErrorToast() {
  toast.dismiss(SYNC_ERROR_TOAST_ID);
}