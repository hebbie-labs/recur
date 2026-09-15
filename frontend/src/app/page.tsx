"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DefaultLayout from "@/components/templates/DefaultLayout";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import HomePage from "@/components/pages/HomePage";

export default function Page() {
  return (
    <ProtectedRoute>
      <DefaultLayout pageTitle="Deine Aufgaben">
        <ReactErrorBoundary
          errorMessage="Deine Aufgaben konnten nicht angezeigt werden."
          fullScreen={false}
        >
          <HomePage />
        </ReactErrorBoundary>
      </DefaultLayout>
    </ProtectedRoute>
  );
}
