import type { OAuth2Mode } from "@/types/auth";
import type { OAuth2Provider } from "@/types/desktop";

// In der Desktop-App läuft der Provider-Login im Systembrowser (Google
// blockt eingebettete Fenster, und die Cookies müssten sonst beim Browser
// landen statt in der App) - die App kümmert sich darum, siehe
// OAuth2AuthenticationSuccessHandler#completeDesktopLogin im Backend. Im
// normalen Browser geht es direkt zum Backend.
export function startOAuthLogin(provider: OAuth2Provider, mode: OAuth2Mode) {
  if (window.recurDesktop) {
    window.recurDesktop.openLogin(provider, mode);
    return;
  }
  window.location.href = `/oauth2/authorization/${provider}?mode=${mode}`;
}
