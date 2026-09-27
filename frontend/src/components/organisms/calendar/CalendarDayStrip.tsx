import { format, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import type { CalendarDay } from "@/utils/calendarGrid";
import { cn } from "@/lib/utils";

type CalendarDayStripProps = {
  days: CalendarDay[];
  selectedDate: Date;
  onSelectDay: (date: Date) => void;
};

/** Proton-Calendar-artiger Wochentag-Streifen fürs Mobile-Wochenansicht: eine
 * Zeile mit den 7 Tagen der Woche, Tap wechselt den unten angezeigten Tag. */
function CalendarDayStrip({ days, selectedDate, onSelectDay }: CalendarDayStripProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day) => {
        const isSelected = isSameDay(day.date, selectedDate);

        return (
          <button
            key={day.date.toISOString()}
            type="button"
            onClick={() => onSelectDay(day.date)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg py-1.5 transition-colors hover:bg-accent/40",
              isSelected && "ring-1 ring-primary"
            )}
          >
            <span className="text-[10px] font-medium text-muted-foreground">
              {format(day.date, "EEEEE", { locale: de })}
            </span>
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                day.isToday
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground"
              )}
            >
              {format(day.date, "d")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default CalendarDayStrip;
