import { CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ResendVerificationForm from "@/components/molecules/ResendVerificationForm";
import { useVerifyEmail } from "@/hooks/useVerifyEmail";
import { useRouter } from "next/navigation";

const STATUS_CONTENT = {
    verified: {
        title: "E-Mail-Adresse bestätigt",
        description: "Deine E-Mail-Adresse wurde erfolgreich bestätigt. Du kannst dich jetzt anmelden.",
    },
    expired: {
        title: "Link abgelaufen",
        description: "Dieser Bestätigungslink ist abgelaufen. Fordere unten einen neuen an.",
    },
    invalid: {
        title: "Link ungültig",
        description: "Dieser Bestätigungslink ist ungültig oder wurde bereits verwendet.",
    },
} as const;

function VerifyEmailPage() {
    const { status } = useVerifyEmail();
    const router = useRouter();
    const content = STATUS_CONTENT[status];
    const isVerified = status === "verified";

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 bg-background px-4 py-8">
            <Card className="w-full max-w-sm border-none shadow-lg">
                <CardHeader className="flex flex-col items-center gap-3 text-center pb-2">
                    <div
                        className={
                            isVerified
                                ? "flex size-14 items-center justify-center rounded-full bg-primary/10"
                                : "flex size-14 items-center justify-center rounded-full bg-destructive/10"
                        }
                    >
                        {isVerified ? (
                            <CheckCircle2 className="size-7 text-primary" />
                        ) : (
                            <AlertCircle className="size-7 text-destructive" />
                        )}
                    </div>
                    <CardTitle className="text-xl font-semibold tracking-tight">
                        {content.title}
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        {content.description}
                    </CardDescription>
                    {isVerified ? (
                        <Button className="w-full font-semibold" onClick={() => router.push("/login")}>
                            Zum Login
                        </Button>
                    ) : (
                        <ResendVerificationForm className="w-full" />
                    )}
                </CardHeader>
            </Card>
        </div>
    );
}

export default VerifyEmailPage;
