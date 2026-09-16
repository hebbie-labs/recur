import type { NotificationSettings } from "@/types/notifications";
import { useEffect, useState } from "react";
import { getNotificationSettings } from "@/services/notificationService";

function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const current = await getNotificationSettings();
        setSettings(current);
      } catch (error) {
        console.error("Error fetching notification settings:", error);
      }
    };

    fetchSettings();
  }, []);

  return { settings };
}

export default useNotificationSettings;
