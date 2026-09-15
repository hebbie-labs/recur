import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { Task } from "@/services/taskService";
import {
  occursOn,
  sortByStartTime,
  categoryDot,
  categoryBorder,
  type CalendarDay,
  type CalendarWeek,
} from "@/utils/calendarGrid";
import { cn } from "@/lib/utils";
import DetailDialog from "@/components/molecules/DetailDialog";

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MAX_VISIBLE_TASKS = 3;
const WEEK_COLUMN_WIDTH = "w-8";

type CalendarMonthViewProps = {
  weeks: CalendarWeek[];
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onSelectDay: (date: Date) => void;
  onSelectWeek: (days: CalendarDay[]) => void;
  /** Schlanke Variante ohne Task-Details, fürs Mobile-Schnellsprung-Popover. */
  compact?: boolean;
};

function CalendarMonthView({
  weeks,
  tasks,
  onSelectTask,
  onSelectDay,
  onSelectWeek,
  compact = false,
}: CalendarMonthViewProps) {
  const [dayListDate, setDayListDate] = useState<Date | null>(null);

  const dayListTasks = dayListDate
    ? sortByStartTime(tasks.filter((task) => occursOn(task, dayListDate)))
    : [];

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex">
        <div className={cn(WEEK_COLUMN_WIDTH, "shrink-0 border-r border-b border-border/70")} />
        <div className="grid flex-1 grid-cols-7">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="border-b border-border/70 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {weeks.map((week) => (
        <div
          key={week.days[0].date.toISOString()}
          className={cn("flex", week.isCurrentWeek && "bg-primary/[0.02]")}
        >
          <button
            type="button"
            onClick={() => onSelectWeek(week.days)}
            title={`Zur Woche ${week.weekNumber} springen`}
            className="flex w-8 shrink-0 items-center justify-center border-r border-border/70 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
          >
            {week.weekNumber}
          </button>

          <div className="grid flex-1 grid-cols-7">
            {week.days.map((day) => {
              const dayTasks = sortByStartTime(
                tasks.filter((task) => occursOn(task, day.date))
              );
              const visibleTasks = dayTasks.slice(0, MAX_VISIBLE_TASKS);
              const overflowCount = dayTasks.length - visibleTasks.length;

              return (
                <div
                  key={day.date.toISOString()}
                  onClick={() => onSelectDay(day.date)}
                  className={cn(
                    "group flex cursor-pointer flex-col gap-1 border-r border-b border-border/70 p-2 transition-colors last:border-r-0 hover:bg-accent/40",
                    compact ? "min-h-9 items-center py-1.5" : "min-h-28",
                    day.isToday && "bg-primary/[0.04]"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center self-start rounded-full text-xs tabular-nums",
                      compact && "self-auto",
                      day.isToday
                        ? "bg-primary font-semibold text-primary-foreground"
                        : day.isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                    )}
                  >
                    {format(day.date, "d")}
                  </span>

                  {compact ? (
                    dayTasks.length > 0 && (
                      <span className="size-1 rounded-full bg-muted-foreground/60" />
                    )
                  ) : (
                    <div className="flex flex-col gap-1">
                      {visibleTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(task);
                          }}
                          title={task.name}
                          className={cn(
                            "cursor-pointer truncate rounded-md border-l-[3px] bg-card px-1.5 py-0.5 text-[11px] font-medium text-foreground shadow-xs transition-shadow hover:shadow-sm",
                            categoryBorder[task.category]
                          )}
                        >
                          {task.name}
                        </div>
                      ))}
                      {overflowCount > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDayListDate(day.date);
                          }}
                          className="w-fit truncate rounded-full px-1.5 py-0.5 text-left text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          +{overflowCount} weitere
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <DetailDialog
        open={dayListDate !== null}
        onClose={() => setDayListDate(null)}
        title={
          dayListDate
            ? format(dayListDate, "EEEE, d. MMMM yyyy", { locale: de })
            : undefined
        }
      >
        <div className="flex flex-col gap-1.5">
          {dayListTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => {
                setDayListDate(null);
                onSelectTask(task);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent"
            >
              <span
                className={cn("size-2 shrink-0 rounded-full", categoryDot[task.category])}
              />
              <span className="truncate">{task.name}</span>
            </div>
          ))}
        </div>
      </DetailDialog>
    </div>
  );
}

export default CalendarMonthView;
