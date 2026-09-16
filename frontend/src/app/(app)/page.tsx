"use client";

import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import HomePage from "@/components/pages/HomePage";

export default function Page() {
  return (
    <ReactErrorBoundary
      errorMessage="Deine Aufgaben konnten nicht angezeigt werden."
      fullScreen={false}
    >
      <HomePage />
    </ReactErrorBoundary>
  );
}
