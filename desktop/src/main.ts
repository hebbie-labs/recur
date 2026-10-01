import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

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
    // ungültige URL: ignorieren
  }
}

app.whenReady().then(() => {
  const win = new BrowserWindow({
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
});
