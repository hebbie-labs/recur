import { AlertCircle } from "lucide-react";

/** Rotes "Überfällig"-Signal für nicht abgehakte Tasks nach Fälligkeit (#153). */
function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
      <AlertCircle className="size-3.5" />
      Überfällig
    </span>
  );
}

export default OverdueBadge;
