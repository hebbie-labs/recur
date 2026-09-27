"use client";

import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import ArchivePage from "@/components/pages/ArchivePage";

export default function Page() {
  return (
    <ReactErrorBoundary
      errorMessage="Dein Archiv konnte nicht angezeigt werden."
      fullScreen={false}
    >
      <ArchivePage />
    </ReactErrorBoundary>
  );
}
