"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DefaultLayout from "@/components/templates/DefaultLayout";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import AccountPage from "@/components/pages/AccountPage";

export default function Page() {
  return (
    <ProtectedRoute>
      <DefaultLayout pageTitle="Account">
        <ReactErrorBoundary
          errorMessage="Dein Account konnte nicht angezeigt werden."
          fullScreen={false}
        >
          <AccountPage />
        </ReactErrorBoundary>
      </DefaultLayout>
    </ProtectedRoute>
  );
}
