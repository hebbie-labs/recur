"use client";

import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import JoinGroupPage from "@/components/pages/JoinGroupPage";

export default function Page() {
  return (
    <ReactErrorBoundary
      errorMessage="Der Einladungslink konnte nicht verarbeitet werden."
      fullScreen={false}
    >
      <JoinGroupPage />
    </ReactErrorBoundary>
  );
}
