import { useEffect, useState } from "react";

// beforeinstallprompt ist (noch) kein Teil von lib.dom.d.ts.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectInstalled() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari kennt display-mode nicht, setzt aber navigator.standalone.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(detectInstalled);
  const [isIos] = useState(detectIos);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      // Sonst zeigt Chrome seinen eigenen Mini-Infobar statt unseres Buttons.
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    // Das Event ist nur einmal benutzbar, egal wie der Nutzer entscheidet.
    setDeferredPrompt(null);
  };

  return {
    canInstall: deferredPrompt !== null && !isInstalled,
    isInstalled,
    // Auf iOS gibt es kein beforeinstallprompt - nur die manuelle Anleitung.
    showIosHint: isIos && !isInstalled,
    promptInstall,
  };
}

export default useInstallPrompt;
