"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DefaultLayout from "@/components/templates/DefaultLayout";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import GroupsPage from "@/components/pages/GroupsPage";

export default function Page() {
  return (
    <ProtectedRoute>
      <DefaultLayout pageTitle="Deine Gruppen">
        <ReactErrorBoundary
          errorMessage="Deine Gruppen konnten nicht angezeigt werden."
          fullScreen={false}
        >
          <GroupsPage />
        </ReactErrorBoundary>
      </DefaultLayout>
    </ProtectedRoute>
  );
}
