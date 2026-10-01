import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("recurDesktop", {
  isDesktop: true,
});
