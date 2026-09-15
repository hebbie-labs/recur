"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DefaultLayout from "@/components/templates/DefaultLayout";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import PrivacyPage from "@/components/pages/PrivacyPage";

export default function Page() {
  return (
    <ProtectedRoute>
      <DefaultLayout pageTitle="Privatsphäre">
        <ReactErrorBoundary
          errorMessage="Die Privatsphäre-Einstellungen konnten nicht angezeigt werden."
          fullScreen={false}
        >
          <PrivacyPage />
        </ReactErrorBoundary>
      </DefaultLayout>
    </ProtectedRoute>
  );
}
