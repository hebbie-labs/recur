import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { LinkIcon, PlusIcon, TrashIcon, ArchiveIcon, ArchiveRestoreIcon, ShieldIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/atoms/loading/LoadingButton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import ConfirmDialog from "@/components/molecules/dialog/ConfirmDialog";
import CreateProjectDialog from "@/components/organisms/dialogs/CreateProjectDialog";
import SelectSuccessorDialog from "@/components/organisms/dialogs/SelectSuccessorDialog";
import { useGroupsContext } from "@/contexts/GroupsContext";
import { useTasksContext } from "@/contexts/TasksContext";
import { useAuth } from "@/contexts/AuthContext";
import { showErrorToast, showInfoToast, showSuccessToast } from "@/lib/toast";

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const {
    groups,
    projectsByGroupId,
    loading,
    leaveGroup,
    removeMember,
    transferAdmin,
    deleteGroup,
    patchProject,
    deleteProject,
  } = useGroupsContext();
  const { tasks } = useTasksContext();

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [confirmDeleteGroupOpen, setConfirmDeleteGroupOpen] = useState(false);
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);
  const [confirmTransferMemberId, setConfirmTransferMemberId] = useState<string | null>(null);
  const [leaveSuccessorDialogOpen, setLeaveSuccessorDialogOpen] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [transferringAdmin, setTransferringAdmin] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [togglingProjectId, setTogglingProjectId] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);

  // window.location.origin doesn't exist during Next's server-render pass
  // for this route (it's server-rendered on demand, not statically
  // prerendered) - starts empty and fills in once mounted client-side.
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    // Intentional: window.location.origin can only be read after mount -
    // no synchronous SSR-safe equivalent exists (unlike next/navigation's
    // searchParams, which Next provides consistently on both sides).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const group = groups.find((g) => g.id === id);
  const projects = useMemo(() => projectsByGroupId[id ?? ""] ?? [], [projectsByGroupId, id]);

  const activeTasksInGroup = useMemo(
    () => tasks.filter((t) => t.project && projects.some((p) => p.id === t.project!.id)),
    [tasks, projects]
  );

  // War die Gruppe schon mal da und ist jetzt (nach einem Auto-Sync-Poll) weg,
  // wurde sie von einem anderen Mitglied gelöscht oder man wurde selbst
  // entfernt - dann zurück zur Übersicht statt eine leere Seite zu zeigen.
  // Löscht/verlässt man die Gruppe selbst, verschwindet "group" genauso, daher
  // unterdrückt selfInitiatedRemovalRef den Hinweis für den eigenen Aktions-Flow
  // (der bereits seinen eigenen Erfolgs-Toast + router.push erledigt).
  const hadGroupRef = useRef(false);
  const selfInitiatedRemovalRef = useRef(false);
  useEffect(() => {
    if (group) {
      hadGroupRef.current = true;
      return;
    }
    if (!loading && hadGroupRef.current) {
      if (!selfInitiatedRemovalRef.current) {
        showInfoToast("Diese Gruppe ist nicht mehr verfügbar - sie wurde gelöscht oder du wurdest entfernt.");
        router.push("/groups");
      }
      hadGroupRef.current = false;
    }
  }, [group, loading, router]);

  if (!group || !id) {
    return null;
  }

  const inviteLink = `${origin}/groups/join/${group.inviteCode}`;
  const isAdmin = group.createdBy?.id === user?.id;
  const otherMembers = group.members.filter((m) => m.id !== user?.id);

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      showSuccessToast("Einladungslink kopiert.");
    } catch {
      showErrorToast("Link konnte nicht kopiert werden.");
    }
  };

  const handleLeaveConfirmed = async (successorId?: string) => {
    setLeavingGroup(true);
    try {
      selfInitiatedRemovalRef.current = true;
      await leaveGroup(id, successorId);
      router.push("/groups");
    } catch (err) {
      selfInitiatedRemovalRef.current = false;
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Verlassen der Gruppe.");
    } finally {
      setLeaveSuccessorDialogOpen(false);
      setLeavingGroup(false);
    }
  };

  const handleLeaveClick = () => {
    // Admin mit anderen Mitgliedern muss zuerst einen Nachfolger bestimmen -
    // ist er das letzte Mitglied, löscht das Verlassen direkt die ganze
    // Gruppe (das übernimmt das Backend).
    if (isAdmin && otherMembers.length > 0) {
      setLeaveSuccessorDialogOpen(true);
      return;
    }
    handleLeaveConfirmed();
  };

  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId);
    try {
      await removeMember(id, memberId);
      showSuccessToast("Mitglied entfernt.");
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Entfernen des Mitglieds.");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleTransferAdmin = async (memberId: string) => {
    setTransferringAdmin(true);
    try {
      await transferAdmin(id, memberId);
      showSuccessToast("Adminrolle übertragen.");
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Übertragen der Adminrolle.");
    } finally {
      setTransferringAdmin(false);
      setConfirmTransferMemberId(null);
    }
  };

  const handleDeleteGroup = async () => {
    setDeletingGroup(true);
    try {
      selfInitiatedRemovalRef.current = true;
      await deleteGroup(id);
      showSuccessToast("Gruppe gelöscht.");
      router.push("/groups");
    } catch (err) {
      selfInitiatedRemovalRef.current = false;
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Löschen der Gruppe.");
    } finally {
      setDeletingGroup(false);
      setConfirmDeleteGroupOpen(false);
    }
  };

  const handleToggleArchiveProject = async (projectId: string, currentlyArchived: boolean) => {
    setTogglingProjectId(projectId);
    try {
      await patchProject(id, projectId, !currentlyArchived);
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Aktualisieren des Projekts.");
    } finally {
      setTogglingProjectId(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setDeletingProject(true);
    try {
      await deleteProject(id, projectId);
      showSuccessToast("Projekt gelöscht.");
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Fehler beim Löschen des Projekts.");
    } finally {
      setDeletingProject(false);
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
          {group.members.map((member) => {
            const isSelf = member.id === user?.id;
            const isMemberAdmin = group.createdBy?.id === member.id;

            return (
              <div key={member.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarImage src={member.avatarUrl ?? undefined} />
                    <AvatarFallback>{initials(member.firstName, member.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {member.firstName} {member.lastName}
                      {isSelf && " (du)"}
                      {isMemberAdmin && (
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                          <ShieldIcon className="h-3 w-3" />
                          Admin
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isSelf ? (
                    <LoadingButton
                      variant="ghost"
                      size="sm"
                      onClick={handleLeaveClick}
                      loading={leavingGroup}
                    >
                      Verlassen
                    </LoadingButton>
                  ) : (
                    isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmTransferMemberId(member.id)}
                          disabled={removingMemberId === member.id}
                        >
                          Zum Admin machen
                        </Button>
                        <LoadingButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          loading={removingMemberId === member.id}
                        >
                          Entfernen
                        </LoadingButton>
                      </>
                    )
                  )}
                </div>
              </div>
            );
          })}
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
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <LoadingButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleArchiveProject(project.id, project.isArchived)}
                    loading={togglingProjectId === project.id}
                  >
                    {project.isArchived ? (
                      <ArchiveRestoreIcon className="h-4 w-4" />
                    ) : (
                      <ArchiveIcon className="h-4 w-4" />
                    )}
                  </LoadingButton>
                  {project.isArchived && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDeleteProjectId(project.id)}
                      disabled={togglingProjectId === project.id}
                    >
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {isAdmin && (
        <Button variant="destructive" onClick={() => setConfirmDeleteGroupOpen(true)}>
          <TrashIcon className="h-4 w-4" />
          Gruppe löschen
        </Button>
      )}

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
        loading={deletingGroup}
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
        loading={deletingProject}
      />

      {showCreateProject && (
        <CreateProjectDialog groupId={id} onClose={() => setShowCreateProject(false)} />
      )}

      <ConfirmDialog
        open={confirmTransferMemberId !== null}
        onOpenChange={(open) => !open && setConfirmTransferMemberId(null)}
        question="Adminrolle übertragen?"
        description={`${
          group.members.find((m) => m.id === confirmTransferMemberId)?.firstName ?? "Dieses Mitglied"
        } wird zum neuen Gruppen-Admin. Du verlierst dadurch deine Admin-Rechte in dieser Gruppe.`}
        onConfirm={() => confirmTransferMemberId && handleTransferAdmin(confirmTransferMemberId)}
        onCancel={() => setConfirmTransferMemberId(null)}
        confirmText="Übertragen"
        loading={transferringAdmin}
      />

      <SelectSuccessorDialog
        open={leaveSuccessorDialogOpen}
        onClose={() => setLeaveSuccessorDialogOpen(false)}
        members={otherMembers}
        title="Nachfolger bestimmen"
        description="Als Admin musst du zuerst ein anderes Mitglied zum neuen Admin bestimmen, bevor du die Gruppe verlassen kannst."
        submitLabel="Verlassen"
        onConfirm={handleLeaveConfirmed}
      />
    </div>
  );
}

export default GroupDetailPage;
