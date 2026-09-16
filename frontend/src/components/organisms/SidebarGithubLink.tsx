import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import GithubIcon from "@/components/atoms/GithubIcon";
import { GITHUB_REPO_URL } from "@/constants/links";

function SidebarGithubLink() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="sm"
          className="text-muted-foreground"
          render={
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" />
          }
        >
          <GithubIcon className="h-4 w-4" />
          <span>GitHub</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default SidebarGithubLink;
