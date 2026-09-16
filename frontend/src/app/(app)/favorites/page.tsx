"use client";

import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import FavoritesPage from "@/components/pages/FavoritesPage";

export default function Page() {
  return (
    <ReactErrorBoundary
      errorMessage="Deine Favoriten konnten nicht angezeigt werden."
      fullScreen={false}
    >
      <FavoritesPage />
    </ReactErrorBoundary>
  );
}
