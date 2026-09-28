"use client";

import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import SettingsPage from "@/components/pages/SettingsPage";

export default function Page() {
  return (
    <ReactErrorBoundary
      errorMessage="Die Einstellungen konnten nicht angezeigt werden."
      fullScreen={false}
    >
      <SettingsPage />
    </ReactErrorBoundary>
  );
}
