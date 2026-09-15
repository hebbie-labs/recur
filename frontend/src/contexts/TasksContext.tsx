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
import { deleteTask, getTasks, patchTask } from "@/services/taskService";
import type { Task } from "@/services/taskService";
import { showErrorToast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";

type TasksContextValue = {
  tasks: Task[];
  loading: boolean;
  favoriteTasks: Task[];
  archivedTasks: Task[];
  addTask: (newTask: Task) => void;
  handleToggleFavorite: (taskId: string) => Promise<void>;
  handleToggleArchive: (taskId: string) => Promise<void>;
  handleResetProgress: (taskId: string) => Promise<void>;
  handleDelete: (taskId: string) => Promise<void>;
  handleToggleDone: (taskId: string) => Promise<void>;
  handleUpdateTask: (updatedTask: Task) => void;
  fetchTasks: () => Promise<void>;
  /** Für den Auto-Sync-Poll: merged statt zu überschreiben, wirft bei Fehler statt showBoundary. */
  syncTasks: () => Promise<void>;
};

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { showBoundary } = useErrorBoundary();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

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
      showBoundary(err);
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

  const visibleTasks = useMemo(() => tasks.filter((t) => !t.isArchived), [tasks]);
  const favoriteTasks = useMemo(
    () => tasks.filter((t) => t.isFavorite && !t.isArchived),
    [tasks]
  );
  const archivedTasks = useMemo(() => tasks.filter((t) => t.isArchived), [tasks]);

  const handleToggleFavorite = useCallback(async (taskId: string) => {
    const task = tasksRef.current.find((t) => t.id === taskId);
    if (!task) return;
    const newFavorite = !task.isFavorite;

    const previousTasks = tasksRef.current;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isFavorite: newFavorite } : t))
    );

    await patchTask(taskId, { favorite: newFavorite }).catch((err) => {
      setTasks(previousTasks);
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Aktualisieren des Favoritenstatus");
    });
  }, []);

  const handleToggleArchive = useCallback(async (taskId: string) => {
    const task = tasksRef.current.find((t) => t.id === taskId);
    if (!task) return;
    const newArchived = !task.isArchived;

    const previousTasks = tasksRef.current;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isArchived: newArchived } : t))
    );

    await patchTask(taskId, { archived: newArchived }).catch((err) => {
      setTasks(previousTasks);
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Archivieren der Aufgabe");
    });
  }, []);

  const handleResetProgress = useCallback(async (taskId: string) => {
    const previousTasks = tasksRef.current;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, amountDid: 0, progress: 0 } : task
      )
    );

    await patchTask(taskId, { resetProgress: true, amountDid: 0 }).catch((err) => {
      setTasks(previousTasks);
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Zurücksetzen des Fortschritts");
    });
  }, []);

  const handleDelete = useCallback(async (taskId: string) => {
    const previousTasks = tasksRef.current;
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    await deleteTask(taskId).catch((err) => {
      setTasks(previousTasks);
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Löschen der Aufgabe");
    });
  }, []);

  const handleToggleDone = useCallback(async (taskId: string) => {
    const targetTask = tasksRef.current.find((task) => task.id === taskId);
    if (!targetTask) return;

    const newAmountDid = (targetTask.amountDid ?? 0) + 1;
    const previousTasks = tasksRef.current;

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, amountDid: newAmountDid } : task))
    );

    await patchTask(taskId, { amountDid: newAmountDid })
      .then((updatedTask) => {
        setTasks((prev) => prev.map((task) => (task.id === taskId ? updatedTask : task)));
      })
      .catch((err) => {
        setTasks(previousTasks);
        showErrorToast(err instanceof Error ? err.message : "Fehler beim Aktualisieren der erledigten Menge");
      });
  }, []);

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
    handleResetProgress,
    handleDelete,
    handleToggleDone,
    handleUpdateTask,
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