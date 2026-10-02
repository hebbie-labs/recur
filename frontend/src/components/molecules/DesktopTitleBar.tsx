"use client";

import { useEffect } from "react";
import Image from "next/image";

// Titelleiste der Desktop-App (Electron mit titleBarOverlay): Windows zeichnet
// nur noch die Fenster-Buttons rechts, den Rest der Leiste zeigt die Seite
// selbst. Im Browser bleibt sie über CSS unsichtbar - sichtbar und eingerechnet
// wird sie nur unter html[data-desktop], siehe globals.css und das
// THEME_INIT_SCRIPT in app/layout.tsx.
function DesktopTitleBar() {
  // Die Fenster-Buttons werden vom Main-Prozess gefärbt und kennen das Theme
  // der Seite nicht. useDarkMode und das Init-Skript schalten es über die
  // "dark"-Klasse auf <html> - die beobachten wir, statt jeden Umschalter
  // einzeln zu verdrahten.
  useEffect(() => {
    const desktop = window.recurDesktop;
    if (!desktop?.setTitleBarTheme) return;

    const root = document.documentElement;
    const sync = () =>
      desktop.setTitleBarTheme?.(
        root.classList.contains("dark") ? "dark" : "light",
      );

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div aria-hidden="true" className="desktop-titlebar">
      <Image src="/icons/icon-192.png" width={16} height={16} alt="" />
      <span>Recur</span>
    </div>
  );
}

export default DesktopTitleBar;
