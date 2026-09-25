import { AlertCircle } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type AuthStatusCardProps = {
    status: "loading" | "error";
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
};

/** Full-page loading/error card shown while the app transitions the auth state (OAuth callback, logout, session expiry) before redirecting. */
function AuthStatusCard({ status, title, description, action }: AuthStatusCardProps) {
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
                    <CardTitle className="text-xl font-semibold tracking-tight">{title}</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">{description}</CardDescription>
                    {action && (
                        <Button className="w-full font-semibold" onClick={action.onClick}>
                            {action.label}
                        </Button>
                    )}
                </CardHeader>
            </Card>
        </div>
    );
}

export default AuthStatusCard;
