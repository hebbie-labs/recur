import Image from "next/image";
import { Button } from "@/components/ui/button";
import googleLogo from "@/../../public/icons/google.svg";

const GOOGLE_AUTH_URL = "/oauth2/authorization/google";

function GoogleLoginButton() {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => {
        window.location.href = GOOGLE_AUTH_URL;
      }}
    >
      <Image
        src={googleLogo}
        className="flex relative mr-2"
        width={16}
        height={16}
        alt={"googleAlt"}
      />
      Mit Google anmelden
    </Button>
  );
}

export default GoogleLoginButton;
