import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { Task } from "@/services/taskService";
import { occursOn, categoryBorder, type CalendarDay } from "@/utils/calendarGrid";
import { cn } from "@/lib/utils";

const START_HOUR = 8;
const END_HOUR = 24;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => i + START_HOUR
);

type CalendarWeekViewProps = {
  days: CalendarDay[];
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onSelectSlot: (date: Date, hour: number) => void;
};

// Rows are 1-indexed; row 1 is the sticky day-header row, row 2 is
// START_HOUR:00-:15, so a time's grid row is its quarter-hour offset + 2.
function getTaskPosition(task: Task) {
  const taskDate = new Date(task.startTime ?? task.dateCreated);
  const hoursFromStart = taskDate.getHours() - START_HOUR + taskDate.getMinutes() / 60;

  const startRow = Math.max(2, Math.floor(hoursFromStart * 4) + 2);
  const rowSpan = Math.max(1, Math.ceil((task.durationMinutes || 15) / 15));

  return { startRow, rowSpan };
}

function getCurrentTimeRow(): number | null {
  const now = new Date();
  if (now.getHours() < START_HOUR || now.getHours() >= END_HOUR) return null;
  const hoursFromStart = now.getHours() - START_HOUR + now.getMinutes() / 60;
  return Math.max(2, Math.floor(hoursFromStart * 4) + 2);
}

function CalendarWeekView({
  days,
  tasks,
  onSelectTask,
  onSelectSlot,
}: CalendarWeekViewProps) {
  const currentTimeRow = getCurrentTimeRow();

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div
        className="relative grid"
        style={{
          gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${HOURS.length * 4}, 15px)`,
        }}
      >
        <div
          className="sticky top-0 z-20 border-b border-border/70 bg-background"
          style={{ gridColumn: 1, gridRow: 1 }}
        />
        {days.map((day, index) => (
          <div
            key={day.date.toISOString()}
            className={cn(
              "sticky top-0 z-20 border-b border-l border-border/70 bg-background py-2 text-center first:border-l-0",
              day.isToday && "bg-primary/[0.04]"
            )}
            style={{ gridColumn: index + 2, gridRow: 1 }}
          >
            <div className="text-xs font-medium text-muted-foreground">
              {format(day.date, "EEE", { locale: de })}
            </div>
            <div
              className={cn(
                "mx-auto mt-0.5 flex size-6 items-center justify-center rounded-full text-sm tabular-nums",
                day.isToday
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "text-foreground"
              )}
            >
              {format(day.date, "d")}
            </div>
          </div>
        ))}

        {HOURS.map((hour, hourIdx) => {
          const rowIndex = hourIdx * 4 + 2;
          return (
            <div key={hour} className="contents">
              <div
                className="-translate-y-2 pr-2 text-right text-[11px] text-muted-foreground"
                style={{ gridColumn: 1, gridRow: `${rowIndex} / span 4` }}
              >
                {hour}:00
              </div>
              {days.map((day, dayIdx) => (
                <div
                  key={`${day.date.toISOString()}-${hour}`}
                  onClick={() => onSelectSlot(day.date, hour)}
                  style={{ gridColumn: dayIdx + 2, gridRow: `${rowIndex} / span 4` }}
                  className="cursor-pointer border-t border-l border-border/50 first:border-l-0 hover:bg-accent/40"
                />
              ))}
            </div>
          );
        })}

        {currentTimeRow &&
          days.map((day, dayIdx) =>
            day.isToday ? (
              <div
                key={`now-${day.date.toISOString()}`}
                style={{
                  gridColumn: dayIdx + 2,
                  gridRow: `${currentTimeRow} / span 1`,
                  zIndex: 15,
                }}
                className="pointer-events-none relative self-start"
              >
                <div className="absolute -left-1 top-0 size-2 -translate-y-1/2 rounded-full bg-destructive" />
                <div className="border-t-2 border-destructive" />
              </div>
            ) : null
          )}

        {days.map((day, dayIdx) => {
          const dayTasks = tasks.filter((task) => occursOn(task, day.date));
          const colIndex = dayIdx + 2;

          return dayTasks.map((task) => {
            const { startRow, rowSpan } = getTaskPosition(task);

            return (
              <div
                key={`${task.id}-${day.date.toISOString()}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTask(task);
                }}
                style={{
                  gridColumn: colIndex,
                  gridRow: `${startRow} / span ${rowSpan}`,
                  zIndex: 10,
                }}
                className={cn(
                  "mx-0.5 cursor-pointer overflow-hidden truncate rounded-md border-l-[3px] bg-card px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-xs transition-shadow hover:shadow-sm",
                  categoryBorder[task.category]
                )}
                title={task.name}
              >
                {task.name}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

export default CalendarWeekView;
