import { Moon, Palette, Sun } from "lucide-react";
import useDarkMode from "@/hooks/useDarkMode";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

function AppearanceSection() {
  const { isDark, toggleDark } = useDarkMode();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Farbschema</CardTitle>
          <CardDescription>
            Wähle, ob Recur im hellen oder dunklen Modus angezeigt wird.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant={!isDark ? "default" : "outline"}
            onClick={() => toggleDark(false)}
          >
            <Sun className="h-4 w-4" />
            Hell
          </Button>
          <Button
            variant={isDark ? "default" : "outline"}
            onClick={() => toggleDark(true)}
          >
            <Moon className="h-4 w-4" />
            Dunkel
          </Button>
        </CardContent>
      </Card>

      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Palette />
          </EmptyMedia>
          <EmptyTitle>Weitere Optionen</EmptyTitle>
          <EmptyDescription>
            Weitere Anpassungen am Erscheinungsbild sind noch nicht
            verfügbar und folgen später.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

export default AppearanceSection;
