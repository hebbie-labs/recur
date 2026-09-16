"use client";

import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import CalendarGrid from "@/components/pages/CalendarPage";

export default function Page() {
  return (
    <ReactErrorBoundary
      errorMessage="Dein Kalender konnte nicht angezeigt werden."
      fullScreen={false}
    >
      <CalendarGrid />
    </ReactErrorBoundary>
  );
}
