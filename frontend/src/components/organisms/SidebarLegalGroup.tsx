import { useRouter } from "next/navigation";
import { ChevronRight, Scale } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

const LEGAL_PAGES = [
  { label: "Impressum", path: "/impressum" },
  { label: "Datenschutz", path: "/datenschutz" },
  { label: "AGB", path: "/agb" },
] as const;

function SidebarLegalGroup() {
  const router = useRouter();

  return (
    <SidebarMenu>
      <Collapsible className="group/legal">
        <SidebarMenuItem>
          <CollapsibleTrigger
            render={
              <SidebarMenuButton className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                <Scale className="h-4 w-4" />
                <span>Rechtliches</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-open/legal:rotate-90" />
              </SidebarMenuButton>
            }
          />
          <CollapsibleContent>
            <SidebarMenuSub>
              {LEGAL_PAGES.map(({ label, path }) => (
                <SidebarMenuSubItem key={path}>
                  <SidebarMenuSubButton onClick={() => router.push(path)}>
                    <span>{label}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  );
}

export default SidebarLegalGroup;
