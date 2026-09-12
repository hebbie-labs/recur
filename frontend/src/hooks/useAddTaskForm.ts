import { useEffect, useRef, useState } from "react";
import {
  createTask,
  TaskFrequency,
  TaskCategory,
  type NewTask,
  type Task,
} from "@/services/taskService";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import type { FormValues } from "@/components/organisms/Form";

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

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    setSubmitDisabled(true);

    const startTimeIso =
      values.startDate && values.startTimeOfDay
        ? new Date(`${values.startDate}T${values.startTimeOfDay}`).toISOString()
        : null;

    const payload: NewTask = {
      name: values.name,
      description: values.description,
      category: values.category as TaskCategory,
      frequency: values.frequency as TaskFrequency,
      dateUntil: values.dateUntil,
      progress: 0,
      durationMinutes:
        values.durationMinutes !== null ? Number(values.durationMinutes) : null,
      startTime: startTimeIso,
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
    }
  };

  return { loading, submitDisabled, handleSubmit };
}

export default useAddTaskForm;
