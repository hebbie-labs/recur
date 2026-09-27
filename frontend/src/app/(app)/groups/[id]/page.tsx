"use client";

import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import GroupDetailPage from "@/components/pages/GroupDetailPage";

export default function Page() {
  return (
    <ReactErrorBoundary
      errorMessage="Die Gruppe konnte nicht angezeigt werden."
      fullScreen={false}
    >
      <GroupDetailPage />
    </ReactErrorBoundary>
  );
}
