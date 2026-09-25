import { setISOWeek, setISOWeekYear, startOfISOWeek, addDays } from "date-fns";
import { toDateOnlyString } from "@/utils/formatDate";

export type QuartalsplanRow = {
  kw: number;
  unterrichtsblock: string;
  modul: string;
  pruefungen: string;
  abgabetermine: string[];
};

export type DraftTaskSource = "Prüfung" | "Abgabe";

export type DraftTask = {
  id: string;
  kw: number;
  source: DraftTaskSource;
  name: string;
  description: string;
  dateUntil: string;
  dateSource: "explicit" | "computed";
  selected: boolean;
  warning?: string;
};

const NAME_MAX = 40;
const DESCRIPTION_MAX = 200;

// Two known Quartalsplan table shapes, auto-detected from the header row:
//  - "smartlearn": KW | Unterrichtsblock | Modul | smartlearn-Prüfungen | Abgabetermine
//  - "kompetenzabnahme" (other modules): Lektion (contains "KW nn") | Thema | Kapitel |
//    Späteste Kompetenzabnahme | HZ - no separate exam column, KW is embedded in "Lektion",
//    and "Späteste Kompetenzabnahme" is the one column that carries a deadline.
type HeaderKey =
  | "kw"
  | "unterrichtsblock"
  | "modul"
  | "pruefungen"
  | "abgabetermine"
  | "lektion"
  | "kompetenzabnahme";

function normalizeHeader(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics (ü -> u)
    .trim();
}

function matchHeaderKey(headerText: string): HeaderKey | null {
  const normalized = normalizeHeader(headerText);
  if (normalized === "kw") return "kw";
  if (normalized.includes("kompetenzabnahme")) return "kompetenzabnahme";
  if (normalized.includes("unterrichtsblock")) return "unterrichtsblock";
  if (normalized.includes("modul")) return "modul";
  if (normalized.includes("prufung")) return "pruefungen";
  if (normalized.includes("abgabe")) return "abgabetermine";
  if (normalized.includes("lektion")) return "lektion";
  return null;
}

/** Reads a table cell's text, turning <br> tags into newlines so multi-line cells survive. */
function cellText(cell: Element): string {
  const clone = cell.cloneNode(true) as Element;
  clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  return clone.textContent ?? "";
}

function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Collapses a (possibly multi-line) cell into a single line, e.g. "Fachgespräch\nKompetenzen Kapitel 2" -> "Fachgespräch Kompetenzen Kapitel 2". */
function joinLines(text: string): string {
  return splitLines(text).join(" ");
}

const KW_IN_TEXT_RE = /KW\s*(\d+)/i;

/** Extracts a KW number embedded in free text, e.g. "4 Lektionen\nKW 33" -> 33. */
function extractKwFromText(text: string): number | null {
  const match = text.match(KW_IN_TEXT_RE);
  if (!match) return null;
  const kw = Number(match[1]);
  return isNaN(kw) ? null : kw;
}

function buildRowsFromCells(
  columnOrder: (HeaderKey | null)[],
  dataRows: string[][]
): QuartalsplanRow[] {
  const isKompetenzFormat = columnOrder.includes("kompetenzabnahme");
  const rows: QuartalsplanRow[] = [];

  for (const cells of dataRows) {
    if (cells.length === 0) continue;

    const byKey: Partial<Record<HeaderKey, string>> = {};
    cells.forEach((cellValue, index) => {
      const key = columnOrder[index];
      if (key) byKey[key] = cellValue;
    });

    if (isKompetenzFormat) {
      const kw = extractKwFromText(byKey.lektion ?? "");
      if (kw === null) continue;

      const deadline = joinLines(byKey.kompetenzabnahme ?? "");
      rows.push({
        kw,
        unterrichtsblock: "",
        modul: "",
        pruefungen: "",
        abgabetermine: deadline ? [deadline] : [],
      });
      continue;
    }

    const kw = parseInt((byKey.kw ?? "").trim(), 10);
    if (isNaN(kw)) continue;

    rows.push({
      kw,
      unterrichtsblock: (byKey.unterrichtsblock ?? "").trim(),
      modul: (byKey.modul ?? "").trim(),
      pruefungen: (byKey.pruefungen ?? "").trim(),
      abgabetermine: splitLines(byKey.abgabetermine ?? ""),
    });
  }

  return rows;
}

const LEGACY_SMARTLEARN_COLUMN_ORDER: HeaderKey[] = [
  "kw",
  "unterrichtsblock",
  "modul",
  "pruefungen",
  "abgabetermine",
];

function parseHtmlTable(html: string): QuartalsplanRow[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const table = doc.querySelector("table");
  if (!table) return [];

  const trs = Array.from(table.querySelectorAll("tr"));
  if (trs.length === 0) return [];

  const headerCells = Array.from(trs[0].querySelectorAll("th, td"));
  const headerKeys = headerCells.map((cell) => matchHeaderKey(cellText(cell)));
  const hasRecognizedHeader = headerKeys.some((key) => key !== null);
  const columnOrder: (HeaderKey | null)[] = hasRecognizedHeader
    ? headerKeys
    : LEGACY_SMARTLEARN_COLUMN_ORDER;

  const dataTrs = hasRecognizedHeader ? trs.slice(1) : trs;
  const dataRows = dataTrs.map((tr) =>
    Array.from(tr.querySelectorAll("td, th")).map(cellText)
  );

  return buildRowsFromCells(columnOrder, dataRows);
}

function parsePlainTextTable(text: string): QuartalsplanRow[] {
  const lines = text.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const headerCells = lines[0].split("\t");
  const headerKeys = headerCells.map(matchHeaderKey);
  const hasRecognizedHeader = headerKeys.some((key) => key !== null);
  const columnOrder: (HeaderKey | null)[] = hasRecognizedHeader
    ? headerKeys
    : LEGACY_SMARTLEARN_COLUMN_ORDER;

  const dataLines = hasRecognizedHeader ? lines.slice(1) : lines;
  const dataRows = dataLines.map((line) => line.split("\t"));

  return buildRowsFromCells(columnOrder, dataRows);
}

export function parseClipboardTable(
  html: string | null,
  text: string | null
): QuartalsplanRow[] {
  if (html) {
    const rows = parseHtmlTable(html);
    if (rows.length > 0) return rows;
  }
  if (text) {
    return parsePlainTextTable(text);
  }
  return [];
}

const EXPLICIT_DATE_RE = /(\d{1,2})\.(\d{1,2})\.(\d{4})/;

function extractExplicitDate(text: string): Date | null {
  const match = text.match(EXPLICIT_DATE_RE);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return isNaN(date.getTime()) ? null : date;
}

export function detectReferenceYear(rows: QuartalsplanRow[]): number {
  for (const row of rows) {
    const texts = [row.pruefungen, ...row.abgabetermine];
    for (const text of texts) {
      const match = text.match(EXPLICIT_DATE_RE);
      if (match) return Number(match[3]);
    }
  }
  return new Date().getFullYear();
}

export function fridayOfIsoWeek(week: number, year: number): Date {
  const withYear = setISOWeekYear(new Date(), year);
  const withWeek = setISOWeek(withYear, week);
  return addDays(startOfISOWeek(withWeek), 4);
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function isPastOrToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate.getTime() <= today.getTime();
}

function draftFromDate(
  date: Date,
  dateSource: "explicit" | "computed"
): Pick<DraftTask, "dateUntil" | "dateSource" | "selected" | "warning"> {
  const past = isPastOrToday(date);
  return {
    dateUntil: toDateOnlyString(date),
    dateSource,
    selected: !past,
    warning: past ? "Datum liegt in der Vergangenheit" : undefined,
  };
}

let draftIdCounter = 0;
function nextDraftId(): string {
  draftIdCounter += 1;
  return `draft-${draftIdCounter}-${Date.now()}`;
}

export function buildDraftTasks(
  rows: QuartalsplanRow[],
  referenceYear: number
): DraftTask[] {
  const drafts: DraftTask[] = [];

  for (const row of rows) {
    const fallbackDate = () => fridayOfIsoWeek(row.kw, referenceYear);

    if (row.pruefungen) {
      const explicit = extractExplicitDate(row.pruefungen);
      const { dateUntil, dateSource, selected, warning } = explicit
        ? draftFromDate(explicit, "explicit")
        : draftFromDate(fallbackDate(), "computed");

      drafts.push({
        id: nextDraftId(),
        kw: row.kw,
        source: "Prüfung",
        name: truncate(row.pruefungen, NAME_MAX),
        description: truncate(
          [row.modul, `KW ${row.kw}`].filter(Boolean).join(" · "),
          DESCRIPTION_MAX
        ),
        dateUntil,
        dateSource,
        selected,
        warning,
      });
    }

    for (const line of row.abgabetermine) {
      const explicit = extractExplicitDate(line);
      const { dateUntil, dateSource, selected, warning } = explicit
        ? draftFromDate(explicit, "explicit")
        : draftFromDate(fallbackDate(), "computed");

      drafts.push({
        id: nextDraftId(),
        kw: row.kw,
        source: "Abgabe",
        name: truncate(line, NAME_MAX),
        description: truncate(line, DESCRIPTION_MAX),
        dateUntil,
        dateSource,
        selected,
        warning,
      });
    }
  }

  return drafts;
}

/** Recomputes dateUntil for drafts whose date came from a KW fallback (not explicit text), leaving explicit dates untouched. */
export function recomputeComputedDates(
  drafts: DraftTask[],
  referenceYear: number
): DraftTask[] {
  return drafts.map((draft) => {
    if (draft.dateSource !== "computed") return draft;
    const { dateUntil, selected, warning } = draftFromDate(
      fridayOfIsoWeek(draft.kw, referenceYear),
      "computed"
    );
    return { ...draft, dateUntil, selected, warning };
  });
}
