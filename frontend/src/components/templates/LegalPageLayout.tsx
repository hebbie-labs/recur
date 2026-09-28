import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LegalPageLayoutProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

/** Gemeinsames Layout für öffentliche Rechtstexte (Impressum, Datenschutzerklärung): breiterer Lesefluss statt der schmalen zentrierten Card-Layouts von Login/Error, da diese Seiten aus mehreren Abschnitten mit Überschriften bestehen. */
function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-svh w-full justify-center bg-background px-4 py-8">
      <div className="w-full max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Button>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Stand: {lastUpdated}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 text-sm leading-relaxed text-foreground">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LegalPageLayout;
