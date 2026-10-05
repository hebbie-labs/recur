import { Button } from "@/components/ui/button";
import { useAddTask } from "@/contexts/AddTaskContext";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

type FloatingActionButtonProps = {
  onClick?: () => void;
  className?: string;
};

function FloatingActionButton({
  onClick,
  className,
}: FloatingActionButtonProps) {
  const { openAddTaskForm } = useAddTask();
  return (
    <Button
      size="icon"
      aria-label="Neue Aufgabe hinzufügen"
      onClick={() => (onClick ? onClick() : openAddTaskForm())}
      className={cn(
        className,
        "z-10 h-18 w-18 sm:h-14 sm:w-14 rounded-full shadow-lg shrink-0",
      )}
    >
      <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
    </Button>
  );
}

export default FloatingActionButton;
