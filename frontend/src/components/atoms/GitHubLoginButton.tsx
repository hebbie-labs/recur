import Image from "next/image";
import { Button } from "@/components/ui/button";
import githubLogo from "@/../../public/icons/github.svg";
import type { OAuth2Mode } from "@/types/auth";
import { startOAuthLogin } from "@/utils/startOAuthLogin";

type GitHubLoginButtonProps = {
  /** "register" lässt das Backend abbrechen statt einzuloggen, falls diese GitHub-Identität schon ein Konto hat (#236). */
  mode?: OAuth2Mode;
};

function GitHubLoginButton({ mode = "login" }: GitHubLoginButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => startOAuthLogin("github", mode)}
    >
      <Image
        src={githubLogo}
        className="flex relative mr-2"
        width={16}
        height={16}
        alt={"githubAlt"}
      />
      {mode === "register" ? "Mit GitHub registrieren" : "Mit GitHub anmelden"}
    </Button>
  );
}

export default GitHubLoginButton;
