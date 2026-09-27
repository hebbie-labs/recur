import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import AddTaskForm from "@/components/organisms/task/AddTaskForm";
import type { Task } from "@/types/task";
import { useTasksContext } from "@/contexts/TasksContext";

/** Fields a caller (e.g. a calendar click) can pre-populate on the Add Task form. */
export type AddTaskPrefill = {
  startDate?: string;
  startTimeOfDay?: string;
  dateUntil?: string;
};

type AddTaskContextValue = {
  openAddTaskForm: (prefill?: AddTaskPrefill) => void;
};

const AddTaskContext = createContext<AddTaskContextValue | null>(null);

export function AddTaskProvider({ children }: { children: ReactNode }) {
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [prefill, setPrefill] = useState<AddTaskPrefill | null>(null);
  const { addTask } = useTasksContext();

  const openAddTaskForm = useCallback((newPrefill?: AddTaskPrefill) => {
    setPrefill(newPrefill ?? null);
    setShowAddTaskForm(true);
  }, []);

  function handleClose() {
    setShowAddTaskForm(false);
    setPrefill(null);
  }

  function handleTaskCreated(task: Task) {
    addTask(task);
  }

  return (
    <AddTaskContext.Provider value={{ openAddTaskForm }}>
      {children}
      {showAddTaskForm && (
        <AddTaskForm
          onClose={handleClose}
          onTaskCreated={handleTaskCreated}
          prefill={prefill ?? undefined}
        />
      )}
    </AddTaskContext.Provider>
  );
}

export function useAddTask() {
  const ctx = useContext(AddTaskContext);
  if (!ctx) {
    throw new Error("useAddTask muss innerhalb von AddTaskProvider verwendet werden");
  }
  return ctx;
}