import { ChevronRight } from "lucide-react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { SidebarNavGroup } from "@/hooks/useSidebarNavGroups";
import { useSidebarNavGroups } from "@/hooks/useSidebarNavGroups";

type SidebarNavigationProps = {
  groups: SidebarNavGroup[];
  handleNavigation: (path: string) => void;
  activeValue: string;
};

function SidebarNavigation({
  groups,
  handleNavigation,
  activeValue,
}: SidebarNavigationProps) {
  const { openGroupKey, openGroup } = useSidebarNavGroups(
    groups,
    activeValue,
  );

  return (
    <SidebarGroup>
      <SidebarMenu>
        {groups.map((group) => {
          const isOpen = openGroupKey === group.key;

          return (
            <Collapsible
              key={group.key}
              open={isOpen}
              onOpenChange={(open) => {
                if (open) openGroup(group.key);
              }}
              className="group/nav-group"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton className="rounded-lg px-3 py-2 my-1 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                      <group.icon className="h-4 w-4" />
                      <span>{group.label}</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-open/nav-group:rotate-90" />
                    </SidebarMenuButton>
                  }
                />
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {group.destinations.map((destination) => (
                      <SidebarMenuSubItem key={destination.path}>
                        <SidebarMenuSubButton
                          isActive={activeValue === destination.path}
                          onClick={() => handleNavigation(destination.path)}
                        >
                          <destination.icon className="h-4 w-4" />
                          <span>{destination.label}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export default SidebarNavigation;
