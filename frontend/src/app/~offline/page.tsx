"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fallback-Dokument des Service Workers (next.config.ts -> fallbacks.document):
// wird gezeigt, wenn eine Navigation offline fehlschlägt. Bewusst außerhalb von
// (app), damit weder Login noch Backend-Calls nötig sind.
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <WifiOff className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">Keine Verbindung</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Recur braucht eine Internetverbindung. Prüfe dein Netz und versuche es erneut.
      </p>
      <Button onClick={() => window.location.reload()}>Erneut versuchen</Button>
    </main>
  );
}
