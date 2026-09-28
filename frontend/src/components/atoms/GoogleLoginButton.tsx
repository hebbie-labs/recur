import Image from "next/image";
import { Button } from "@/components/ui/button";
import googleLogo from "@/../../public/icons/google.svg";
import type { OAuth2Mode } from "@/types/auth";

const GOOGLE_AUTH_URL = "/oauth2/authorization/google";

type GoogleLoginButtonProps = {
  /** "register" lässt das Backend abbrechen statt einzuloggen, falls diese Google-Identität schon ein Konto hat (#236). */
  mode?: OAuth2Mode;
};

function GoogleLoginButton({ mode = "login" }: GoogleLoginButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => {
        window.location.href = `${GOOGLE_AUTH_URL}?mode=${mode}`;
      }}
    >
      <Image
        src={googleLogo}
        className="flex relative mr-2"
        width={16}
        height={16}
        alt={"googleAlt"}
      />
      {mode === "register" ? "Mit Google registrieren" : "Mit Google anmelden"}
    </Button>
  );
}

export default GoogleLoginButton;
