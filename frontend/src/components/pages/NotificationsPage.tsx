import { useState } from "react";
import type { NotificationSettings } from "@/types/notifications";
import { updateNotificationSettings } from "@/services/notificationService";
import { Spinner } from "@/components/ui/spinner";
import NotificationForm from "../organisms/NotificationForm";
import useNotificationSettings from "@/hooks/useNotificationSettings";

type NotificationsPageProps = {
  initialSettings: NotificationSettings;
};

function NotificationsPage({ initialSettings }: NotificationsPageProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = async (update: Partial<NotificationSettings>) => {
    const previous = settings;
    setSettings({ ...settings, ...update });
    setError(null);
    setSaving(true);
    try {
      const saved = await updateNotificationSettings(update);
      setSettings(saved);
    } catch (error) {
      setSettings(previous);
      setError(
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Aktualisieren der Benachrichtigungseinstellungen"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <NotificationForm
        values={settings}
        disabled={saving}
        onFieldChange={handleFieldChange}
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function NotificationsPageWrapper() {
  const { settings } = useNotificationSettings();

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return <NotificationsPage initialSettings={settings} />;
}

export default NotificationsPageWrapper;
