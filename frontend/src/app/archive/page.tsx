"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DefaultLayout from "@/components/templates/DefaultLayout";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import ArchivePage from "@/components/pages/ArchivePage";

export default function Page() {
  return (
    <ProtectedRoute>
      <DefaultLayout pageTitle="Dein Archiv">
        <ReactErrorBoundary
          errorMessage="Dein Archiv konnte nicht angezeigt werden."
          fullScreen={false}
        >
          <ArchivePage />
        </ReactErrorBoundary>
      </DefaultLayout>
    </ProtectedRoute>
  );
}
