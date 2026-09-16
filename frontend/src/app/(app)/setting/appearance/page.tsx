"use client";

import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import AppearancePage from "@/components/pages/AppearancePage";

export default function Page() {
  return (
    <ReactErrorBoundary
      errorMessage="Die Erscheinungsbild-Einstellungen konnten nicht angezeigt werden."
      fullScreen={false}
    >
      <AppearancePage />
    </ReactErrorBoundary>
  );
}
