import { app, BrowserWindow } from "electron";

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1200,
    minWidth: 400,
    height: 800,
    minHeight: 600,
  });

  win.loadURL(process.env.RECUR_URL ?? "http://localhost:3000");

  win.on("closed", () => {
    app.quit();
  });
});
