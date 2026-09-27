import axios from "axios";
import api from "./api";
import type { PrivacySettings } from "@/types/privacy";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string } | undefined)?.message ??
      fallback
    );
  }
  return fallback;
}

export function getPrivacySettings(): Promise<PrivacySettings> {
  return api
    .get("/auth/me/privacy-settings")
    .then((response) => response.data as PrivacySettings)
    .catch((err) => {
      throw new Error(
        extractErrorMessage(err, "Fehler beim Laden der Privatsphäre-Einstellungen")
      );
    });
}

export function updatePrivacySettings(
  update: Partial<PrivacySettings>
): Promise<PrivacySettings> {
  return api
    .patch("/auth/me/privacy-settings", update)
    .then((response) => response.data as PrivacySettings)
    .catch((err) => {
      throw new Error(
        extractErrorMessage(err, "Fehler beim Aktualisieren der Privatsphäre-Einstellungen")
      );
    });
}
