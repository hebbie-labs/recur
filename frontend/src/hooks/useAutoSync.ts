import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasksContext } from "@/contexts/TasksContext";
import { useGroupsContext } from "@/contexts/GroupsContext";
import { showSyncErrorToast, dismissSyncErrorToast } from "@/lib/toast";

const SYNC_INTERVAL_MS = 15_000;
const MAX_BACKOFF_MS = 60_000;
const FAILURES_BEFORE_WARNING = 3;

/** Pollt Tasks/Gruppen im Hintergrund, solange der User eingeloggt und in mindestens einer Gruppe ist (kein Bedarf für Solo-User ohne geteilte Tasks); pausiert bei unsichtbarem Tab und holt bei Rückkehr sofort einmal nach statt auf den nächsten Tick zu warten. */
export function useAutoSync() {
  const { isAuthenticated } = useAuth();
  const { syncTasks } = useTasksContext();
  const { groups, syncGroups } = useGroupsContext();
  const hasGroups = groups.length > 0;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);
  const failureCountRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated || !hasGroups) {
      failureCountRef.current = 0;
      dismissSyncErrorToast();
      return;
    }

    let stopped = false;

    const scheduleNext = (delay: number) => {
      if (stopped) return;
      timeoutRef.current = setTimeout(runSync, delay);
    };

    const runSync = async () => {
      if (document.hidden || isSyncingRef.current) return;
      isSyncingRef.current = true;
      try {
        await Promise.all([syncTasks(), syncGroups()]);
        failureCountRef.current = 0;
        dismissSyncErrorToast();
        scheduleNext(SYNC_INTERVAL_MS);
      } catch (err) {
        console.error("Auto-sync failed:", err);
        failureCountRef.current += 1;
        if (failureCountRef.current >= FAILURES_BEFORE_WARNING) {
          showSyncErrorToast("Sync unterbrochen – wird automatisch weiter versucht.");
        }
        const backoff = Math.min(
          SYNC_INTERVAL_MS * 2 ** (failureCountRef.current - 1),
          MAX_BACKOFF_MS
        );
        scheduleNext(backoff);
      } finally {
        isSyncingRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        runSync();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    runSync();

    return () => {
      stopped = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, hasGroups, syncTasks, syncGroups]);
}
