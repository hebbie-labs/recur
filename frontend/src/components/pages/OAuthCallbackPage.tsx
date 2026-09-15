import { AlertCircle } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useOAuthCallback } from "@/hooks/useOAuthCallback";
import { useRouter } from "next/navigation";

function OAuthCallbackPage() {
    const { status, errorMessage } = useOAuthCallback();
    const router = useRouter();

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 bg-background px-4 py-8">
            <Card className="w-full max-w-sm border-none shadow-lg">
                <CardHeader className="flex flex-col items-center gap-3 text-center pb-2">
                    <div
                        className={
                            status === "error"
                                ? "flex size-14 items-center justify-center rounded-full bg-destructive/10"
                                : "flex size-14 items-center justify-center rounded-full bg-primary/10"
                        }
                    >
                        {status === "error" ? (
                            <AlertCircle className="size-7 text-destructive" />
                        ) : (
                            <Spinner className="size-7 text-primary" />
                        )}
                    </div>
                    <CardTitle className="text-xl font-semibold tracking-tight">
                        {status === "error" ? "Anmeldung fehlgeschlagen" : "Anmeldung läuft…"}
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        {status === "error"
                            ? errorMessage ?? "Beim Google-Login ist ein Fehler aufgetreten."
                            : "Du wirst gleich weitergeleitet."}
                    </CardDescription>
                    {status === "error" && (
                        <Button className="w-full font-semibold" onClick={() => router.push("/login")}>
                            Zurück zum Login
                        </Button>
                    )}
                </CardHeader>
            </Card>
        </div>
    );
}

export default OAuthCallbackPage;