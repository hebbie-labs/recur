"use client";

import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import SettingsSectionPage from "@/components/pages/SettingsSectionPage";

export default function Page() {
  return (
    <ReactErrorBoundary
      errorMessage="Die Einstellungen konnten nicht angezeigt werden."
      fullScreen={false}
    >
      <SettingsSectionPage />
    </ReactErrorBoundary>
  );
}
