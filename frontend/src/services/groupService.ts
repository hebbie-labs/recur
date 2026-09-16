import axios from "axios";
import api from "./api";

export interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  dateCreated: string;
  createdBy: GroupMember | null;
  members: GroupMember[];
}

export interface Project {
  id: string;
  name: string;
  dateCreated: string;
  isArchived: boolean;
}

export interface GroupInvitePreview {
  groupId: string;
  groupName: string;
  memberCount: number;
  alreadyMember: boolean;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string } | undefined)?.message ??
      fallback
    );
  }
  return fallback;
}

function getGroups(): Promise<Group[]> {
  return api
    .get("/group")
    .then((response) => response.data as Group[])
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Abrufen der Gruppen"));
    });
}

function createGroup(name: string): Promise<Group> {
  return api
    .post("/group", { name })
    .then((response) => response.data as Group)
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Erstellen der Gruppe"));
    });
}

function getGroup(groupId: string): Promise<Group> {
  return api
    .get(`/group/${groupId}`)
    .then((response) => response.data as Group)
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Abrufen der Gruppe"));
    });
}

function deleteGroup(groupId: string): Promise<void> {
  return api
    .delete(`/group/${groupId}`)
    .then(() => {})
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Löschen der Gruppe"));
    });
}

function leaveGroup(groupId: string, successorId?: string): Promise<void> {
  return api
    .post(`/group/${groupId}/leave`, null, {
      params: successorId ? { successorId } : undefined,
    })
    .then(() => {})
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Verlassen der Gruppe"));
    });
}

function removeMember(groupId: string, memberId: string): Promise<void> {
  return api
    .delete(`/group/${groupId}/members/${memberId}`)
    .then(() => {})
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Entfernen des Mitglieds"));
    });
}

function transferAdmin(groupId: string, newAdminId: string): Promise<Group> {
  return api
    .patch(`/group/${groupId}/admin`, null, { params: { newAdminId } })
    .then((response) => response.data as Group)
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Übertragen der Adminrolle"));
    });
}

function previewInvite(inviteCode: string): Promise<GroupInvitePreview> {
  return api
    .get(`/group/invite/${inviteCode}`)
    .then((response) => response.data as GroupInvitePreview)
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Einladungslink ungültig oder abgelaufen"));
    });
}

function joinGroup(inviteCode: string): Promise<Group> {
  return api
    .post(`/group/invite/${inviteCode}/join`)
    .then((response) => response.data as Group)
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Beitreten der Gruppe"));
    });
}

function getProjects(groupId: string): Promise<Project[]> {
  return api
    .get(`/group/${groupId}/project`)
    .then((response) => response.data as Project[])
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Abrufen der Projekte"));
    });
}

/** Projekte aller eigenen Gruppen in einem Request (Map von groupId auf Projekte), statt einem Request pro Gruppe. */
function getAllProjects(): Promise<Record<string, Project[]>> {
  return api
    .get(`/group/projects`)
    .then((response) => response.data as Record<string, Project[]>)
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Abrufen der Projekte"));
    });
}

function createProject(groupId: string, name: string): Promise<Project> {
  return api
    .post(`/group/${groupId}/project`, { name })
    .then((response) => response.data as Project)
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Erstellen des Projekts"));
    });
}

function patchProject(
  groupId: string,
  projectId: string,
  archived: boolean
): Promise<Project> {
  return api
    .patch(`/group/${groupId}/project/${projectId}`, null, {
      params: { archived },
    })
    .then((response) => response.data as Project)
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Aktualisieren des Projekts"));
    });
}

function deleteProject(groupId: string, projectId: string): Promise<void> {
  return api
    .delete(`/group/${groupId}/project/${projectId}`)
    .then(() => {})
    .catch((err: unknown) => {
      throw new Error(extractErrorMessage(err, "Fehler beim Löschen des Projekts"));
    });
}

export {
  getGroups,
  createGroup,
  getGroup,
  deleteGroup,
  leaveGroup,
  removeMember,
  transferAdmin,
  previewInvite,
  joinGroup,
  getProjects,
  getAllProjects,
  createProject,
  patchProject,
  deleteProject,
};
