import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { NavigationDestination } from "@/hooks/useNavigationBar";

export type SidebarNavGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  destinations: NavigationDestination[];
};

const STORAGE_KEY = "recur.sidebar.openNavGroup";

function writeStoredGroup(key: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // localStorage kann z.B. im privaten Modus blockiert sein - dann bleibt der
    // Zustand einfach unpersistiert, kein Grund die Navigation abzubrechen.
  }
}

export function useSidebarNavGroups(
  groups: SidebarNavGroup[],
  activeValue: string,
) {
  const activeGroupKey = useMemo(
    () =>
      groups.find((group) =>
        group.destinations.some((d) => d.path === activeValue),
      )?.key ?? groups[0]?.key ?? "",
    [groups, activeValue],
  );

  // Die Gruppe der aktiven Route hat immer Vorrang vor einer gespeicherten
  // Präferenz, damit ein Direktlink/Reload nie in einer zugeklappten Gruppe
  // "versteckt" bleibt. State-Anpassung passiert synchron während des Renders
  // (React-Pattern für "reset state on prop change"), nicht in einem Effect.
  const [trackedActiveGroupKey, setTrackedActiveGroupKey] =
    useState(activeGroupKey);
  const [openGroupKey, setOpenGroupKey] = useState(activeGroupKey);

  if (activeGroupKey !== trackedActiveGroupKey) {
    setTrackedActiveGroupKey(activeGroupKey);
    setOpenGroupKey(activeGroupKey);
  }

  useEffect(() => {
    if (openGroupKey) writeStoredGroup(openGroupKey);
  }, [openGroupKey]);

  const openGroup = useCallback((key: string) => {
    setOpenGroupKey(key);
  }, []);

  return { openGroupKey, openGroup };
}
