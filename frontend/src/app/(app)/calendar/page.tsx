"use client";

import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import CalendarPage from "@/components/pages/CalendarPage";

export default function Page() {
  return (
    <ReactErrorBoundary
      errorMessage="Dein Kalender konnte nicht angezeigt werden."
      fullScreen={false}
    >
      <CalendarPage />
    </ReactErrorBoundary>
  );
}
