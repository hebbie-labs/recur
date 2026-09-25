import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useErrorBoundary } from "react-error-boundary";
import {
  addTaskCompletion,
  assignSelf,
  deleteTask,
  getTasks,
  patchTask,
  removeTaskCompletion,
  unassignSelf,
} from "@/services/taskService";
import { isUnauthorized } from "@/services/api";
import type { Task } from "@/types/task";
import { showErrorToast, showSuccessToast, showUndoToast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { currentPeriodCompletion, today } from "@/utils/taskCompletions";

type TasksContextValue = {
  tasks: Task[];
  loading: boolean;
  favoriteTasks: Task[];
  archivedTasks: Task[];
  addTask: (newTask: Task) => void;
  handleToggleFavorite: (taskId: string) => Promise<void>;
  handleToggleArchive: (taskId: string) => Promise<void>;
  handleToggleAssign: (taskId: string) => Promise<void>;
  handleResetProgress: (taskId: string) => Promise<void>;
  /** silent: Erfolgs-Toast unterdrücken, z.B. beim Bulk-Löschen mit eigenem Sammel-Toast. */
  handleDelete: (taskId: string, silent?: boolean) => Promise<void>;
  handleToggleDone: (taskId: string) => Promise<void>;
  /** Nachträgliches Abhaken eines vergangenen Frequenz-Intervalls (#152), z.B. aus der Verlaufs-Liste in TaskDetailDialog. */
  handleAddCompletion: (taskId: string, date: string) => Promise<void>;
  /** Rückgängigmachen eines einzelnen Häkchens (#152), ohne den restlichen Fortschritt zurückzusetzen. */
  handleRemoveCompletion: (taskId: string, date: string) => Promise<void>;
  handleUpdateTask: (updatedTask: Task) => void;
  /** Berücksichtigt bei geteilten Projekt-Tasks den individuellen Archiv-Status (task.archivedBy). */
  isArchivedForCurrentUser: (task: Task) => boolean;
  fetchTasks: () => Promise<void>;
  /** Für den Auto-Sync-Poll: merged statt zu überschreiben, wirft bei Fehler statt showBoundary. */
  syncTasks: () => Promise<void>;
};

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { showBoundary } = useErrorBoundary();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const tasksRef = useRef<Task[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedTasks = await getTasks();
      setTasks(fetchedTasks);
    } catch (err) {
      // Ein 401 heisst nur "nicht (mehr) authentifiziert" - z.B. eine
      // Logout-Race (Token wird zwischen Auth-Check und diesem Request
      // ungültig) - das behandelt der globale Auth-Flow bereits (Redirect/
      // AuthContext-State), kein Fall für den Error-Boundary-Crash.
      if (isUnauthorized(err)) {
        setTasks([]);
      } else {
        showBoundary(err);
      }
    } finally {
      setLoading(false);
    }
  }, [showBoundary]);

  // Last-Write-Wins-Merge für den Auto-Sync-Poll: ein vom Server geholter Task
  // ersetzt den lokalen Stand nur, wenn sein updatedAt neuer ist. So überschreibt
  // ein Poll kein laufendes optimistisches Update (z.B. "erledigt"-Toggle), dessen
  // PATCH-Response server-seitig noch nicht verarbeitet wurde. Tasks, die im
  // Poll-Ergebnis fehlen, wurden von jemand anderem gelöscht und fallen raus.
  const mergeTasks = useCallback((incoming: Task[]) => {
    setTasks((prev) => {
      const prevById = new Map(prev.map((t) => [t.id, t]));
      return incoming.map((next) => {
        const existing = prevById.get(next.id);
        if (!existing) return next;
        const existingTime = existing.updatedAt ? Date.parse(existing.updatedAt) : 0;
        const nextTime = next.updatedAt ? Date.parse(next.updatedAt) : 0;
        return nextTime > existingTime ? next : existing;
      });
    });
  }, []);

  const syncTasks = useCallback(async () => {
    const fetchedTasks = await getTasks();
    mergeTasks(fetchedTasks);
  }, [mergeTasks]);

  // Erst laden, sobald der AuthContext fertig gebootstrapped ist UND ein
  // gültiger User eingeloggt ist. Vorher/ohne Login gäbe es 401s, die den
  // ganzen Baum via showBoundary() crashen würden (z.B. auf /login selbst).
  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      // Intentional: reset local state in response to the AuthContext
      // singleton logging out, not derivable during render - there's no
      // per-user instance of this provider to key-remount instead.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTasks([]);
      setLoading(false);
      return;
    }

    fetchTasks();
  }, [isAuthenticated, isAuthLoading, fetchTasks]);

  const addTask = useCallback((newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
  }, []);

  // Bei geteilten Projekt-Tasks archiviert ein zugewiesenes Mitglied nur für
  // sich (task.archivedBy), ohne den Task global (task.isArchived) für die
  // anderen zu schliessen - siehe TaskService#applyArchivedChange im Backend.
  // Für die eigene Sicht (aktiv vs. archiviert) zählt daher beides.
  const isArchivedForCurrentUser = useCallback(
    (task: Task) => {
      if (task.isArchived) return true;
      if (!task.project || !user) return false;
      return task.archivedBy?.some((m) => m.id === user.id) ?? false;
    },
    [user]
  );

  const visibleTasks = useMemo(
    () => tasks.filter((t) => !isArchivedForCurrentUser(t)),
    [tasks, isArchivedForCurrentUser]
  );
  const favoriteTasks = useMemo(
    () => tasks.filter((t) => t.isFavorite && !isArchivedForCurrentUser(t)),
    [tasks, isArchivedForCurrentUser]
  );
  const archivedTasks = useMemo(
    () => tasks.filter((t) => isArchivedForCurrentUser(t)),
    [tasks, isArchivedForCurrentUser]
  );

  const handleToggleFavorite = useCallback(async (taskId: string) => {
    const task = tasksRef.current.find((t) => t.id === taskId);
    if (!task) return;
    const previousFavorite = task.isFavorite;
    const newFavorite = !previousFavorite;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isFavorite: newFavorite } : t))
    );

    // Nur das eigene Feld zurückrollen statt eines vollen Snapshots, damit
    // ein zweites, noch laufendes optimistisches Update auf demselben Task
    // (z.B. Archivieren) nicht durch diesen Rollback überschrieben wird.
    await patchTask(taskId, { favorite: newFavorite }).catch((err) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isFavorite: previousFavorite } : t))
      );
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Aktualisieren des Favoritenstatus");
    });
  }, []);

  // "archived" im Request ist die Absicht der aktuellen Person, nicht
  // zwingend der neue globale Zustand: bei einem geteilten Projekt-Task mit
  // mehreren zugewiesenen Mitgliedern entscheidet das Backend, ob daraus ein
  // globales isArchived wird (siehe TaskService#applyArchivedChange) - daher
  // wird hier nach dem Request der tatsächliche Server-Stand übernommen statt
  // blind der optimistische Wert.
  const handleToggleArchive = useCallback(
    async (taskId: string) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task) return;
      const wasArchivedForMe = isArchivedForCurrentUser(task);
      const newArchived = !wasArchivedForMe;
      const previousTask = task;

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isArchived: newArchived } : t))
      );

      await patchTask(taskId, { archived: newArchived })
        .then((updatedTask) => {
          setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
        })
        .catch((err) => {
          setTasks((prev) => prev.map((t) => (t.id === taskId ? previousTask : t)));
          showErrorToast(err instanceof Error ? err.message : "Fehler beim Archivieren der Aufgabe");
        });
    },
    [isArchivedForCurrentUser]
  );

  // Self-Service: nur bei geteilten Projekt-Tasks relevant. Kein optimistisches
  // Update (kein Vorher-Zustand pro Mitglied lokal verfügbar), stattdessen wird
  // die Server-Antwort direkt übernommen.
  const handleToggleAssign = useCallback(
    async (taskId: string) => {
      const task = tasksRef.current.find((t) => t.id === taskId);
      if (!task || !user) return;
      const isAssigned = task.assignedMembers?.some((m) => m.id === user.id) ?? false;

      try {
        const updatedTask = isAssigned ? await unassignSelf(taskId) : await assignSelf(taskId);
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      } catch (err) {
        showErrorToast(err instanceof Error ? err.message : "Fehler beim Zuweisen der Aufgabe");
      }
    },
    [user]
  );

  const handleResetProgress = useCallback(async (taskId: string) => {
    const task = tasksRef.current.find((t) => t.id === taskId);
    if (!task) return;
    const previousAmountDid = task.amountDid;
    const previousProgress = task.progress;
    const previousLastAmountDidAt = task.lastAmountDidAt;
    const previousCompletions = task.completions;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, amountDid: 0, progress: 0, lastAmountDidAt: null, completions: [] }
          : t
      )
    );

    await patchTask(taskId, { resetProgress: true }).catch((err) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                amountDid: previousAmountDid,
                progress: previousProgress,
                lastAmountDidAt: previousLastAmountDidAt,
                completions: previousCompletions,
              }
            : t
        )
      );
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Zurücksetzen des Fortschritts");
    });
  }, []);

  // Bei einem Gruppen-Task, den nicht ich erstellt habe, "löscht" der Server
  // ihn nur für mich (hiddenFor) und gibt den aktualisierten Task zurück -
  // dafür gibt es einen Undo-Toast statt der sonstigen Fehler-Rollback-
  // Logik. Beim endgültigen Löschen (eigener/persönlicher Task oder als
  // Ersteller) kommt kein Body zurück, dann nur der Erfolgs-Toast - erst
  // nach der Server-Antwort, damit er bei einem Fehler nicht trotzdem kommt.
  const handleDelete = useCallback(async (taskId: string, silent = false) => {
    const previousTasks = tasksRef.current;
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    await deleteTask(taskId)
      .then((hiddenTask) => {
        if (!hiddenTask) {
          if (!silent) showSuccessToast("Aufgabe erfolgreich gelöscht");
          return;
        }
        showUndoToast("Aufgabe für dich entfernt", () => {
          patchTask(taskId, { hidden: false })
            .then((restoredTask) => {
              setTasks((prev) => [...prev, restoredTask]);
            })
            .catch((err) => {
              showErrorToast(err instanceof Error ? err.message : "Fehler beim Wiederherstellen der Aufgabe");
            });
        });
      })
      .catch((err) => {
        setTasks(previousTasks);
        showErrorToast(err instanceof Error ? err.message : "Fehler beim Löschen der Aufgabe");
      });
  }, []);

  // Nachträgliches Abhaken/Rückgängig eines einzelnen Tages (#152), z.B. aus
  // der Verlaufs-Liste in TaskDetailDialog oder (mit date=heute) vom
  // primären Abhaken-Toggle unten. Kein optimistisches Update, da Konflikt-
  // /Datums-Validierung serverseitig passiert (siehe TaskService) und der
  // Server-Stand (neu abgeleitetes amountDid/progress) direkt übernommen wird.
  const handleAddCompletion = useCallback(async (taskId: string, date: string) => {
    try {
      const updatedTask = await addTaskCompletion(taskId, date);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Abhaken des Tages");
    }
  }, []);

  const handleRemoveCompletion = useCallback(async (taskId: string, date: string) => {
    try {
      const updatedTask = await removeTaskCompletion(taskId, date);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Rückgängigmachen des Tages");
    }
  }, []);

  // Der primäre Abhaken-Button ist ein Toggle (#152): ist das aktuelle
  // Frequenz-Intervall bereits erledigt, nimmt ein erneuter Klick genau
  // diese Completion wieder zurück, statt eine neue anzulegen. Geteilte
  // Projekt-Tasks liegen ausserhalb von #152 (siehe Backend) und behalten
  // ihre bisherige amountDid-Increment-Logik.
  const handleToggleDone = useCallback(
    async (taskId: string) => {
      const targetTask = tasksRef.current.find((task) => task.id === taskId);
      if (!targetTask) return;

      if (targetTask.project) {
        const newAmountDid = (targetTask.amountDid ?? 0) + 1;
        try {
          const updatedTask = await patchTask(taskId, { amountDid: newAmountDid });
          setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
        } catch (err) {
          showErrorToast(err instanceof Error ? err.message : "Fehler beim Aktualisieren der erledigten Menge");
        }
        return;
      }

      const existingCompletionDate = currentPeriodCompletion(targetTask);
      if (existingCompletionDate) {
        await handleRemoveCompletion(taskId, existingCompletionDate);
      } else {
        await handleAddCompletion(taskId, today());
      }
    },
    [handleAddCompletion, handleRemoveCompletion]
  );

  const handleUpdateTask = useCallback((updatedTask: Task) => {
    setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
  }, []);

  const value: TasksContextValue = {
    tasks: visibleTasks,
    loading,
    favoriteTasks,
    archivedTasks,
    addTask,
    handleToggleFavorite,
    handleToggleArchive,
    handleToggleAssign,
    handleResetProgress,
    handleDelete,
    handleToggleDone,
    handleAddCompletion,
    handleRemoveCompletion,
    handleUpdateTask,
    isArchivedForCurrentUser,
    fetchTasks,
    syncTasks,
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasksContext() {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error("useTasksContext muss innerhalb von TasksProvider verwendet werden");
  }
  return ctx;
}