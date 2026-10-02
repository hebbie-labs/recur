import type { OAuth2Mode } from "@/types/auth";

export type OAuth2Provider = "google" | "github";

// Brücke der Desktop-App (desktop/src/preload.ts). Existiert nur in Electron,
// im normalen Browser ist window.recurDesktop undefined.
declare global {
  interface Window {
    recurDesktop?: {
      isDesktop: true;
      openLogin: (provider: OAuth2Provider, mode: OAuth2Mode) => void;
    };
  }
}
