import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SetPasswordForm from "@/components/organisms/settings/SetPasswordForm";
import { useAuth } from "@/contexts/AuthContext";

// sessionStorage statt localStorage: "Später" soll nur bis zum Ende der
// Browser-Sitzung gelten, danach wird wieder erinnert (#236).
const DISMISSED_KEY = "recur.setPasswordReminder.dismissed";

function readDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    window.sessionStorage.setItem(DISMISSED_KEY, "true");
  } catch {
    // sessionStorage kann z.B. im privaten Modus blockiert sein - dann
    // erscheint die Erinnerung beim nächsten Reload eben erneut.
  }
}

/** Nicht-blockierende Erinnerung für Accounts ohne Passwort (über Google/GitHub entstanden, #236): einmal pro Browser-Sitzung, wegklickbar. Dauerhaft erreichbar bleibt das Setzen auf der Account-Seite. */
function SetPasswordReminderDialog() {
  const { user } = useAuth();
  // Lazy-Init ist SSR-sicher: user ist beim Server-Render und ersten
  // Client-Render ohnehin noch null (AuthContext lädt erst clientseitig),
  // der Dialog also in beiden Fällen geschlossen.
  const [dismissed, setDismissed] = useState(() =>
    typeof window === "undefined" ? true : readDismissed(),
  );

  const dismiss = () => {
    writeDismissed();
    setDismissed(true);
  };

  const open = !!user && !user.hasPassword && !dismissed;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && dismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Passwort setzen</DialogTitle>
          <DialogDescription>
            Damit du dich auch mit deiner E-Mail anmelden kannst.
          </DialogDescription>
        </DialogHeader>
        <SetPasswordForm
          onSuccess={() => setDismissed(true)}
          onCancel={dismiss}
        />
      </DialogContent>
    </Dialog>
  );
}

export default SetPasswordReminderDialog;
