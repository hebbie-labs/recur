import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("recurDesktop", {
  isDesktop: true,
  openLogin: (provider: string, mode: string) =>
    ipcRenderer.send("auth:open-login", provider, mode),
});
