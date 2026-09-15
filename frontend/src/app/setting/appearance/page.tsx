"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DefaultLayout from "@/components/templates/DefaultLayout";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import AppearancePage from "@/components/pages/AppearancePage";

export default function Page() {
  return (
    <ProtectedRoute>
      <DefaultLayout pageTitle="Erscheinungsbild">
        <ReactErrorBoundary
          errorMessage="Die Erscheinungsbild-Einstellungen konnten nicht angezeigt werden."
          fullScreen={false}
        >
          <AppearancePage />
        </ReactErrorBoundary>
      </DefaultLayout>
    </ProtectedRoute>
  );
}
