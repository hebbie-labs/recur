"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { TasksProvider } from "@/contexts/TasksContext";
import { GroupsProvider } from "@/contexts/GroupsContext";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAutoSync } from "@/hooks/useAutoSync";

// Kein sichtbares Markup - startet nur den Hintergrund-Poll für geteilte
// Gruppen-Tasks. Muss innerhalb von TasksProvider/GroupsProvider sitzen, da
// useAutoSync beide Contexts braucht.
function AutoSyncRunner() {
  useAutoSync();
  return null;
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <ReactErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <SidebarProvider>
            <TasksProvider>
              <GroupsProvider>
                <AutoSyncRunner />
                {children}
              </GroupsProvider>
            </TasksProvider>
          </SidebarProvider>
        </TooltipProvider>
      </AuthProvider>
    </ReactErrorBoundary>
  );
}

export default Providers;
