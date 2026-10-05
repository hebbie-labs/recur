import { Download } from "lucide-react";
import useInstallPrompt from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Rendert nichts, wenn die App schon installiert ist oder der Browser keine
// Installation anbietet - dann gibt es nichts, was der Nutzer tun könnte.
function InstallAppCard() {
  const { canInstall, showIosHint, promptInstall } = useInstallPrompt();

  if (!canInstall && !showIosHint) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>App installieren</CardTitle>
        <CardDescription>
          Recur als eigene App mit Icon und eigenem Fenster nutzen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {canInstall ? (
          <Button onClick={promptInstall}>
            <Download className="h-4 w-4" />
            App installieren
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tippe in Safari auf „Teilen“ und wähle „Zum Home-Bildschirm“.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default InstallAppCard;
