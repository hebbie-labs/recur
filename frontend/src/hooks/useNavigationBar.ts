import { useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export type NavigationDestination = {
  path: string;
  navigate: () => void;
  label: string;
  icon: LucideIcon;
};

export function useNavigationBar(destinations: NavigationDestination[]) {
  const pathname = usePathname();

  // Aktiven Tab aus der aktuellen URL ableiten, statt beim Mount aktiv zu
  // destinations[0] umzuleiten. So bleibt z.B. ein Direktaufruf von /archive
  // (Reload, Lesezeichen, geteilter Link) erhalten, und der Tab zeigt auch
  // nach einem Reload den korrekten aktiven Zustand.
  // Kein Fallback auf destinations[0]: auf Routen ohne Match (z.B.
  // /settings) soll kein Eintrag aktiv wirken.
  const activeValue = useMemo(() => {
    const match = destinations.find((d) => d.path === pathname);
    return match?.path ?? "";
  }, [destinations, pathname]);

  const handleNavigation = useCallback(
    (path: string) => {
      destinations.find((d) => d.path === path)?.navigate();
    },
    [destinations],
  );

  return { activeValue, handleNavigation };
}