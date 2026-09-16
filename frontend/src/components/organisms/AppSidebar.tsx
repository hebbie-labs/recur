import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";

import type { NavigationDestination } from "@/hooks/useNavigationBar";
import { useNavigationBar } from "@/hooks/useNavigationBar";
import { useRouter } from "next/navigation";
import AppSidebarUser from "@/components/organisms/AppSidebarUser";
import SidebarNavigation from "@/components/molecules/SidebarNavigation";
import SidebarBrand from "@/components/molecules/SidebarBrand";
import SidebarLegalGroup from "@/components/organisms/SidebarLegalGroup";
import SidebarGithubLink from "@/components/organisms/SidebarGithubLink";
import { Bell, Palette, ShieldCheck, ClipboardPaste } from "lucide-react";
import SidebarSettingsGroup from "./SidebarSettingsGroup";
import { useAuth } from "@/contexts/AuthContext";
import { useImportQuartalsplan } from "@/contexts/ImportQuartalsplanContext";

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

  const settingsItems = [
    {
      label: "Benachrichtigungen",
      Icon: Bell,
      onClick: () => {
        router.push("/setting/notifications");
      },
    },
    {
      label: "Erscheinungsbild",
      Icon: Palette,
      onClick: () => {
        router.push("/setting/appearance");
      },
    },
    {
      label: "Privatsphäre",
      Icon: ShieldCheck,
      onClick: () => {
        router.push("/setting/privacy");
      },
    },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarBrand onClick={() => router.push("/")} />
      <SidebarContent>
        <SidebarNavigation
          destinations={navDestinations}
          handleNavigation={handleNavigation}
          activeValue={activeValue}
        />
        <SidebarSettingsGroup SettingsItem={settingsItems} />
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
