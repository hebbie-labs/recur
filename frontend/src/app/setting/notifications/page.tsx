"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DefaultLayout from "@/components/templates/DefaultLayout";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import NotificationsPage from "@/components/pages/NotificationsPage";

export default function Page() {
  return (
    <ProtectedRoute>
      <DefaultLayout pageTitle="Benachrichtigungen">
        <ReactErrorBoundary
          errorMessage="Die Benachrichtigungseinstellungen konnten nicht angezeigt werden."
          fullScreen={false}
        >
          <NotificationsPage />
        </ReactErrorBoundary>
      </DefaultLayout>
    </ProtectedRoute>
  );
}
