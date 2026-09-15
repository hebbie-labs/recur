import {SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { NavigationDestination } from "@/hooks/useNavigationBar";
import { Separator } from "@/components/ui/separator";

type SidebarButtonsProps = {
    destinations: NavigationDestination[];
    handleNavigation: (path: string) => void;
    activeValue: string;
};

function SidebarNavigation({ destinations, handleNavigation, activeValue }: SidebarButtonsProps) {
    return (
        <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <Separator className="my-2" />
            <SidebarMenu>
                {destinations.map((destination) => (
                    <SidebarMenuItem key={destination.path}>
                        <SidebarMenuButton
                            isActive={activeValue === destination.path}
                            onClick={() => handleNavigation(destination.path)}
                            tooltip={destination.label}
                            className="rounded-lg px-3 py-2 my-1 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                            <destination.icon className="h-4 w-4" />
                            <span>{destination.label}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
        
    );  
}

export default SidebarNavigation;