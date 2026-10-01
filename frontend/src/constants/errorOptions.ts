import {
  AlertTriangle,
  FileQuestion,
  ShieldAlert,
  ServerCrash,
  UserX,
  WifiOff,
  type LucideIcon,
} from "lucide-react";

export type ErrorOption = {
  icon: LucideIcon;
  message: string;
};

export const ERROR_OPTIONS: Record<number, ErrorOption> = {
  400: { icon: AlertTriangle, message: "Ungültige Anfrage" },
  401: { icon: ShieldAlert, message: "Nicht autorisiert" },
  403: { icon: ShieldAlert, message: "Zugriff verweigert" },
  404: { icon: FileQuestion, message: "Seite nicht gefunden" },
  409: { icon: UserX, message: "Konflikt mit einem bestehenden Konto" },
  500: { icon: ServerCrash, message: "Interner Serverfehler" },
  503: { icon: WifiOff, message: "Dienst nicht verfügbar" },
};

export const DEFAULT_ERROR_OPTION: ErrorOption = {
  icon: AlertTriangle,
  message: "Ein unbekannter Fehler ist aufgetreten",
};
