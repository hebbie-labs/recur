import axios from "axios";
import api from "./api";
import type { NotificationSettings } from "@/types/notifications";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string } | undefined)?.message ??
      fallback
    );
  }
  return fallback;
}

export function getNotificationSettings(): Promise<NotificationSettings> {
  return api
    .get("/auth/me/notification-settings")
    .then((response) => response.data as NotificationSettings)
    .catch((err) => {
      throw new Error(
        extractErrorMessage(err, "Fehler beim Laden der Benachrichtigungseinstellungen")
      );
    });
}

export function updateNotificationSettings(
  update: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  return api
    .patch("/auth/me/notification-settings", update)
    .then((response) => response.data as NotificationSettings)
    .catch((err) => {
      throw new Error(
        extractErrorMessage(err, "Fehler beim Aktualisieren der Benachrichtigungseinstellungen")
      );
    });
}
