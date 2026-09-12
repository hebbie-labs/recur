import { useCallback, useEffect, useRef, useState } from "react";
import { patchTask } from "@/services/taskService";
import type { Task } from "@/services/taskService";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "@/lib/toast";

export type EditableTaskFields = Pick<
  Task,
  "name" | "description" | "category" | "frequency" | "progress" | "dateUntil"
> & {
  durationMinutes: number | null;
  startDate: string;
  startTimeOfDay: string;
  projectId: string;
};

function valuesChanged(values: EditableTaskFields, original: Task): boolean {
  const normStr = (str?: string | null) => str ?? "";
  const normDuration = (value?: number | null) => value ?? null;

  const origDate = original.dateUntil ? original.dateUntil.slice(0, 10) : "";
  const valDate = values.dateUntil ? values.dateUntil.slice(0, 10) : "";

  const origStartDate = original.startTime
    ? original.startTime.slice(0, 10)
    : "";
  const valStartDate = values.startDate ? values.startDate.slice(0, 10) : "";

  const origStartTime = original.startTime
    ? new Date(original.startTime).toISOString()
    : "";
  const valStartTime =
    values.startDate && values.startTimeOfDay
      ? new Date(`${values.startDate}T${values.startTimeOfDay}`).toISOString()
      : "";

  return !(
    normStr(values.name) === normStr(original.name) &&
    normStr(values.description) === normStr(original.description) &&
    normStr(values.category) === normStr(original.category) &&
    normStr(values.frequency) === normStr(original.frequency) &&
    values.progress === original.progress &&
    normDuration(values.durationMinutes) ===
      normDuration(original.durationMinutes) &&
    valDate === origDate &&
    valStartDate === origStartDate &&
    valStartTime === origStartTime &&
    normStr(values.projectId) === normStr(original.project?.id)
  );
}

type UseEditTaskFormParams = {
  task: Task;
  onClose: () => void;
  onTaskUpdated?: (task: Task) => void;
};

function useEditTaskForm({
  task,
  onClose,
  onTaskUpdated,
}: UseEditTaskFormParams) {
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback(
    async (values: EditableTaskFields) => {
      if (!valuesChanged(values, task)) {
        showWarningToast("Keine Änderungen vorgenommen");
        return;
      }

      setLoading(true);

      const startTimeIso =
        values.startDate && values.startTimeOfDay
          ? new Date(`${values.startDate}T${values.startTimeOfDay}`).toISOString()
          : null;

      const { startDate, startTimeOfDay, projectId, ...restValues } = values;

      const payload = {
        ...restValues,
        startTime: startTimeIso,
        projectId: projectId || null,
      };

      const projectUnchanged = projectId === (task.project?.id ?? "");

      try {
        const updatedTask = await patchTask(task.id, {
          task: payload,
          // Nur explizit zurücksetzen, wenn projectId wirklich auf "persönlich"
          // geändert wurde - sonst würde ein unverändertes "" fälschlich ein
          // bereits zugeordnetes Projekt entfernen.
          unassignProject: !projectUnchanged && !projectId ? true : undefined,
        });
        showSuccessToast("Aufgabe erfolgreich aktualisiert");
        onTaskUpdated?.(updatedTask);

        timeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          setLoading(false);
          onClose();
        }, 1500);
      } catch (err) {
        showErrorToast(
          err instanceof Error
            ? err.message
            : "Fehler beim Aktualisieren der Aufgabe"
        );
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [task, onClose, onTaskUpdated]
  );

  return { loading, handleSubmit };
}

export default useEditTaskForm;
