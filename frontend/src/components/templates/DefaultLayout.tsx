import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { History, Home, Heart, Archive, Calendar, Users } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { AddTaskProvider } from "@/contexts/AddTaskContext";
import { ImportQuartalsplanProvider } from "@/contexts/ImportQuartalsplanContext";
import Fab from "@/components/atoms/FloatingActionButton";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useNavigationBar } from "@/hooks/useNavigationBar";
import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import AppSidebar from "../organisms/sidebar/AppSidebar";
import BottomNavigation from "../organisms/BottomNavigation";
import AppBar from "../molecules/AppBar";

// Bottom-Nav sitzt fixed über bottom-[calc(env(safe-area-inset-bottom)+1rem)]
// mit ~3.5rem Eigenhöhe - der Toaster braucht auf Mobile genug Abstand
// darüber, damit nichts überlappt.
const MOBILE_BOTTOM_CLEARANCE = "calc(env(safe-area-inset-bottom) + 6rem)";

type DefaultLayoutProps = {
  children: ReactNode;
  pageTitle?: string;
};

// Desktop-Sidebar: alle 5 Ziele, unverändert.
const NAV_ROUTES = [
  { path: "/", label: "Neuste", icon: History },
  { path: "/favorites", label: "Favoriten", icon: Heart },
  { path: "/archive", label: "Archiv", icon: Archive },
  { path: "/calendar", label: "Kalender", icon: Calendar },
  { path: "/groups", label: "Gruppen", icon: Users },
] as const;

// Mobile Bottom Nav: nur noch 3 Ziele - Favoriten/Archiv sind dort keine
// eigenen Tabs mehr, sondern Vorschau-Sektionen auf der Start-Seite
// (HomePage.tsx). "/" heisst hier "Start" statt "Neuste", weil die Seite
// jetzt mehr als nur die neusten Aufgaben zeigt.
const MOBILE_NAV_ROUTES = [
  { path: "/", label: "Start", icon: Home },
  { path: "/calendar", label: "Kalender", icon: Calendar },
  { path: "/groups", label: "Gruppen", icon: Users },
] as const;

// "Task hinzufügen" ergibt nur hier Sinn - andere Routen haben ihren eigenen
// Add-Flow (Kalender: Klick auf Slot, Gruppen/Projekte: eigener Header-Button).
const FAB_ROUTES = new Set(["/", "/favorites"]);

function DefaultLayout({ children, pageTitle }: DefaultLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useBreakpoint() === "mobile";

  const destinations = NAV_ROUTES.map(({ path, label, icon: Icon }) => ({
    path,
    navigate: () => router.push(path),
    label,
    icon: Icon,
  }));

  const mobileDestinations = MOBILE_NAV_ROUTES.map(({ path, label, icon: Icon }) => ({
    path,
    navigate: () => router.push(path),
    label,
    icon: Icon,
  }));

  // isPrimaryRoute (Avatar vs. Zurück-Chevron in der AppBar) richtet sich auf
  // Mobile nach den 3 Bottom-Nav-Zielen, nicht nach allen 5 Desktop-Routen -
  // /favorites und /archive sind dort keine primären Ziele mehr.
  const { activeValue } = useNavigationBar(mobileDestinations);

  return (
    <AddTaskProvider>
      <ImportQuartalsplanProvider>
        <SidebarProvider>
          {!isMobile && <AppSidebar destinations={destinations} />}

          <SidebarInset>
            <AppBar
              title={pageTitle}
              isPrimaryRoute={activeValue !== ""}
              showAddTaskButton={FAB_ROUTES.has(pathname)}
            />

            <div
              className={cn(
                "flex mx-auto w-full max-w-6xl px-4 py-6",
                isMobile ? "pb-32" : "pb-24"
              )}
            >
              <main className="w-full">{children}</main>
            </div>

            <Toaster
              position="bottom-left"
              offset={isMobile ? { bottom: MOBILE_BOTTOM_CLEARANCE } : undefined}
              mobileOffset={isMobile ? { bottom: MOBILE_BOTTOM_CLEARANCE } : undefined}
            />
            {/* Mobile: der "+"-Button sitzt jetzt in der AppBar statt hier (#208) - Desktop unverändert. */}
            {!isMobile && FAB_ROUTES.has(pathname) && (
              <Fab className="fixed right-4 bottom-4" />
            )}

            {isMobile && (
              <BottomNavigation destinations={mobileDestinations} activeValue={activeValue} />
            )}
          </SidebarInset>
        </SidebarProvider>
      </ImportQuartalsplanProvider>
    </AddTaskProvider>
  );
}

export default DefaultLayout;
