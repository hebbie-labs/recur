import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import LoadingButton from "@/components/atoms/loading/LoadingButton";

type ConfirmDialogProps = {
  severity?: "normal" | "high";
  question: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Spinner + disabled auf dem Confirm-Button während einer laufenden Mutation. */
  loading?: boolean;
};

function ConfirmDialog({
  severity,
  trigger,
  question,
  description,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  open,
  onOpenChange,
  loading,
}: ConfirmDialogProps) {

  const buttonVariant = severity === "high" ? "destructive" : "default";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger render={trigger} />}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{question}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={loading}>
            {cancelText || "Abbrechen"}
          </AlertDialogCancel>
          <LoadingButton onClick={onConfirm} variant={buttonVariant} loading={loading}>
            {confirmText || "Fortfahren"}
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDialog;