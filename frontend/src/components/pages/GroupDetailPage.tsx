import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LinkIcon, PlusIcon, TrashIcon, ArchiveIcon, ArchiveRestoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import ConfirmDialog from "@/components/molecules/ConfirmDialog";
import CreateProjectDialog from "@/components/organisms/CreateProjectDialog";
import { useGroupsContext } from "@/contexts/GroupsContext";
import { useTasksContext } from "@/contexts/TasksContext";
import { useAuth } from "@/contexts/AuthContext";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, projectsByGroupId, leaveGroup, removeMember, deleteGroup, patchProject, deleteProject } =
    useGroupsContext();
  const { tasks } = useTasksContext();

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [confirmDeleteGroupOpen, setConfirmDeleteGroupOpen] = useState(false);
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);

  const group = groups.find((g) => g.id === id);
  const projects = useMemo(() => projectsByGroupId[id ?? ""] ?? [], [projectsByGroupId, id]);

  const activeTasksInGroup = useMemo(
    () => tasks.filter((t) => t.project && projects.some((p) => p.id === t.project!.id)),
    [tasks, projects]
  );

  if (!group || !id) {
    return null;
  }

  const inviteLink = `${window.location.origin}/groups/join/${group.inviteCode}`;

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      showSuccessToast("Einladungslink kopiert.");
    } catch {
      showErrorToast("Link konnte nicht kopiert werden.");
    }
  };

  const handleRemoveOrLeave = async (memberId: string) => {
    try {
      if (memberId === user?.id) {
        await leaveGroup(id);
        navigate("/groups");
        return;
      }
      await removeMember(id, memberId);
      showSuccessToast("Mitglied entfernt.");
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Entfernen des Mitglieds.");
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(id);
      showSuccessToast("Gruppe gelöscht.");
      navigate("/groups");
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Löschen der Gruppe.");
    } finally {
      setConfirmDeleteGroupOpen(false);
    }
  };

  const handleToggleArchiveProject = async (projectId: string, currentlyArchived: boolean) => {
    try {
      await patchProject(id, projectId, !currentlyArchived);
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Aktualisieren des Projekts.");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(id, projectId);
      showSuccessToast("Projekt gelöscht.");
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Löschen des Projekts.");
    } finally {
      setConfirmDeleteProjectId(null);
    }
  };

  return (
    <div className="w-full pb-20 flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <span className="font-semibold">Einladungslink</span>
          <Button variant="outline" size="sm" onClick={handleCopyInviteLink}>
            <LinkIcon className="h-4 w-4" />
            Link kopieren
          </Button>
        </CardHeader>
        <CardContent>
          <p className="break-all text-sm text-muted-foreground">{inviteLink}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <span className="font-semibold">
            Mitglieder ({group.members.length})
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {group.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  <AvatarImage src={member.avatarUrl ?? undefined} />
                  <AvatarFallback>{initials(member.firstName, member.lastName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {member.firstName} {member.lastName}
                    {member.id === user?.id && " (du)"}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleRemoveOrLeave(member.id)}>
                {member.id === user?.id ? "Verlassen" : "Entfernen"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <span className="font-semibold">Projekte</span>
          <Button size="sm" onClick={() => setShowCreateProject(true)}>
            <PlusIcon className="h-4 w-4" />
            Neues Projekt
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground">Noch keine Projekte in dieser Gruppe.</p>
          )}
          {projects.map((project) => (
            <div key={project.id} className="flex items-center justify-between gap-3">
              <span className={project.isArchived ? "text-sm text-muted-foreground line-through" : "text-sm"}>
                {project.name}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleArchiveProject(project.id, project.isArchived)}
                >
                  {project.isArchived ? (
                    <ArchiveRestoreIcon className="h-4 w-4" />
                  ) : (
                    <ArchiveIcon className="h-4 w-4" />
                  )}
                </Button>
                {project.isArchived && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDeleteProjectId(project.id)}
                  >
                    <TrashIcon className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <Button variant="destructive" onClick={() => setConfirmDeleteGroupOpen(true)}>
        <TrashIcon className="h-4 w-4" />
        Gruppe löschen
      </Button>

      <ConfirmDialog
        severity="high"
        open={confirmDeleteGroupOpen}
        onOpenChange={setConfirmDeleteGroupOpen}
        question="Gruppe wirklich löschen?"
        description={
          activeTasksInGroup.length > 0
            ? `Es werden auch alle ${projects.length} Projekte und ${activeTasksInGroup.length} noch aktive(n) Task(s) unwiderruflich gelöscht: ${activeTasksInGroup
                .map((t) => t.name)
                .join(", ")}.`
            : `Es werden auch alle ${projects.length} Projekte dieser Gruppe unwiderruflich gelöscht.`
        }
        onConfirm={handleDeleteGroup}
        onCancel={() => setConfirmDeleteGroupOpen(false)}
        confirmText="Gruppe löschen"
      />

      <ConfirmDialog
        severity="high"
        open={confirmDeleteProjectId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteProjectId(null)}
        question="Projekt wirklich löschen?"
        description="Das Projekt und alle zugehörigen Tasks werden unwiderruflich gelöscht."
        onConfirm={() => confirmDeleteProjectId && handleDeleteProject(confirmDeleteProjectId)}
        onCancel={() => setConfirmDeleteProjectId(null)}
        confirmText="Projekt löschen"
      />

      {showCreateProject && (
        <CreateProjectDialog groupId={id} onClose={() => setShowCreateProject(false)} />
      )}
    </div>
  );
}

export default GroupDetailPage;
