import TaskCardGridSkeleton from "@/components/molecules/task/TaskCardGridSkeleton";

// Next zeigt das automatisch als Suspense-Fallback für {children} in
// (app)/layout.tsx, während ein noch nicht geladener Routen-Chunk nachlädt -
// DefaultLayout (Sidebar, AppBar) bleibt währenddessen stehen. Gleiches
// Skeleton wie Home/Favoriten/Archiv, damit der Übergang in den
// eigentlichen Lade-State der Zielseite nicht wie ein zweiter, andersartiger
// Ladezustand wirkt.
export default function Loading() {
  return <TaskCardGridSkeleton count={6} direction="row" />;
}
