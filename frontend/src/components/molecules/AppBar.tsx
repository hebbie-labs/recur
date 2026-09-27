import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/atoms/UserAvatar";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useAuth } from "@/contexts/AuthContext";
import { useAddTask } from "@/contexts/AddTaskContext";

type AppBarProps = {
  title?: string;
  // Ob die aktuelle Route eines der 5 primären NAV_ROUTES-Ziele ist - auf
  // Mobile entscheidet das, ob links das Account-Avatar (primäre Route) oder
  // ein Zurück-Chevron (z.B. /account, /settings) angezeigt wird.
  isPrimaryRoute?: boolean;
  // Ob "Aufgabe hinzufügen" auf dieser Route Sinn ergibt (deckt sich mit
  // FAB_ROUTES in DefaultLayout, von dort durchgereicht statt hier
  // dupliziert). Nur auf Mobile gerendert - Desktop behält den Fab (#208).
  showAddTaskButton?: boolean;
};

function AppBar({ title, isPrimaryRoute = false, showAddTaskButton = false }: AppBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { openAddTaskForm } = useAddTask();
  const isMobile = useBreakpoint() === "mobile";

  // Eine Ebene nach oben statt router.back(): als installierte PWA kann z.B.
  // /settings/notifications ohne In-App-Historie geöffnet werden (letzter
  // Screen beim Schliessen), dann liefe router.back() ins Leere.
  // Sonderfall /settings: dahin gelangt man nur über /account (Zahnrad-Icon),
  // daher soll "zurück" auch wieder dorthin führen statt zu "/".
  let backHref: string;
  if (pathname === "/settings") {
    backHref = "/account";
  } else {
    const segments = pathname.split("/").filter(Boolean);
    segments.pop();
    backHref = segments.length ? `/${segments.join("/")}` : "/";
  }

  if (isMobile) {
    return (
      <header className="sticky top-0 z-20 grid h-16 shrink-0 grid-cols-[2.75rem_1fr_2.75rem] items-center border-b bg-background px-4">
        {isPrimaryRoute && user ? (
          <button
            type="button"
            aria-label="Account"
            onClick={() => router.push("/account")}
            className="justify-self-start rounded-full"
          >
            <UserAvatar user={user} className="h-10 w-10" />
          </button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Zurück"
            className="-ml-1 justify-self-start"
            onClick={() => router.push(backHref)}
          >
            <ChevronLeft />
          </Button>
        )}
        <h1 className="truncate text-center text-lg font-semibold text-foreground">
          {title}
        </h1>
        {showAddTaskButton && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Neue Aufgabe hinzufügen"
            className="justify-self-end rounded-full border border-white/30 bg-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(255,255,255,0.08)] backdrop-blur-[17px] supports-backdrop-filter:bg-white/10"
            onClick={() => openAddTaskForm()}
          >
            <Plus />
          </Button>
        )}
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4 self-center!" />
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
    </header>
  );
}

export default AppBar;
