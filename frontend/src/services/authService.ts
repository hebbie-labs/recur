import api from "./api";
import {
  type UserResponse,
  type AuthResponse,
  type MessageResponse,
  type RegisterRequest,
  type LoginRequest,
  type ResendVerificationRequest,
  type ForgotPasswordRequest,
  type ResetPasswordRequest,
} from "../types/auth";

export async function register(
  request: RegisterRequest
): Promise<AuthResponse> {
  return await api
    .post("/auth/register", request)
    .then((response) => response.data as AuthResponse)
    .catch((error) => {
      throw new Error(error?.response?.data?.message ?? "Registrierung fehlgeschlagen");
    });
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
  return await api
    .post("/auth/login", request)
    .then((response) => response.data as AuthResponse)
    .catch((error) => {
      throw new Error(error?.response?.data?.message ?? "Anmeldung fehlgeschlagen");
    });
}

export async function resendVerification(
  request: ResendVerificationRequest
): Promise<MessageResponse> {
  return await api
    .post("/auth/resend-verification", request)
    .then((response) => response.data as MessageResponse)
    .catch((error) => {
      throw new Error(
        error?.response?.data?.message ?? "Bestätigungs-E-Mail konnte nicht erneut gesendet werden"
      );
    });
}

export async function forgotPassword(
  request: ForgotPasswordRequest
): Promise<MessageResponse> {
  return await api
    .post("/auth/forgot-password", request)
    .then((response) => response.data as MessageResponse)
    .catch((error) => {
      throw new Error(
        error?.response?.data?.message ?? "Anfrage konnte nicht gesendet werden"
      );
    });
}

export async function resetPassword(
  request: ResetPasswordRequest
): Promise<MessageResponse> {
  return await api
    .post("/auth/reset-password", request)
    .then((response) => response.data as MessageResponse)
    .catch((error) => {
      throw new Error(
        error?.response?.data?.message ?? "Passwort konnte nicht zurückgesetzt werden"
      );
    });
}

/** Tauscht das kurzlebige HttpOnly-Handoff-Cookie (gesetzt vom OAuth2-Redirect) gegen den echten Access-Token ein, den der Server als HttpOnly-Cookie setzt (#160), statt ihn aus der Redirect-URL zu lesen; `withCredentials`, damit das Handoff-Cookie cross-origin mitgeschickt wird. */
export async function exchangeOAuth2Token(): Promise<AuthResponse> {
  return await api
    .get("/auth/oauth2/token", { withCredentials: true })
    .then((response) => response.data as AuthResponse)
    .catch((error) => {
      throw new Error(
        error?.response?.data?.message ?? "Google-Login fehlgeschlagen"
      );
    });
}

/** Tauscht das HttpOnly refresh_token-Cookie gegen einen frischen Access-Token ein und rotiert das Cookie mit (Server setzt ein neues via Set-Cookie). */
export async function refreshAccessToken(): Promise<AuthResponse> {
  return await api
    .post("/auth/refresh", {})
    .then((response) => response.data as AuthResponse);
}

/** Best-effort: revoked die Server-Session zum aktuellen refresh_token-Cookie und löscht dabei serverseitig auch das access_token-Cookie (#160); schlägt nie sichtbar fehl - ein bereits abgelaufenes/fehlendes Cookie ist kein Fehlerfall. */
export async function revokeRefreshToken(): Promise<void> {
  await api.post("/auth/logout", {}).catch(() => undefined);
}

export async function getCurrentUser(): Promise<UserResponse> {
  return await api
    .get("/auth/me")
    .then((response) => response.data as UserResponse)
    .catch((error) => {
      throw new Error(
        error?.response?.data?.message ?? "Fehler beim Laden der Benutzerdaten"
      );
    });
}

export function logout(): void {
  window.location.href = "/logout";
}

export function patchUser(user: Partial<UserResponse>): Promise<UserResponse> {
  return api
    .patch("/auth/me", user)
    .then((response) => response.data as UserResponse)
    .catch((error) => {
      throw new Error(
        error?.response?.data?.message ?? "Fehler beim Aktualisieren des Benutzers"
      );
    });
}

export function deleteCurrentUser(): Promise<void> {
  return api
    .delete("/auth/me")
    .then(() => undefined)
    .catch((error) => {
      throw new Error(
        error?.response?.data?.message ?? "Fehler beim Löschen des Kontos"
      );
    });
}

/** A 401 from any endpoint other than login/register means our token is missing, expired, or invalid - send the user through /logout (same transitional-page pattern as OAuthCallbackPage) instead of leaving the app half-authenticated with no explanation (#145). */
const AUTH_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/me"];

// Endpunkte, für die ein 401 nie einen Silent-Refresh auslösen soll -
// login/register haben naturgemäss noch keinen Access-Token, refresh/logout
// dürfen sich nicht selbst retriggern (Endlosschleife).
const REFRESH_EXEMPT_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

let sessionExpiredHandled = false;
let refreshPromise: Promise<AuthResponse> | null = null;
let csrfRefreshPromise: Promise<unknown> | null = null;
// War /auth/me (der Auth-Bootstrap-Check beim App-Start) der Auslöser des
// laufenden Refresh-Versuchs? Schlägt der Refresh dann auch fehl, heisst das
// nur "nie eingeloggt gewesen" (kein Cookie), keine echte Session, die
// "abgelaufen" sein könnte - ProtectedRoute schickt in dem Fall ohnehin
// schon still nach /login. Ohne dieses Flag griff unten fälschlich die
// "Sitzung abgelaufen"-Meldung, weil der 401 des verschachtelten
// /auth/refresh-Requests (nicht in AUTH_ENDPOINTS) die Prüfung durchlief.
let refreshTriggeredByMeCheck = false;

// GET-Requests sind von Springs CSRF-Prüfung ausgenommen - ein 403 auf einer
// dieser Methoden kann also nur ein abgelehntes Double-Submit-Token sein, nie
// eine echte 403-Geschäftslogik-Antwort.
const CSRF_PROTECTED_METHODS = ["post", "put", "patch", "delete"];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url: string | undefined = error?.config?.url;
    const method: string | undefined = error?.config?.method;
    const originalRequest = error?.config;
    const isAuthEndpoint = url
      ? AUTH_ENDPOINTS.some((path) => url.includes(path))
      : false;
    const isRefreshExempt = url
      ? REFRESH_EXEMPT_ENDPOINTS.some((path) => url.includes(path))
      : true;

    // Abgelaufener Access-Token: einmal versuchen, ihn über das
    // HttpOnly refresh_token-Cookie zu erneuern und den Original-Request
    // zu wiederholen, statt sofort auszuloggen (#159). Der neue Access-Token
    // landet als HttpOnly-Cookie (#160) und wird vom Browser automatisch
    // mitgeschickt - hier muss nichts mehr manuell an den Request gehängt
    // werden. Mehrere gleichzeitige 401s teilen sich denselben Refresh-Aufruf
    // (refreshPromise).
    if (status === 401 && !isRefreshExempt && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshTriggeredByMeCheck = url ? url.includes("/auth/me") : false;
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        return api(originalRequest);
      } catch {
        // Refresh fehlgeschlagen (Cookie fehlt/abgelaufen/reused) -> Session
        // ist endgültig weg, fällt durch zur normalen 401-Behandlung unten.
      }
    }

    // Sicherheitsnetz für Springs CSRF-Double-Submit-Check (#160 hat CSRF
    // eingeführt): api.ts liest den XSRF-TOKEN-Cookie zwar live bei jedem
    // Request (kein Caching, siehe api.ts), aber falls im Browser noch gar
    // kein Cookie existiert (z.B. allererster mutierender Request der
    // Session), gibt es nichts zu lesen. Ein frisches GET stellt eins aus,
    // bevor der Original-Request einmal wiederholt wird - der dann live das
    // frisch gesetzte Cookie aufgreift.
    if (
      status === 403 &&
      method &&
      CSRF_PROTECTED_METHODS.includes(method) &&
      !isRefreshExempt &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        if (!csrfRefreshPromise) {
          csrfRefreshPromise = api.get("/auth/me").finally(() => {
            csrfRefreshPromise = null;
          });
        }
        await csrfRefreshPromise;
        return api(originalRequest);
      } catch {
        // Cookie liess sich nicht auffrischen -> fällt durch zur normalen
        // Fehlerbehandlung, der Original-Fehler wird unten weitergereicht.
      }
    }

    // Der 401 des verschachtelten /auth/refresh-Requests selbst landet auch
    // hier (nicht in AUTH_ENDPOINTS) - war der Auslöser dafür der
    // /auth/me-Bootstrap-Check, ist das kein "Sitzung abgelaufen"-Fall,
    // sondern schlicht "nie eingeloggt gewesen" (siehe refreshTriggeredByMeCheck).
    const isBootstrapRefreshFailure =
      url?.includes("/auth/refresh") && refreshTriggeredByMeCheck;

    if (
      status === 401 &&
      !isAuthEndpoint &&
      !isBootstrapRefreshFailure &&
      !sessionExpiredHandled
    ) {
      sessionExpiredHandled = true;
      if (!["/login", "/logout"].includes(window.location.pathname)) {
        window.location.href = "/logout?reason=expired";
      }
    }

    return Promise.reject(error);
  }
);
