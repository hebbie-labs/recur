import { useState } from "react";
import { addWeeks, addMonths, addDays, isSameDay, format } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowRight, ArrowLeft, Menu, CalendarDays } from "lucide-react";
import { useTasksContext } from "@/contexts/TasksContext";
import { useAddTask } from "@/contexts/AddTaskContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { TaskCategory, type Task, type TaskCategory as TaskCategoryType } from "@/services/taskService";
import { categoryLabels, frequencyLabels, ALL_CATEGORIES_LABEL } from "@/lib/taskCategoryStyles";
import {
  getWeekDays,
  getMonthGrid,
  getWeekLabel,
  getMonthLabel,
  categoryDot,
  type CalendarDay,
} from "@/utils/calendarGrid";
import { toDateOnlyString } from "@/utils/formatDate";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ProgressIndicator from "@/components/atoms/ProgressIndicator";
import DetailDialog from "@/components/molecules/DetailDialog";
import TaskCardMenu from "@/components/organisms/TaskCardMenu";
import CalendarWeekView from "@/components/organisms/CalendarWeekView";
import CalendarMonthView from "@/components/organisms/CalendarMonthView";
import CalendarDayStrip from "@/components/organisms/CalendarDayStrip";

type ViewMode = "month" | "week";

function CalendarPage() {
  const {
    tasks,
    loading,
    handleToggleDone,
    handleToggleArchive,
    handleResetProgress,
    handleDelete,
    handleUpdateTask,
  } = useTasksContext();
  const { openAddTaskForm } = useAddTask();
  const isMobile = useIsMobile();

  const [view, setView] = useState<ViewMode>("month");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState<TaskCategoryType | "All">(
    "All"
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  const selectedTask: Task | null = selectedTaskId
    ? tasks.find((task) => task.id === selectedTaskId) ?? null
    : null;

  const categories = Object.values(TaskCategory);
  const visibleTasks =
    activeCategory === "All"
      ? tasks
      : tasks.filter((task) => task.category === activeCategory);

  function goToday() {
    setAnchorDate(new Date());
  }

  function goPrev() {
    setAnchorDate((d) => {
      if (view === "month") return addMonths(d, -1);
      // Mobile Wochenansicht zeigt nur einen Tag auf einmal (siehe
      // CalendarDayStrip) - dort blättern die Pfeile tagweise statt wochenweise.
      if (isMobile) return addDays(d, -1);
      return addWeeks(d, -1);
    });
  }

  function goNext() {
    setAnchorDate((d) => {
      if (view === "month") return addMonths(d, 1);
      if (isMobile) return addDays(d, 1);
      return addWeeks(d, 1);
    });
  }

  // Eigene Monats-Navigation für den Mini-Kalender (Popover auf Mobile,
  // permanente Sidebar auf Desktop) - unabhängig von goPrev/goNext, die je
  // nach Ansicht/Gerät wochen- oder tagweise blättern.
  function miniCalPrev() {
    setAnchorDate((d) => addMonths(d, -1));
  }

  function miniCalNext() {
    setAnchorDate((d) => addMonths(d, 1));
  }

  function handleSelectDay(date: Date) {
    openAddTaskForm({ startDate: toDateOnlyString(date), startTimeOfDay: "09:00" });
  }

  function handleSelectSlot(date: Date, hour: number) {
    openAddTaskForm({
      startDate: toDateOnlyString(date),
      startTimeOfDay: `${String(hour).padStart(2, "0")}:00`,
    });
  }

  function handleSelectWeek(days: CalendarDay[]) {
    setAnchorDate(days[0].date);
    setView("week");
  }

  // Tag-Auswahl im Schnellsprung-Popover: nur navigieren (Wochenansicht mit
  // diesem Tag zeigen), im Gegensatz zu handleSelectDay im Hauptgrid, das
  // direkt "Task hinzufügen" öffnet.
  function handleQuickNavigateToDay(date: Date) {
    setAnchorDate(date);
    setView("week");
    setQuickNavOpen(false);
  }

  function handleQuickNavigateToWeek(days: CalendarDay[]) {
    handleSelectWeek(days);
    setQuickNavOpen(false);
  }

  function handleQuickNavigateToTask(task: Task) {
    setSelectedTaskId(task.id);
    setQuickNavOpen(false);
  }

  function goToTodayAndNavigate() {
    goToday();
    setQuickNavOpen(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  const weekDays = getWeekDays(anchorDate);
  const monthWeeks = getMonthGrid(anchorDate);
  const label = view === "month" ? getMonthLabel(anchorDate) : getWeekLabel(weekDays);

  return (
    <div className={cn("flex gap-6", isMobile && "flex-col gap-5")}>
      {!isMobile && (
        <aside className="flex w-72 shrink-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={miniCalPrev}
              aria-label="Zurück"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <span className="text-sm font-semibold capitalize">
              {getMonthLabel(anchorDate)}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={miniCalNext}
              aria-label="Weiter"
            >
              <ArrowRight className="size-4" />
            </Button>
          </div>
          <CalendarMonthView
            compact
            weeks={monthWeeks}
            tasks={visibleTasks}
            onSelectTask={handleQuickNavigateToTask}
            onSelectDay={handleQuickNavigateToDay}
            onSelectWeek={handleQuickNavigateToWeek}
          />
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-5">
      {isMobile ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <Popover open={quickNavOpen} onOpenChange={setQuickNavOpen}>
              <PopoverTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Schnellsprung öffnen">
                    <Menu className="size-5" />
                  </Button>
                }
              />
              <PopoverContent align="start" className="w-[min(90vw,360px)] gap-3 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                    onClick={miniCalPrev}
                    aria-label="Zurück"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <span className="text-sm font-semibold capitalize">
                    {getMonthLabel(anchorDate)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                    onClick={miniCalNext}
                    aria-label="Weiter"
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
                <CalendarMonthView
                  compact
                  weeks={monthWeeks}
                  tasks={visibleTasks}
                  onSelectTask={handleQuickNavigateToTask}
                  onSelectDay={handleQuickNavigateToDay}
                  onSelectWeek={handleQuickNavigateToWeek}
                />
              </PopoverContent>
            </Popover>

            <h2 className="truncate text-base font-semibold tracking-tight capitalize">
              {getMonthLabel(anchorDate)}
            </h2>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={goToTodayAndNavigate}
              aria-label="Heute anzeigen"
            >
              <CalendarDays className="size-5" />
            </Button>
          </div>

          <div className="flex items-center gap-0.5 self-start rounded-full border border-border p-0.5">
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => setView("month")}
            >
              Monat
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => setView("week")}
            >
              Woche
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 rounded-full border border-border p-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                onClick={goPrev}
                aria-label="Zurück"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                onClick={goNext}
                aria-label="Weiter"
              >
                <ArrowRight className="size-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" onClick={goToday}>
              Heute
            </Button>
            <h2 className="text-xl font-semibold tracking-tight capitalize">{label}</h2>
          </div>

          <div className="flex items-center gap-0.5 rounded-full border border-border p-0.5">
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => setView("month")}
            >
              Monat
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              className="rounded-full"
              onClick={() => setView("week")}
            >
              Woche
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveCategory("All")}
          aria-pressed={activeCategory === "All"}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeCategory === "All"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {ALL_CATEGORIES_LABEL}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            aria-pressed={activeCategory === cat}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className={`size-1.5 rounded-full ${categoryDot[cat]}`} />
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Noch keine Aufgaben vorhanden. Klicke auf einen Tag, um eine hinzuzufügen.
        </p>
      )}

      {view === "month" ? (
        <CalendarMonthView
          weeks={monthWeeks}
          tasks={visibleTasks}
          onSelectTask={(task) => setSelectedTaskId(task.id)}
          onSelectDay={handleSelectDay}
          onSelectWeek={handleSelectWeek}
        />
      ) : isMobile ? (
        <div className="flex flex-col gap-3">
          <CalendarDayStrip
            days={weekDays}
            selectedDate={anchorDate}
            onSelectDay={setAnchorDate}
          />
          <CalendarWeekView
            days={[weekDays.find((day) => isSameDay(day.date, anchorDate)) ?? weekDays[0]]}
            tasks={visibleTasks}
            onSelectTask={(task) => setSelectedTaskId(task.id)}
            onSelectSlot={handleSelectSlot}
          />
        </div>
      ) : (
        <CalendarWeekView
          days={weekDays}
          tasks={visibleTasks}
          onSelectTask={(task) => setSelectedTaskId(task.id)}
          onSelectSlot={handleSelectSlot}
        />
      )}

      <DetailDialog
        open={selectedTask !== null}
        onClose={() => setSelectedTaskId(null)}
        title={selectedTask?.name}
      >
        {selectedTask && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className={`size-2 rounded-full ${categoryDot[selectedTask.category]}`} />
                {categoryLabels[selectedTask.category]}
              </div>
              <TaskCardMenu
                task={selectedTask}
                onToggleMenu={() => {}}
                onToggleEdit={() => {}}
                onToggleArchive={() => handleToggleArchive(selectedTask.id)}
                onResetProgress={() => handleResetProgress(selectedTask.id)}
                onDelete={() => handleDelete(selectedTask.id)}
                onTaskUpdated={handleUpdateTask}
                isArchived={selectedTask.isArchived ?? false}
              />
            </div>

            <div className="flex flex-col gap-2 text-sm">
              {selectedTask.description && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Beschreibung</span>
                  <span style={{ wordWrap: "break-word" }}>{selectedTask.description}</span>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Wiederholung</span>
                <span>{frequencyLabels[selectedTask.frequency]}</span>
              </div>
              {selectedTask.startTime && (
                <div className="flex gap-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Datum</span>
                    <span>
                      {format(new Date(selectedTask.startTime), "dd.MM.yyyy", { locale: de })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Uhrzeit</span>
                    <span>
                      {format(new Date(selectedTask.startTime), "HH:mm", { locale: de })}
                    </span>
                  </div>
                  {selectedTask.durationMinutes && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Dauer</span>
                      <span>{selectedTask.durationMinutes} Min.</span>
                    </div>
                  )}
                </div>
              )}
              {selectedTask.dateUntil && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Fällig bis</span>
                  <span>
                    {format(new Date(selectedTask.dateUntil), "dd.MM.yyyy", { locale: de })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
              <div className="flex items-center gap-3">
                <ProgressIndicator value={selectedTask.progress} size={40} strokeWidth={4} />
                <span className="text-xs text-muted-foreground">Fortschritt</span>
              </div>
              <Button
                size="sm"
                disabled={selectedTask.progress >= 100}
                onClick={() => handleToggleDone(selectedTask.id)}
              >
                {selectedTask.progress >= 100 ? "Erledigt" : "Als erledigt markieren"}
              </Button>
            </div>
          </div>
        )}
      </DetailDialog>
      </div>
    </div>
  );
}

export default CalendarPage;
