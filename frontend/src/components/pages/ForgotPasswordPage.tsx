import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import LegalFooterLinks from "@/components/molecules/LegalFooterLinks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Passwort-Reset ist vorübergehend deaktiviert (#128): der Link würde ohnehin
// nie ankommen, da noreply@recur.dpdns.org auf der Spamhaus DBL gelistet ist
// (#126). Statt des Anfrage-Formulars zeigt diese Seite nur den Hinweis.
export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background w-full h-full px-4 py-8">
      <Card className="w-full max-w-md border-none shadow-lg">
        <CardHeader className="flex flex-col items-center gap-3 text-center pb-2">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-7 text-destructive" />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight">
            Passwort-Reset aktuell nicht verfügbar
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Diese Funktion ist vorübergehend deaktiviert. Bitte wende dich
            direkt an den Support, um dein Passwort zurückzusetzen.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6 pt-0">
          <Button
            variant="link"
            className="p-0"
            onClick={() => router.push("/login")}
          >
            Zurück zum Login
          </Button>
        </CardContent>
      </Card>
      <LegalFooterLinks />
    </div>
  );
}
