import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/atoms/loading/LoadingButton";

type AppDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  onSubmit?: () => void;
  loading?: boolean;
  submitDisabled?: boolean;
  contentClassName?: string;
  closeLabel?: string;
  submitLabel?: string;
  /** Ersetzt den Standard-Footer (Abbrechen + Speichern) - für Dialoge mit eigener Button-Reihe, z.B. ein Wizard mit Zurück/Weiter/Erstellen. */
  footer?: ReactNode;
};

function AppDialog({
  open,
  onClose,
  title,
  children,
  onSubmit,
  loading,
  submitDisabled,
  contentClassName,
  closeLabel = "Abbrechen",
  submitLabel = "Speichern",
  footer,
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={contentClassName}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}

        {children}

        <DialogFooter>
          {footer ?? (
            <>
              <Button variant="outline" onClick={onClose}>
                {closeLabel}
              </Button>
              <LoadingButton
                onClick={onSubmit}
                disabled={submitDisabled}
                loading={loading}
              >
                {submitLabel}
              </LoadingButton>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AppDialog;
