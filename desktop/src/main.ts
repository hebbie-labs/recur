import { app, BrowserWindow } from "electron";
import path from "node:path";
import { contextBridge, ipcRenderer } from "electron";

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

  win.loadURL(process.env.RECUR_URL ?? "http://localhost:3000");

  win.on("closed", () => {
    app.quit();
  });
});
