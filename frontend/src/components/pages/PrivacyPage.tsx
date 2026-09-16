import { useState } from "react";
import type { PrivacySettings } from "@/types/privacy";
import { updatePrivacySettings } from "@/services/privacyService";
import { deleteCurrentUser, logout } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import PrivacyForm from "../organisms/PrivacyForm";
import usePrivacySettings from "@/hooks/usePrivacySettings";

type PrivacyPageProps = {
  initialSettings: PrivacySettings;
};

function PrivacyPage({ initialSettings }: PrivacyPageProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleFieldChange = async (update: Partial<PrivacySettings>) => {
    const previous = settings;
    setSettings({ ...settings, ...update });
    setError(null);
    setSaving(true);
    try {
      const saved = await updatePrivacySettings(update);
      setSettings(saved);
    } catch (error) {
      setSettings(previous);
      setError(
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Aktualisieren der Privatsphäre-Einstellungen"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteCurrentUser();
      logout();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Löschen des Kontos"
      );
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <PrivacyForm
        values={settings}
        disabled={saving}
        onFieldChange={handleFieldChange}
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <Separator className="my-6" />

      <div>
        <h3 className="text-sm font-medium text-destructive">Konto löschen</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Löscht dein Konto und alle zugehörigen Daten unwiderruflich.
        </p>
        <ConfirmDialog
          severity="high"
          question="Konto löschen"
          description="Bist du sicher, dass du dein Konto löschen möchtest? Dies kann nicht rückgängig gemacht werden."
          open={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
          onConfirm={handleDeleteAccount}
          confirmText={deleting ? "Wird gelöscht..." : "Löschen"}
          cancelText="Abbrechen"
          trigger={
            <Button variant="destructive" className="mt-3">
              Konto löschen
            </Button>
          }
        />
        {deleteError && (
          <p className="mt-2 text-sm text-destructive">{deleteError}</p>
        )}
      </div>
    </div>
  );
}

function PrivacyPageWrapper() {
  const { settings } = usePrivacySettings();

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return <PrivacyPage initialSettings={settings} />;
}

export default PrivacyPageWrapper;
