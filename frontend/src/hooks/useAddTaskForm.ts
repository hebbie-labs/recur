import { useEffect, useRef, useState } from "react";
import {
  createTask,
  TaskCategory,
  TaskFrequency,
  type NewTask,
  type Task,
} from "@/services/taskService";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import type { FormValues } from "@/components/organisms/Form";
import {
  resolveDateUntil,
  resolveDescription,
  resolveStartTime,
} from "@/utils/taskFormDefaults";

type UseAddTaskFormParams = {
  onClose: () => void;
  onTaskCreated?: (task: Task) => void;
};

function useAddTaskForm({ onClose, onTaskCreated }: UseAddTaskFormParams) {
  const [loading, setLoading] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Explizit auf true setzen statt uns nur auf den useRef-Initialwert zu
    // verlassen: In React 18 Strict Mode (Dev) wird dieser Effect einmal
    // gemountet, sofort gecleant und dann erneut gemountet. Ohne dieses
    // Zurücksetzen bleibt isMountedRef nach dem Doppel-Invoke dauerhaft
    // "false", obwohl die Komponente aktiv ist - der Dialog würde dann nie
    // aus dem Loading-State herauskommen.
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSubmit = async (values: FormValues): Promise<boolean> => {
    setLoading(true);
    setSubmitDisabled(true);

    const payload: NewTask = {
      name: values.name,
      description: resolveDescription(values.description),
      category: (values.category || TaskCategory.OTHER) as TaskCategory,
      frequency: (values.frequency || TaskFrequency.ONCE) as TaskFrequency,
      dateUntil: resolveDateUntil(values.dateUntil, values.startDate),
      progress: 0,
      durationMinutes:
        values.durationMinutes !== null ? Number(values.durationMinutes) : null,
      startTime: resolveStartTime(
        values.startDate,
        values.startTimeOfDay,
        values.frequency
      ),
      projectId: values.projectId || null,
    };

    try {
      const createdTask = await createTask(payload);
      showSuccessToast("Aufgabe erfolgreich erstellt.");
      onTaskCreated?.(createdTask);

      setTimeout(() => {
        if (!isMountedRef.current) return;
        setLoading(false);
        onClose();
      }, 1500);

      return true;
    } catch (err) {
      showErrorToast(
        err instanceof Error
          ? err.message
          : "Fehler beim Erstellen der Aufgabe."
      );
      if (isMountedRef.current) {
        setLoading(false);
        setSubmitDisabled(false);
      }

      return false;
    }
  };

  return { loading, submitDisabled, handleSubmit };
}

export default useAddTaskForm;
