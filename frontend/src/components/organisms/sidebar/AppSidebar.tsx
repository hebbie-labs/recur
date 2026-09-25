import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";

import type { NavigationDestination } from "@/hooks/useNavigationBar";
import { useNavigationBar } from "@/hooks/useNavigationBar";
import type { SidebarNavGroup } from "@/hooks/useSidebarNavGroups";
import { useRouter } from "next/navigation";
import AppSidebarUser from "@/components/organisms/sidebar/AppSidebarUser";
import SidebarNavigation from "@/components/molecules/sidebar/SidebarNavigation";
import SidebarBrand from "@/components/molecules/sidebar/SidebarBrand";
import SidebarLegalGroup from "@/components/organisms/sidebar/SidebarLegalGroup";
import SidebarGithubLink from "@/components/organisms/sidebar/SidebarGithubLink";
import {
  ClipboardPaste,
  ListChecks,
  Calendar,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useImportQuartalsplan } from "@/contexts/ImportQuartalsplanContext";

// Ordnet die flachen Navigationsziele (aus DefaultLayout + die hier ergänzte
// Import-Aktion) thematischen Ordnern zu. Reihenfolge/Zuordnung final
// abgestimmt in Issue #132.
const NAV_GROUP_DEFINITIONS = [
  {
    key: "tasks",
    label: "Habits",
    icon: ListChecks,
    paths: ["/", "/favorites", "/archive"],
  },
  {
    key: "planung",
    label: "Planung",
    icon: Calendar,
    paths: ["/calendar"],
  },
  {
    key: "zusammenarbeit",
    label: "Zusammenarbeit",
    icon: Users,
    paths: ["/groups", "__import-quartalsplan__"],
  },
] as const;

function buildNavGroups(
  destinations: NavigationDestination[],
): SidebarNavGroup[] {
  return NAV_GROUP_DEFINITIONS.map(({ key, label, icon, paths }) => ({
    key,
    label,
    icon,
    destinations: paths
      .map((path) => destinations.find((d) => d.path === path))
      .filter((d): d is NavigationDestination => d !== undefined),
  }));
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  destinations: NavigationDestination[];
};

function AppSidebar({ destinations, ...props }: AppSidebarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { openImportQuartalsplan } = useImportQuartalsplan();

  const navDestinations: NavigationDestination[] = [
    ...destinations,
    {
      path: "__import-quartalsplan__",
      navigate: openImportQuartalsplan,
      label: "Quartalsplan importieren",
      icon: ClipboardPaste,
    },
  ];

  const { activeValue, handleNavigation } = useNavigationBar(navDestinations);
  const navGroups = buildNavGroups(navDestinations);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarBrand onClick={() => router.push("/")} />
      <SidebarContent>
        <SidebarNavigation
          groups={navGroups}
          handleNavigation={handleNavigation}
          activeValue={activeValue}
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarLegalGroup />
        <SidebarGithubLink />
        <AppSidebarUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
