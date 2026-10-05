import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import "@/globals.css";
import DesktopTitleBar from "@/components/molecules/DesktopTitleBar";
import Providers from "./providers";

// Self-hosted and preloaded via Next's own font pipeline instead of the
// @fontsource-variable/geist CSS import - same variable font, one less
// render-blocking stylesheet request.
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Recur",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Recur",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  viewportFit: "cover",
};

// Runs before React hydrates, so the "dark" class on <html> is already
// correct for the very first paint - without this, useDarkMode's initial
// state can only be set after mount, causing a flash of the wrong theme.
// suppressHydrationWarning on <html> below is the documented pairing for
// this pattern: React's server-rendered markup never had this class, so it
// would otherwise warn about a mismatch that this script causes on purpose.
//
// Setzt außerdem data-desktop, wenn die Seite in einer Desktop-App mit eigener
// Titelleiste läuft (window.recurDesktop kommt aus dem Preload und ist vor
// jedem Seiten-Skript da; setTitleBarTheme gibt es erst in Versionen mit
// titleBarOverlay, eine ältere App hat noch die native Leiste und bekäme sonst
// zwei): Die CSS-Regeln für die eigene Titelleiste hängen daran und greifen so
// schon im ersten Frame. Im Browser bleibt das Attribut weg.
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}try{if(window.recurDesktop&&window.recurDesktop.setTitleBarTheme){document.documentElement.setAttribute("data-desktop","");}}catch(e){}})();`;

function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={geistSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <DesktopTitleBar />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export default RootLayout;
