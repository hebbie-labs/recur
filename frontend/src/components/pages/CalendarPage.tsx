import { useState } from "react";
import { addWeeks, addMonths, addDays, isSameDay } from "date-fns";
import { ArrowRight, ArrowLeft, Menu, CalendarDays } from "lucide-react";
import { useTasksContext } from "@/contexts/TasksContext";
import { useAddTask } from "@/contexts/AddTaskContext";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupsContext } from "@/contexts/GroupsContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { TaskCategory, type Task, type TaskCategory as TaskCategoryType } from "@/types/task";
import { categoryLabels, ALL_CATEGORIES_LABEL } from "@/lib/taskCategoryStyles";
import {
  getWeekDays,
  getMonthGrid,
  getWeekLabel,
  getMonthLabel,
  categoryDot,
  type CalendarDay,
} from "@/utils/calendarGrid";
import { toDateOnlyString } from "@/utils/formatDate";
import { isDoneForCurrentPeriod } from "@/utils/taskCompletions";
import { cn } from "@/lib/utils";
import TaskCardGridSkeleton from "@/components/molecules/task/TaskCardGridSkeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import TaskDetailDialog from "@/components/organisms/dialogs/TaskDetailDialog";
import CalendarWeekView from "@/components/organisms/calendar/CalendarWeekView";
import CalendarMonthView from "@/components/organisms/calendar/CalendarMonthView";
import CalendarDayStrip from "@/components/organisms/calendar/CalendarDayStrip";

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
  const { user } = useAuth();
  const { groups, projectsByGroupId } = useGroupsContext();
  const breakpoint = useBreakpoint();
  // Sidebar mit permanentem Mini-Kalender nur auf Desktop - auf Tablet/Mobile
  // reicht die Breite sonst nicht für eine benutzbare Wochenansicht (#141).
  const showSidebar = breakpoint === "desktop";
  // Mobile Wochenansicht zeigt nur einen Tag auf einmal (CalendarDayStrip);
  // Tablet bekommt trotz ausgeblendeter Sidebar die volle 7-Spalten-Ansicht.
  const isMobile = breakpoint === "mobile";

  const [view, setView] = useState<ViewMode>("month");
  const [anchorDate, setAnchorDate] = useState(new Date());
  // Eigener Browse-State für den Mini-Kalender, getrennt von anchorDate:
  // Blättern im Mini-Kalender soll die Hauptansicht nicht verändern, bevor
  // ein konkreter Tag/Woche ausgewählt wird (#141).
  const [quickNavDate, setQuickNavDate] = useState(anchorDate);
  // Mini-Kalender folgt der Hauptansicht, sobald diese sich anderweitig
  // ändert (Header-Pfeile, "Heute", Tag-/Wochen-Auswahl im Mini-Kalender
  // selbst) - bleibt aber während des Blätterns im Mini-Kalender unabhängig.
  // State-Reset während des Renderns statt in einem Effect (React-Pattern
  // für "State an Prop-/State-Änderung anpassen"), siehe react.dev.
  const [syncedAnchorDate, setSyncedAnchorDate] = useState(anchorDate);
  if (anchorDate !== syncedAnchorDate) {
    setSyncedAnchorDate(anchorDate);
    setQuickNavDate(anchorDate);
  }
  const [activeCategory, setActiveCategory] = useState<TaskCategoryType | "All">(
    "All"
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [quickNavOpen, setQuickNavOpen] = useState(false);

  const selectedTask: Task | null = selectedTaskId
    ? tasks.find((task) => task.id === selectedTaskId) ?? null
    : null;

  // Nur der Gruppen-Admin darf einen geteilten Projekt-Task bearbeiten
  // (siehe TaskService#isGroupAdmin im Backend) - persönliche Tasks bleiben
  // unbeschränkt.
  const canEditSelectedTask = (() => {
    if (!selectedTask?.project) return true;
    const groupId = Object.entries(projectsByGroupId).find(([, projects]) =>
      projects.some((p) => p.id === selectedTask.project!.id)
    )?.[0];
    const group = groups.find((g) => g.id === groupId);
    return !group || group.createdBy?.id === user?.id;
  })();

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

  // Eigene Monats-Navigation für den Mini-Kalender (Popover auf Mobile/
  // Tablet, permanente Sidebar auf Desktop) - blättert nur den lokalen
  // quickNavDate-State, ohne die Hauptansicht zu verändern.
  function miniCalPrev() {
    setQuickNavDate((d) => addMonths(d, -1));
  }

  function miniCalNext() {
    setQuickNavDate((d) => addMonths(d, 1));
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
    return <TaskCardGridSkeleton count={6} direction="row" />;
  }

  const weekDays = getWeekDays(anchorDate);
  const monthWeeks = getMonthGrid(anchorDate);
  const quickNavWeeks = getMonthGrid(quickNavDate);
  const label = view === "month" ? getMonthLabel(anchorDate) : getWeekLabel(weekDays);

  return (
    <div className={cn("flex gap-6", !showSidebar && "flex-col gap-5")}>
      {showSidebar && (
        <aside className="flex w-72 shrink-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <Button
              variant="ghost"
              size="icon-xs"
              className="rounded-full text-muted-foreground"
              onClick={miniCalPrev}
              aria-label="Vorheriger Monat (Mini-Kalender)"
            >
              <ArrowLeft className="size-3.5" />
            </Button>
            <span className="text-sm font-semibold capitalize">
              {getMonthLabel(quickNavDate)}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              className="rounded-full text-muted-foreground"
              onClick={miniCalNext}
              aria-label="Nächster Monat (Mini-Kalender)"
            >
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
          <CalendarMonthView
            compact
            weeks={quickNavWeeks}
            tasks={visibleTasks}
            onSelectTask={handleQuickNavigateToTask}
            onSelectDay={handleQuickNavigateToDay}
            onSelectWeek={handleQuickNavigateToWeek}
          />
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-5">
      {!showSidebar ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <Popover
              open={quickNavOpen}
              onOpenChange={(open) => {
                setQuickNavOpen(open);
                if (open) setQuickNavDate(anchorDate);
              }}
            >
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
                    size="icon-xs"
                    className="rounded-full text-muted-foreground"
                    onClick={miniCalPrev}
                    aria-label="Vorheriger Monat (Mini-Kalender)"
                  >
                    <ArrowLeft className="size-3.5" />
                  </Button>
                  <span className="text-sm font-semibold capitalize">
                    {getMonthLabel(quickNavDate)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="rounded-full text-muted-foreground"
                    onClick={miniCalNext}
                    aria-label="Nächster Monat (Mini-Kalender)"
                  >
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
                <CalendarMonthView
                  compact
                  weeks={quickNavWeeks}
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

      <TaskDetailDialog
        task={selectedTask}
        open={selectedTask !== null}
        onClose={() => setSelectedTaskId(null)}
        onToggleArchive={() => selectedTask && handleToggleArchive(selectedTask.id)}
        onResetProgress={() => selectedTask && handleResetProgress(selectedTask.id)}
        onDelete={() => selectedTask && handleDelete(selectedTask.id)}
        onToggleDone={() => selectedTask && handleToggleDone(selectedTask.id)}
        onTaskUpdated={handleUpdateTask}
        isArchived={selectedTask?.isArchived ?? false}
        doneForCurrentPeriod={selectedTask ? isDoneForCurrentPeriod(selectedTask) : false}
        canEdit={canEditSelectedTask}
      />
      </div>
    </div>
  );
}

export default CalendarPage;
