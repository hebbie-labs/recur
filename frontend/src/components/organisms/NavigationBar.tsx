import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import Fab from "@/components/atoms/FloatingActionButton";
import { useAddTask } from "@/contexts/AddTaskContext";
import {
  useNavigationBar,
  type NavigationDestination,
} from "@/hooks/useNavigationBar";

type NavigationBarProps = {
  className?: string;
  destinations: NavigationDestination[];
};

function NavigationBar({ destinations, className }: NavigationBarProps) {
  const { openAddTaskForm } = useAddTask();
  const { activeValue, handleNavigation } = useNavigationBar(destinations);
  

  return (
    <Tabs
      value={activeValue}
      onValueChange={handleNavigation}
      className={cn(
        "fixed mx-auto max-w-7xl z-40",
        "bg-background/80 backdrop-blur-lg rounded-2xl shadow-2xl shadow-black/30 border border-border/50",
        "animate-in slide-in-from-bottom-8 fade-in duration-500 ease-out",
        "sm:bottom-6 sm:left-6 sm:right-6 sm:p-3",
        "max-sm:bottom-3 max-sm:left-3 max-sm:right-3 max-sm:p-2 max-sm:rounded-xl",
        className
      )}
    >
      <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
        <TabsList className="h-auto flex-1 justify-between items-center gap-1 sm:gap-2 bg-transparent p-0">
          {destinations.map((destination, index) => (
            <TabsTrigger
              key={index}
              value={String(index)}
              className={cn(
                "group relative flex flex-col items-center justify-center h-auto flex-1 gap-1 px-2 py-2 sm:px-3 rounded-xl",
                "transition-colors duration-200 ease-out",
                "text-muted-foreground data-[state=active]:text-foreground",
                "hover:bg-muted/60 active:scale-95",
                "data-[state=active]:bg-muted"
              )}
            >
              <span className="[&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-6 sm:[&>svg]:w-6 transition-transform duration-200 group-data-[state=active]:-translate-y-0.5">
                <destination.icon />
              </span>
              <span className="text-[10px] sm:text-xs font-medium leading-none">
                {destination.label}
              </span>
              <span
                className={cn(
                  "absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary opacity-0 transition-opacity duration-200",
                  "group-data-[state=active]:opacity-100"
                )}
              />
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="h-8 w-px bg-border/60 shrink-0" />

        <Fab onClick={() => openAddTaskForm()} />
      </div>
    </Tabs>
  );
}

export default NavigationBar;
