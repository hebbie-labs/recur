import api from "./api";
import {
  type UserResponse,
  type AuthResponse,
  type MessageResponse,
  type RegisterRequest,
  type LoginRequest,
  type ResendVerificationRequest,
} from "../types/auth";

export async function register(
  request: RegisterRequest
): Promise<MessageResponse> {
  return await api
    .post("/auth/register", request)
    .then((response) => response.data as MessageResponse)
    .catch((error) => {
      throw new Error(error?.response?.data?.message ?? "Registrierung fehlgeschlagen");
    });
}

/**
 * Wird geworfen, wenn das Backend einen Login mit 403 "Email not verified"
 * ablehnt - eigener Fehlertyp, damit useLoginForm diesen Fall vom generischen
 * "falsche Zugangsdaten" unterscheiden und die Resend-Option anzeigen kann.
 */
export class EmailNotVerifiedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailNotVerifiedError";
  }
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
  return await api
    .post("/auth/login", request)
    .then((response) => response.data as AuthResponse)
    .catch((error) => {
      const message = error?.response?.data?.message ?? "Anmeldung fehlgeschlagen";
      if (error?.response?.status === 403 && error?.response?.data?.error === "Email not verified") {
        throw new EmailNotVerifiedError(message);
      }
      throw new Error(message);
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

/**
 * Tauscht das kurzlebige HttpOnly-Handoff-Cookie (gesetzt vom OAuth2-Redirect)
 * gegen den echten Token im Response-Body ein, statt ihn aus der Redirect-URL
 * zu lesen. `withCredentials`, damit das Cookie cross-origin mitgeschickt wird.
 */
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

export function setToken(token: string): void {
  localStorage.setItem("authToken", token);
}

export function getToken(): string | null {
  return localStorage.getItem("authToken");
}

export function clearToken(): void {
  localStorage.removeItem("authToken");
}

export function isLoggedIn(): boolean {
  const token = getToken();
  try {
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp;
    const currentTime = Math.floor(Date.now() / 1000);
    return exp > currentTime;
  } catch (error) {
    console.error("Error checking login status:", error);
    return false;
  }
}

export function logout(): void {
  clearToken();
  window.location.href = "/login";
}

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

/**
 * A 401 from any endpoint other than login/register means our token is
 * missing, expired, or invalid. Clear it and send the user to /login
 * instead of leaving the app in a half-authenticated state.
 */
const AUTH_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/me"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string | undefined = error?.config?.url;
    const isAuthEndpoint = url
      ? AUTH_ENDPOINTS.some((path) => url.includes(path))
      : false;

    if (status === 401 && !isAuthEndpoint) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
