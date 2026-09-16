"use client";

import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import PrivacyPage from "@/components/pages/PrivacyPage";

export default function Page() {
  return (
    <ReactErrorBoundary
      errorMessage="Die Privatsphäre-Einstellungen konnten nicht angezeigt werden."
      fullScreen={false}
    >
      <PrivacyPage />
    </ReactErrorBoundary>
  );
}
