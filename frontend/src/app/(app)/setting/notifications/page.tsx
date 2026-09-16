"use client";

import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import NotificationsPage from "@/components/pages/NotificationsPage";

export default function Page() {
  return (
    <ReactErrorBoundary
      errorMessage="Die Benachrichtigungseinstellungen konnten nicht angezeigt werden."
      fullScreen={false}
    >
      <NotificationsPage />
    </ReactErrorBoundary>
  );
}
