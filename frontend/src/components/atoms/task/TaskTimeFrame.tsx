import { CalendarRange } from "lucide-react";
import { formatDate } from "@/utils/formatDate";

type TaskTimeFrameProps = {
  start: string | null;
  end: string | null;
};

function TaskTimeFrame({ start, end }: TaskTimeFrameProps) {
  const formattedStart = start ? formatDate(start) : null;
  const formattedEnd = end ? formatDate(end) : null;

  const label =
    formattedStart && formattedEnd
      ? `${formattedStart} - ${formattedEnd}`
      : formattedStart
      ? `Ab ${formattedStart}`
      : formattedEnd
      ? `Bis ${formattedEnd}`
      : "Kein Zeitraum angegeben";

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <CalendarRange className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );
}

export default TaskTimeFrame;