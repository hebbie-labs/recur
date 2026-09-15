import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { previewInvite, joinGroup } from "@/services/groupService";
import type { GroupInvitePreview } from "@/services/groupService";
import { useGroupsContext } from "@/contexts/GroupsContext";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

function JoinGroupPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { fetchGroups } = useGroupsContext();

  const [preview, setPreview] = useState<GroupInvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    previewInvite(code)
      .then(setPreview)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Einladungslink ungültig.")
      )
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = async () => {
    if (!code) return;
    setJoining(true);
    try {
      const group = await joinGroup(code);
      await fetchGroups();
      showSuccessToast(`Du bist der Gruppe "${group.name}" beigetreten.`);
      router.push(`/groups/${group.id}`);
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Beitreten der Gruppe.");
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (error || !preview) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="py-6 text-center text-sm text-destructive">
          {error ?? "Einladungslink ungültig."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="flex flex-col items-center gap-2">
        <UsersIcon className="h-10 w-10 text-muted-foreground" />
        <span className="text-lg font-semibold">{preview.groupName}</span>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">
          {preview.memberCount} {preview.memberCount === 1 ? "Mitglied" : "Mitglieder"}
        </p>

        {preview.alreadyMember ? (
          <Button onClick={() => router.push(`/groups/${preview.groupId}`)}>
            Du bist bereits Mitglied - zur Gruppe
          </Button>
        ) : (
          <Button onClick={handleJoin} disabled={joining}>
            {joining ? "Trete bei..." : "Gruppe beitreten"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default JoinGroupPage;
