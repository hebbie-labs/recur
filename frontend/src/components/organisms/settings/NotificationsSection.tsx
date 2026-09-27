import { useState } from "react";
import type { NotificationSettings } from "@/types/notifications";
import { updateNotificationSettings } from "@/services/notificationService";
import { disablePushNotifications, enablePushNotifications } from "@/services/pushService";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationForm from "./NotificationForm";
import useNotificationSettings from "@/hooks/useNotificationSettings";

type NotificationsSectionProps = {
  initialSettings: NotificationSettings;
};

function NotificationsSection({ initialSettings }: NotificationsSectionProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = async (update: Partial<NotificationSettings>) => {
    const previous = settings;
    setSettings({ ...settings, ...update });
    setError(null);
    setSaving(true);
    try {
      // Browser-Berechtigung/Subscription zuerst - schlägt das fehl (z.B.
      // Berechtigung verweigert), soll gar nicht erst emailEnabled/pushEnabled
      // beim Backend gespeichert werden.
      if (update.pushEnabled === true) {
        await enablePushNotifications();
      } else if (update.pushEnabled === false) {
        await disablePushNotifications();
      }

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
    <>
      <NotificationForm
        values={settings}
        disabled={saving}
        onFieldChange={handleFieldChange}
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </>
  );
}

function NotificationsSectionWrapper() {
  const { settings } = useNotificationSettings();

  if (!settings) {
    return <Skeleton className="h-40 w-full" />;
  }

  return <NotificationsSection initialSettings={settings} />;
}

export default NotificationsSectionWrapper;
