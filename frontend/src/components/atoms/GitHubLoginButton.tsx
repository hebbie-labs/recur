import Image from "next/image";
import { Button } from "@/components/ui/button";
import githubLogo from "@/../../public/icons/github.svg";

const GITHUB_AUTH_URL = "/oauth2/authorization/github";

function GitHubLoginButton() {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => {
        window.location.href = GITHUB_AUTH_URL;
      }}
    >
      <Image
        src={githubLogo}
        className="flex relative mr-2"
        width={16}
        height={16}
        alt={"githubAlt"}
      />
      Mit GitHub anmelden
    </Button>
  );
}

export default GitHubLoginButton;
