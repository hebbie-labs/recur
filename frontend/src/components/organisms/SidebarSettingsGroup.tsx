import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import SidebarSettingsItem from "@/components/molecules/SidebarSettingsItem";
import type { LucideIcon } from "lucide-react";

type SidebarSettingsGroupProps = {
    SettingsItem: {
        label: string;
        Icon: LucideIcon;
        onClick: () => void;
    }[];
    };

function SidebarSettingsGroup({ SettingsItem }: SidebarSettingsGroupProps) {

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Einstellungen</SidebarGroupLabel>
                <Separator className="my-2" />
                    <SidebarMenu>
                            {SettingsItem.map((item, index) => (
                                <SidebarSettingsItem
                                    key={index}
                                    label={item.label}
                                    Icon={item.Icon}
                                    onClick={item.onClick}
                                />
                            ))}
                    </SidebarMenu>
        </SidebarGroup>
    );
}

export default SidebarSettingsGroup;