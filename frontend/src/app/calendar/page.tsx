"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DefaultLayout from "@/components/templates/DefaultLayout";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import CalendarGrid from "@/components/pages/CalendarPage";

export default function Page() {
  return (
    <ProtectedRoute>
      <DefaultLayout pageTitle="Dein Kalender">
        <ReactErrorBoundary
          errorMessage="Dein Kalender konnte nicht angezeigt werden."
          fullScreen={false}
        >
          <CalendarGrid />
        </ReactErrorBoundary>
      </DefaultLayout>
    </ProtectedRoute>
  );
}
