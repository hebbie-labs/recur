import { useState } from "react";
import { useRouter } from "next/navigation";
import { UsersIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Empty from "@/components/molecules/Empty";
import CreateGroupDialog from "@/components/organisms/CreateGroupDialog";
import { useGroupsContext } from "@/contexts/GroupsContext";

function GroupsPage() {
  const router = useRouter();
  const { groups, loading } = useGroupsContext();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (loading) return null;

  return (
    <div className="w-full pb-20">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowCreateDialog(true)}>
          <PlusIcon className="h-4 w-4" />
          Neue Gruppe
        </Button>
      </div>

      {groups.length === 0 ? (
        <Empty
          title="Noch keine Gruppen"
          description="Erstelle eine Gruppe, um Tasks für ein Gruppenprojekt mit anderen zu teilen."
          buttonText="Neue Gruppe erstellen"
          onButtonClick={() => setShowCreateDialog(true)}
          icon={() => <UsersIcon className="h-12 w-12 text-muted-foreground" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => router.push(`/groups/${group.id}`)}
            >
              <CardHeader className="flex flex-row items-center gap-2">
                <UsersIcon className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">{group.name}</span>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {group.members.length}{" "}
                  {group.members.length === 1 ? "Mitglied" : "Mitglieder"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateDialog && (
        <CreateGroupDialog
          onClose={() => setShowCreateDialog(false)}
          onCreated={(group) => router.push(`/groups/${group.id}`)}
        />
      )}
    </div>
  );
}

export default GroupsPage;
