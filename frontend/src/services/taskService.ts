import axios from "axios";
import api from "./api";

export const TaskFrequency = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
  ONCE: "ONCE",
} as const;

export type TaskFrequency = (typeof TaskFrequency)[keyof typeof TaskFrequency];

export const TaskCategory = {
  WORK: "WORK",
  PERSONAL: "PERSONAL",
  SCHOOL: "SCHOOL",
  OTHER: "OTHER",
} as const;

export type TaskCategory = (typeof TaskCategory)[keyof typeof TaskCategory];

/** Wer ein geteiltes Projekt-Task erledigt/zugeordnet hat - Kurzform von User. */
export interface TaskPerson {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

/** Projekt-Referenz auf einem geteilten Gruppen-Task. */
export interface TaskProject {
  id: string;
  name: string;
  isArchived: boolean;
}

export interface Task {
  id: string;
  name: string;
  category: TaskCategory;
  frequency: TaskFrequency;
  description: string;
  dateUntil: string;
  progress: number;
  dateCreated: string;
  /** Vom Server bei jedem Save neu gesetzt - Basis für den Sync-Merge (Last-Write-Wins). */
  updatedAt?: string | null;
  daysInSpan?: number | null;
  amountDid?: number | null;
  isFavorite?: boolean | null;
  isArchived: boolean;
  durationMinutes?: number | null;
  startTime?: string | null;
  /** Gesetzt <=> geteiltes Item eines Gruppen-Projekts statt persönlicher Task. */
  project?: TaskProject | null;
  /** Wer den Task zuletzt als erledigt markiert hat (nur bei Projekt-Tasks relevant). */
  completedBy?: TaskPerson | null;
}

/** Fields the server owns and the client must never send on create/patch. */
export type ServerOwnedFields =
  | "id"
  | "dateCreated"
  | "updatedAt"
  | "project"
  | "completedBy"
  | "isArchived";

/** Payload shape for creating a new task (no id/dateCreated yet). */
export type NewTask = Omit<Task, ServerOwnedFields> & { projectId?: string | null };

/** Options for patchTask: partial task fields plus query-param flags. */
export type PatchTaskOptions = {
  task?: Partial<Omit<Task, ServerOwnedFields>> & { projectId?: string | null };
  resetProgress?: boolean;
  favorite?: boolean;
  archived?: boolean;
  amountDid?: number;
  durationMinutes?: number;
  startTime?: string;
  /** Setzt den Task explizit zurück auf persönlich (kein Projekt mehr). */
  unassignProject?: boolean;
};

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string } | undefined)?.message ??
      fallback
    );
  }
  return fallback;
}

/**
 * Normalizes a date-only string (e.g. "2222-02-21") or a full ISO string
 * into a full ISO-8601 instant string that java.time.Instant can parse.
 * Passes through null/undefined unchanged.
 */
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

/**
 * Wandelt das frontend-freundliche `projectId` in die verschachtelte
 * `project: { id }`-Referenz um, die das Backend (Task.project) erwartet.
 * `projectId` bleibt dabei nicht Teil des gesendeten Bodys.
 */
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
  } = options;
  return api
    .patch(`/task/${id}`, withProjectReference(normalizeTaskDates(task)), {
      params: { resetProgress, favorite, archived, amountDid, unassignProject },
    })
    .then((response) => response.data as Task)
    .catch((err: unknown) => {
      throw new Error(
        extractErrorMessage(err, "Fehler beim Aktualisieren der Aufgabe")
      );
    });
}

function deleteTask(id: string): Promise<void> {
  return api
    .delete(`/task/${id}`)
    .then(() => {})
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

export { getTasks, createTask, patchTask, deleteTask, deleteAllTasks };
