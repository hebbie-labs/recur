import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ReactErrorBoundary from "@/components/error/ReactErrorBoundary";
import { GITHUB_REPO_URL } from "@/constants/links";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { SETTINGS_SECTIONS } from "@/components/organisms/settings/settingsSections";

const LEGAL_PAGES = [
  { label: "Impressum", path: "/impressum" },
  { label: "Datenschutzerklärung", path: "/datenschutz" },
  { label: "AGB", path: "/agb" },
] as const;

// Auf Mobile drillbare Sections - ohne "legal": das verlinkt dort direkt auf
// die bestehenden Rechtsseiten statt eine eigene Zwischenseite zu haben.
const MOBILE_DRILLDOWN_SECTIONS = SETTINGS_SECTIONS.filter((s) => s.id !== "legal");

function SettingsRow({
  label,
  onClick,
  trailing,
}: {
  label: string;
  onClick: () => void;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-accent/50"
    >
      {label}
      {trailing ?? <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}

function SettingsRowGroup({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {children}
    </div>
  );
}

function MobileSettingsList() {
  const router = useRouter();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6">
      <SettingsRowGroup>
        {MOBILE_DRILLDOWN_SECTIONS.map(({ id, label }) => (
          <SettingsRow
            key={id}
            label={label}
            onClick={() => router.push(`/settings/${id}`)}
          />
        ))}
      </SettingsRowGroup>

      <SettingsRowGroup>
        {LEGAL_PAGES.map(({ label, path }) => (
          <SettingsRow key={path} label={label} onClick={() => router.push(path)} />
        ))}
      </SettingsRowGroup>

      <SettingsRowGroup>
        <SettingsRow
          label="GitHub"
          onClick={() => window.open(GITHUB_REPO_URL, "_blank", "noopener,noreferrer")}
          trailing={<ExternalLink className="h-4 w-4 text-muted-foreground" />}
        />
      </SettingsRowGroup>
    </div>
  );
}

function DesktopSettingsTabs() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <Tabs defaultValue={SETTINGS_SECTIONS[0].id}>
        <TabsList className="w-full overflow-x-auto">
          {SETTINGS_SECTIONS.map(({ id, label }) => (
            <TabsTrigger key={id} value={id}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SETTINGS_SECTIONS.map(({ id, errorMessage, Component }) => (
          <TabsContent key={id} value={id} className="mt-6">
            <ReactErrorBoundary variant="inline" errorMessage={errorMessage}>
              <Component />
            </ReactErrorBoundary>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function SettingsPage() {
  const isMobile = useBreakpoint() === "mobile";
  return isMobile ? <MobileSettingsList /> : <DesktopSettingsTabs />;
}

export default SettingsPage;
