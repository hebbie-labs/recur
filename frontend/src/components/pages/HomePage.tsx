import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, FilePlus2 } from "lucide-react";
import type { Task } from "@/types/task";
import Empty from "@/components/molecules/Empty";
import { type SortOptions, sortTasks } from "@/utils/sortTasks";
import TaskCardGrid from "@/components/molecules/task/TaskCardGrid";
import Sorter from "@/components/atoms/Sorter";
import { useAddTask } from "@/contexts/AddTaskContext";
import { useTasksContext } from "@/contexts/TasksContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import TaskCardGridSkeleton from "../molecules/task/TaskCardGridSkeleton";

// Wie viele Karten die Favoriten-/Archiv-Vorschau auf der Start-Seite zeigt,
// bevor man auf "Alle anzeigen" tippen muss.
const PREVIEW_COUNT = 3;

function SectionHeader({ title, action }: { title: string; action: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  );
}

function SeeAllLink({ path }: { path: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(path)}
      className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
    >
      Alle anzeigen
      <ChevronRight className="h-4 w-4" />
    </button>
  );
}

type MobileHomeSectionsProps = {
  sortedTasks: Task[];
  favoriteTasks: Task[];
  archivedTasks: Task[];
  sortBy: SortOptions;
  setSortBy: (value: SortOptions) => void;
  onOpenAddTask: () => void;
  onToggleFavorite: (taskId: string) => void;
  onToggleArchive: (taskId: string) => void;
  onResetProgress: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onToggleDone: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
};

function MobileHomeSections({
  sortedTasks,
  favoriteTasks,
  archivedTasks,
  sortBy,
  setSortBy,
  onOpenAddTask,
  onToggleFavorite,
  onToggleArchive,
  onResetProgress,
  onDelete,
  onToggleDone,
  onUpdateTask,
}: MobileHomeSectionsProps) {
  const mainHandlers = useMemo(
    () => ({
      onToggleFavorite,
      onToggleArchive,
      onResetProgress,
      onDelete,
      onToggleDone,
      onTaskUpdated: onUpdateTask,
    }),
    [onToggleFavorite, onToggleArchive, onResetProgress, onDelete, onToggleDone, onUpdateTask],
  );

  // Archivierte Aufgaben sind schreibgeschützt (siehe ArchivePage.tsx) - kein
  // onResetProgress/onToggleDone, sonst liesse sich der Fortschritt einer
  // archivierten Aufgabe hier ändern.
  const previewHandlers = useMemo(
    () => ({ onToggleFavorite, onToggleArchive, onDelete }),
    [onToggleFavorite, onToggleArchive, onDelete],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHeader
          title="Alle Aufgaben"
          action={<Sorter sortBy={sortBy} setSortBy={setSortBy} />}
        />
        {sortedTasks.length === 0 ? (
          <Empty
            icon={() => <FilePlus2 className="w-12 h-12 text-gray-400" />}
            title="Keine Aufgaben"
            description="Es gibt derzeit keine Aufgaben."
            buttonText="Aufgabe erstellen"
            onButtonClick={onOpenAddTask}
          />
        ) : (
          <TaskCardGrid sortedTasks={sortedTasks} handlers={mainHandlers} direction="row" paginate />
        )}
      </div>

      {favoriteTasks.length > 0 && (
        <div>
          <SectionHeader title="Favoriten" action={<SeeAllLink path="/favorites" />} />
          <TaskCardGrid
            sortedTasks={favoriteTasks.slice(0, PREVIEW_COUNT)}
            handlers={previewHandlers}
            direction="row"
          />
        </div>
      )}

      {archivedTasks.length > 0 && (
        <div>
          <SectionHeader title="Archiv" action={<SeeAllLink path="/archive" />} />
          <TaskCardGrid
            sortedTasks={archivedTasks.slice(0, PREVIEW_COUNT)}
            handlers={previewHandlers}
            direction="row"
          />
        </div>
      )}
    </div>
  );
}

function HomePage() {
  const {
    tasks,
    loading,
    favoriteTasks,
    archivedTasks,
    handleToggleFavorite,
    handleToggleArchive,
    handleResetProgress,
    handleDelete,
    handleToggleDone,
    handleUpdateTask,
  } = useTasksContext();
  const isMobile = useBreakpoint() === "mobile";

  const handlers = useMemo(
    () => ({
      onToggleFavorite: handleToggleFavorite,
      onToggleArchive: handleToggleArchive,
      onResetProgress: handleResetProgress,
      onDelete: handleDelete,
      onToggleDone: handleToggleDone,
      onTaskUpdated: handleUpdateTask,
    }),
    [
      handleToggleFavorite,
      handleToggleArchive,
      handleResetProgress,
      handleDelete,
      handleToggleDone,
      handleUpdateTask,
    ],
  );

  const [sortBy, setSortBy] = useState<SortOptions>("date descending");
  const { openAddTaskForm } = useAddTask();

  const sortedTasks = useMemo(() => sortTasks(tasks, sortBy), [tasks, sortBy]);

  if (loading) {
    return <TaskCardGridSkeleton count={6} direction="row" />;
  }

  // Mobile: "Start"-Seite zeigt Alle Aufgaben (immer zuerst, unbedingt) plus
  // Favoriten-/Archiv-Vorschau darunter - diese beiden sind auf Mobile keine
  // eigenen Bottom-Nav-Tabs mehr (siehe DefaultLayout.tsx MOBILE_NAV_ROUTES).
  if (isMobile) {
    return (
      <MobileHomeSections
        sortedTasks={sortedTasks}
        favoriteTasks={favoriteTasks}
        archivedTasks={archivedTasks}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onOpenAddTask={openAddTaskForm}
        onToggleFavorite={handleToggleFavorite}
        onToggleArchive={handleToggleArchive}
        onResetProgress={handleResetProgress}
        onDelete={handleDelete}
        onToggleDone={handleToggleDone}
        onUpdateTask={handleUpdateTask}
      />
    );
  }

  if (tasks.length === 0) {
    return (
      <Empty
        icon={() => <FilePlus2 className="w-12 h-12 text-gray-400" />}
        title="Keine Aufgaben"
        description="Es gibt derzeit keine Aufgaben."
        buttonText="Aufgabe erstellen"
        onButtonClick={openAddTaskForm}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-end">
        <Sorter sortBy={sortBy} setSortBy={setSortBy} />
      </div>

      <TaskCardGrid
        sortedTasks={sortedTasks}
        handlers={handlers}
        direction="row"
        paginate
      />
    </div>
  );
}
export default HomePage;
