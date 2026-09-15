"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DefaultLayout from "@/components/templates/DefaultLayout";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import FavoritesPage from "@/components/pages/FavoritesPage";

export default function Page() {
  return (
    <ProtectedRoute>
      <DefaultLayout pageTitle="Deine Favoriten">
        <ReactErrorBoundary
          errorMessage="Deine Favoriten konnten nicht angezeigt werden."
          fullScreen={false}
        >
          <FavoritesPage />
        </ReactErrorBoundary>
      </DefaultLayout>
    </ProtectedRoute>
  );
}
