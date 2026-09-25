import { useParams, redirect } from "next/navigation";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import { SETTINGS_SECTIONS } from "@/components/organisms/settings/settingsSections";

function SettingsSectionPage() {
  const { section: sectionId } = useParams<{ section: string }>();
  // "legal" hat auf Mobile keine eigene Zwischenseite - die Rows in
  // SettingsPage.tsx verlinken dafür direkt auf /impressum, /datenschutz, /agb.
  const section = SETTINGS_SECTIONS.find((s) => s.id === sectionId && s.id !== "legal");

  if (!section) {
    redirect("/settings");
  }

  const { Component, errorMessage } = section;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <ReactErrorBoundary variant="inline" errorMessage={errorMessage}>
        <Component />
      </ReactErrorBoundary>
    </div>
  );
}

export default SettingsSectionPage;
