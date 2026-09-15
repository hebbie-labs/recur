import { Bell } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

function NotificationsPage() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Bell />
        </EmptyMedia>
        <EmptyTitle>Benachrichtigungen</EmptyTitle>
        <EmptyDescription>
          Einstellungen für Benachrichtigungen sind noch nicht verfügbar.
          Diese Seite ist als Platzhalter angelegt und wird bald mit echten
          Optionen gefüllt.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default NotificationsPage;
