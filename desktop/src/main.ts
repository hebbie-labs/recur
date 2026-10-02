import { app, BrowserWindow, shell, ipcMain, session } from "electron";
import path from "node:path";
import crypto from "node:crypto";

let pendingVerifier: string | null = null;

const DEV_URL = "http://localhost:3000";
const PROD_URL = "https://www.recur.dpdns.org";

const APP_URL = app.isPackaged ? PROD_URL : DEV_URL;
const APP_ORIGIN = new URL(APP_URL).origin;

if (app.isPackaged && new URL(APP_URL).protocol !== "https:") {
  throw new Error(
    `APP_URL must use the https: protocol in production, but is ${APP_URL}`
  );
}

function isInternal(url: string): boolean {
  try {
    return new URL(url).origin === APP_ORIGIN;
  } catch {
    return false;
  }
}

function openExternal(url: string): void {
  try {
    const { protocol } = new URL(url);
    if (protocol === "https:" || protocol === "mailto:") {
      shell.openExternal(url);
    }
  } catch {
    return;
  }
}

ipcMain.on("auth:open-login", (event, provider: string, mode: string) => {
  const senderUrl = event.senderFrame?.url;
  if (!senderUrl || !isInternal(senderUrl)) return;
  if (provider !== "google" && provider !== "github") return;

  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  pendingVerifier = verifier;

  const safeMode = mode === "register" ? "register" : "login";
  const loginUrl = `${APP_URL}/oauth2/authorization/${provider}?mode=${safeMode}&challenge=${challenge}`;
  shell.openExternal(loginUrl);
});

let win: BrowserWindow | null = null;

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("recur", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("recur");
}

async function handleDeepLink(rawUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return;
  }
  if (url.protocol !== "recur:") {
    return;
  }
  if (url.hostname !== "auth") {
    return;
  }

  const verifier = pendingVerifier;
  if (!verifier) return;
  pendingVerifier = null;

  const code = url.searchParams.get("code");
  if (!code) {
    return;
  }
  try {
    const res = await session.defaultSession.fetch(
      `${APP_URL}/api/auth/oauth2/desktop/exchange`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, verifier }),
        credentials: "include",
      }
    );
    if (!res.ok) {
      console.error("Desktop login failed:", res.status);
      return;
    }

    win?.loadURL(APP_URL);
  } catch (err) {
    console.error("Error during desktop login:", err);
  }
}

function findDeepLink(argv: string[]): string | undefined {
  const deepLinkArg = argv.find((arg) => arg.startsWith("recur://"));
  return deepLinkArg;
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 1200,
    minWidth: 400,
    height: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!isInternal(url)) openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event) => {
    if (!isInternal(event.url)) {
      event.preventDefault();
      openExternal(event.url);
    }
  });
  win.webContents.on("will-redirect", (event) => {
    if (!isInternal(event.url)) {
      event.preventDefault();
      openExternal(event.url);
    }
  });

  win.loadURL(APP_URL);
  win.on("closed", () => app.quit());
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
    const link = findDeepLink(argv);
    if (link) handleDeepLink(link);
  });

  app.whenReady().then(() => {
    createWindow();
    const link = findDeepLink(process.argv);
    if (link) handleDeepLink(link);
  });
}
