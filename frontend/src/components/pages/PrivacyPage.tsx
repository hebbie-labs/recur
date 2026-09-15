import { ShieldCheck } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

function PrivacyPage() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldCheck />
        </EmptyMedia>
        <EmptyTitle>Privatsphäre</EmptyTitle>
        <EmptyDescription>
          Einstellungen zur Privatsphäre sind noch nicht verfügbar. Diese
          Seite ist als Platzhalter angelegt und wird bald mit echten
          Optionen gefüllt.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default PrivacyPage;
