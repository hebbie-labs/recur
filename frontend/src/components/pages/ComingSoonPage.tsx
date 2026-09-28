import { TerminalIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LegalFooterLinks from "@/components/molecules/LegalFooterLinks";
import GithubIcon from "@/components/atoms/GithubIcon";
import { GITHUB_REPO_URL } from "@/constants/links";

/** Öffentliche Platzhalterseite für www./main, solange die eigentliche App nur unter dev./prod läuft - siehe proxy.ts (COMING_SOON_MODE gate). */
function ComingSoonPage() {
    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 bg-background px-4 py-8">
            <Card className="w-full max-w-sm border-none shadow-lg">
                <CardHeader className="flex flex-col items-center gap-4 text-center pb-2">
                    <div className="flex size-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <TerminalIcon className="size-7" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                            Recur
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Just Habits.
                        </CardDescription>
                    </div>
                    <div className="flex flex-col items-center gap-2 pt-4">
                        <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                            Bald verfügbar
                        </span>
                        <p className="text-base text-muted-foreground">
                            Wir bauen gerade an Recur – einem einfachen Habit- und
                            Task-Tracker. Schau bald wieder vorbei.
                        </p>
                    </div>
                </CardHeader>
            </Card>
            <LegalFooterLinks />
            <Button
                variant="outline"
                size="icon-lg"
                className="rounded-full"
                aria-label="Sourcecode auf GitHub ansehen"
                nativeButton={false}
                render={
                    <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" />
                }
            >
                <GithubIcon className="size-5" />
            </Button>
        </div>
    );
}

export default ComingSoonPage;
