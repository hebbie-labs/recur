"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DefaultLayout from "@/components/templates/DefaultLayout";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import JoinGroupPage from "@/components/pages/JoinGroupPage";

export default function Page() {
  return (
    <ProtectedRoute>
      <DefaultLayout pageTitle="Gruppe beitreten">
        <ReactErrorBoundary
          errorMessage="Der Einladungslink konnte nicht verarbeitet werden."
          fullScreen={false}
        >
          <JoinGroupPage />
        </ReactErrorBoundary>
      </DefaultLayout>
    </ProtectedRoute>
  );
}
