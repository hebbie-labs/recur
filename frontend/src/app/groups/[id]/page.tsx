"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DefaultLayout from "@/components/templates/DefaultLayout";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import GroupDetailPage from "@/components/pages/GroupDetailPage";

export default function Page() {
  return (
    <ProtectedRoute>
      <DefaultLayout pageTitle="Gruppendetails">
        <ReactErrorBoundary
          errorMessage="Die Gruppe konnte nicht angezeigt werden."
          fullScreen={false}
        >
          <GroupDetailPage />
        </ReactErrorBoundary>
      </DefaultLayout>
    </ProtectedRoute>
  );
}
