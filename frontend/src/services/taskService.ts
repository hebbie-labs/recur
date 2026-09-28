import axios from "axios";
import api, { isUnauthorized } from "./api";
import type { ReminderLeadTime } from "@/types/notifications";
import type { Task, NewTask, PatchTaskOptions } from "@/types/task";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string } | undefined)?.message ??
      fallback
    );
  }
  return fallback;
}

/** Normalizes a date-only string (e.g. "2222-02-21") or a full ISO string into a full ISO-8601 instant string that java.time.Instant can parse; passes through null/undefined unchanged. */
function toInstantString(date: string | null | undefined): string | null {
  if (date === null || date === undefined || date === "") return null;
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Ungültiges Datum: "${date}"`);
  }
  return parsed.toISOString();
}

function normalizeTaskDates<T extends { dateUntil?: string | null }>(
  task: T
): T {
  if (task.dateUntil === undefined) return task;
  return { ...task, dateUntil: toInstantString(task.dateUntil) };
}

/** Wandelt das frontend-freundliche `projectId` in die verschachtelte `project: { id }`-Referenz um, die das Backend (Task.project) erwartet; `projectId` bleibt dabei nicht Teil des gesendeten Bodys. */
function withProjectReference<T extends { projectId?: string | null }>(
  payload: T
): Omit<T, "projectId"> & { project?: { id: string } } {
  const { projectId, ...rest } = payload;
  return {
    ...rest,
    ...(projectId ? { project: { id: projectId } } : {}),
  };
}

function getTasks(archived?: boolean, favorite?: boolean): Promise<Task[]> {
  return api
    .get("/task", { params: { archived, favorite } })
    .then((response) => response.data as Task[])
    .catch((err: unknown) => {
      // Roh weiterwerfen statt in eine Message-Error zu verpacken - TasksContext
      // muss einen 401 hier erkennen können (nicht (mehr) authentifiziert,
      // z.B. Logout-Race), um das nicht wie einen echten Fehler zu behandeln.
      if (isUnauthorized(err)) throw err;
      throw new Error(
        extractErrorMessage(err, "Fehler beim Abrufen der Aufgaben")
      );
    });
}

function createTask(task: NewTask): Promise<Task> {
  return api
    .post("/task", withProjectReference(normalizeTaskDates(task)))
    .then((response) => response.data as Task)
    .catch((err: unknown) => {
      throw new Error(
        extractErrorMessage(err, "Fehler beim Erstellen der Aufgabe")
      );
    });
}

function patchTask(id: string, options: PatchTaskOptions = {}): Promise<Task> {
  const {
    task = {},
    resetProgress,
    favorite,
    archived,
    amountDid,
    unassignProject,
    hidden,
  } = options;
  return api
    .patch(`/task/${id}`, withProjectReference(normalizeTaskDates(task)), {
      params: { resetProgress, favorite, archived, amountDid, unassignProject, hidden },
    })
    .then((response) => response.data as Task)
    .catch((err: unknown) => {
      throw new Error(
        extractErrorMessage(err, "Fehler beim Aktualisieren der Aufgabe")
      );
    });
}

/** Hakt einen einzelnen Tag nachträglich ab (#152) - date als "YYYY-MM-DD". */
function addTaskCompletion(id: string, date: string): Promise<Task> {
  return api
    .put(`/task/${id}/completions/${date}`)
    .then((response) => response.data as Task)
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Abhaken des Tages"));
    });
}

/** Macht ein einzelnes Häkchen wieder rückgängig (#152) - date als "YYYY-MM-DD". */
function removeTaskCompletion(id: string, date: string): Promise<Task> {
  return api
    .delete(`/task/${id}/completions/${date}`)
    .then((response) => response.data as Task)
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Rückgängigmachen des Tages"));
    });
}

/** Löscht einen persönlichen Task oder (als Ersteller) einen Projekt-Task endgültig für alle - Server antwortet mit leerem Body (null). Blendet ein Gruppenmitglied den Task nur für sich aus, liefert der Server stattdessen den aktualisierten Task für einen Undo-Toast (patchTask({ hidden: false })). */
function deleteTask(id: string): Promise<Task | null> {
  return api
    .delete(`/task/${id}`)
    .then((response) => (response.data as Task | "") || null)
    .catch((err: unknown) => {
      throw new Error(
        extractErrorMessage(err, "Fehler beim Löschen der Aufgabe")
      );
    });
}

function deleteAllTasks(): Promise<void> {
  return api
    .delete(`/task`)
    .then(() => {})
    .catch((err: unknown) => {
      throw new Error(
        extractErrorMessage(err, "Fehler beim Löschen aller Aufgaben")
      );
    });
}

/** Setzt/löscht den Erinnerungs-Vorlauf-Override des aktuellen Users für diesen Task (#102-Follow-up) - pro (task, user), daher ein eigener Endpoint statt Teil von createTask/patchTask; `null` löscht den Override wieder (zurück auf die Kontoeinstellung). */
function setTaskReminderLeadTime(
  id: string,
  reminderLeadTime: ReminderLeadTime | null
): Promise<Task> {
  return api
    .put(`/task/${id}/reminder-lead-time`, { reminderLeadTime })
    .then((response) => response.data as Task)
    .catch((err: unknown) => {
      throw new Error(
        extractErrorMessage(err, "Fehler beim Setzen des Erinnerungs-Vorlaufs")
      );
    });
}

function assignSelf(id: string): Promise<Task> {
  return api
    .post(`/task/${id}/assign`)
    .then((response) => response.data as Task)
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Zuweisen der Aufgabe"));
    });
}

function unassignSelf(id: string): Promise<Task> {
  return api
    .post(`/task/${id}/unassign`)
    .then((response) => response.data as Task)
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Abmelden von der Aufgabe"));
    });
}

export {
  getTasks,
  createTask,
  patchTask,
  deleteTask,
  deleteAllTasks,
  assignSelf,
  unassignSelf,
  addTaskCompletion,
  removeTaskCompletion,
  setTaskReminderLeadTime,
};
