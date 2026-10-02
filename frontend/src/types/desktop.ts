import type { OAuth2Mode } from "@/types/auth";

export type OAuth2Provider = "google" | "github";

export type ThemeName = "light" | "dark";

// Brücke der Desktop-App (desktop/src/preload.ts). Existiert nur in Electron,
// im normalen Browser ist window.recurDesktop undefined.
declare global {
  interface Window {
    recurDesktop?: {
      isDesktop: true;
      openLogin: (provider: OAuth2Provider, mode: OAuth2Mode) => void;
      // Färbt die Fenster-Buttons (Minimieren/Maximieren/Schließen) passend zum
      // Theme. Optional, weil ältere Versionen der Desktop-App sie nicht kennen.
      setTitleBarTheme?: (theme: ThemeName) => void;
    };
  }
}
