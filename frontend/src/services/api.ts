import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 5000,
  withCredentials: true, // sendet HttpOnly access_token-/refresh_token-Cookies mit (#159, #160)
  // Liest den XSRF-TOKEN-Cookie live bei jedem Request und setzt ihn als
  // X-XSRF-TOKEN-Header (Frontend/Backend liegen auf verschiedenen Subdomains,
  // Axios macht das sonst nur same-origin, #160). Bewusst KEIN Caching des
  // Werts in einer JS-Variable (siehe git-history #177 für den Versuch): das
  // Frontend feuert mehrere Requests parallel (App-Boot + Hintergrund-Poll),
  // die alle das CSRF-Cookie neu ausstellen können, wenn noch keins da ist -
  // ein gecachter Wert lief dabei leicht dem Cookie hinterher, das der
  // Browser tatsächlich sendet, und ergab einen 403-Double-Submit-Mismatch,
  // den kein Retry beheben konnte. Ein Live-Read direkt vor dem Senden nimmt
  // denselben, in diesem Moment bereits stabilen Cookie-Wert, den der Browser
  // für denselben Request ohnehin mitschickt.
  withXSRFToken: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Ein 401 heisst hier immer "nicht (mehr) authentifiziert" - der axios-Interceptor oben behandelt bereits die globale Konsequenz (Redirect/Silent-Logout), ein Caller sollte dafür nie einen eigenen Error-Screen zeigen. */
export function isUnauthorized(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

export default api;
