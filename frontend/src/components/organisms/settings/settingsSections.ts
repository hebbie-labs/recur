import type { ComponentType } from "react";
import AppearanceSection from "@/components/organisms/settings/AppearanceSection";
import NotificationsSection from "@/components/organisms/settings/NotificationsSection";
import PrivacySection from "@/components/organisms/settings/PrivacySection";
import LegalSection from "@/components/organisms/settings/LegalSection";

export type SettingsSection = {
  id: string;
  label: string;
  errorMessage: string;
  Component: ComponentType;
};

// Desktop zeigt alle 4 als Tabs (SettingsPage.tsx). Mobile drillt "notifications"/
// "appearance"/"privacy" per Route (settings/[section]/page.tsx) auf - "legal"
// verlinkt dort stattdessen direkt auf die bestehenden /impressum, /datenschutz,
// /agb-Seiten statt eine eigene Zwischenseite zu haben.
export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "notifications",
    label: "Benachrichtigungen",
    errorMessage:
      "Die Benachrichtigungs-Einstellungen konnten nicht angezeigt werden.",
    Component: NotificationsSection,
  },
  {
    id: "appearance",
    label: "Erscheinungsbild",
    errorMessage:
      "Die Erscheinungsbild-Einstellungen konnten nicht angezeigt werden.",
    Component: AppearanceSection,
  },
  {
    id: "privacy",
    label: "Privatsphäre",
    errorMessage: "Die Privatsphäre-Einstellungen konnten nicht angezeigt werden.",
    Component: PrivacySection,
  },
  {
    id: "legal",
    label: "Rechtliches",
    errorMessage: "Die rechtlichen Informationen konnten nicht angezeigt werden.",
    Component: LegalSection,
  },
];
