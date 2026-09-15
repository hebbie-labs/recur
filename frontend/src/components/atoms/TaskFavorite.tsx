import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TaskFavoriteProps = {
  isFavorite: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

function TaskFavorite({ isFavorite, onClick }: TaskFavoriteProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="hover:bg-accent"
      aria-label={isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      aria-pressed={isFavorite}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
    >
      <Heart
        className={cn(
          "h-5 w-5",
          isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
        )}
      />
    </Button>
  );
}

export default TaskFavorite;