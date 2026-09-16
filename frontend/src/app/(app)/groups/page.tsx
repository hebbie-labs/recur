"use client";

import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import GroupsPage from "@/components/pages/GroupsPage";

export default function Page() {
  return (
    <ReactErrorBoundary
      errorMessage="Deine Gruppen konnten nicht angezeigt werden."
      fullScreen={false}
    >
      <GroupsPage />
    </ReactErrorBoundary>
  );
}
