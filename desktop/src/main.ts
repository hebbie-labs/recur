import { app, BrowserWindow } from "electron";
import path from "node:path";

const APP_URL = process.env.RECUR_URL ?? "http://localhost:3000";
const APP_ORIGIN = new URL(APP_URL).origin;

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
      require("electron").shell.openExternal(url);
    }
  } catch {
    console.error("Error opening external URL:", url);
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
