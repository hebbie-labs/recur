import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useErrorBoundary } from "react-error-boundary";
import {
  getGroups,
  createGroup as createGroupApi,
  deleteGroup as deleteGroupApi,
  leaveGroup as leaveGroupApi,
  removeMember as removeMemberApi,
  transferAdmin as transferAdminApi,
  getAllProjects,
  createProject as createProjectApi,
  patchProject as patchProjectApi,
  deleteProject as deleteProjectApi,
  type Group,
  type Project,
} from "@/services/groupService";
import { isUnauthorized } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

type GroupsContextValue = {
  groups: Group[];
  projectsByGroupId: Record<string, Project[]>;
  loading: boolean;
  fetchGroups: () => Promise<void>;
  /** Für den Auto-Sync-Poll: kein loading-Flicker, wirft bei Fehler statt showBoundary. */
  syncGroups: () => Promise<void>;
  createGroup: (name: string) => Promise<Group>;
  deleteGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string, successorId?: string) => Promise<void>;
  removeMember: (groupId: string, memberId: string) => Promise<void>;
  transferAdmin: (groupId: string, newAdminId: string) => Promise<Group>;
  createProject: (groupId: string, name: string) => Promise<Project>;
  patchProject: (
    groupId: string,
    projectId: string,
    archived: boolean
  ) => Promise<Project>;
  deleteProject: (groupId: string, projectId: string) => Promise<void>;
};

const GroupsContext = createContext<GroupsContextValue | null>(null);

export function GroupsProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [projectsByGroupId, setProjectsByGroupId] = useState<
    Record<string, Project[]>
  >({});
  const [loading, setLoading] = useState(true);
  const { showBoundary } = useErrorBoundary();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const loadGroupsAndProjects = useCallback(async () => {
    // Zwei Requests statt einem pro Gruppe: getAllProjects() liefert die
    // Projekte aller eigenen Gruppen gebündelt (siehe GroupController#getProjectsForMyGroups).
    const [fetchedGroups, fetchedProjectsByGroupId] = await Promise.all([
      getGroups(),
      getAllProjects(),
    ]);
    return { fetchedGroups, fetchedProjectsByGroupId };
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const { fetchedGroups, fetchedProjectsByGroupId } = await loadGroupsAndProjects();
      setGroups(fetchedGroups);
      setProjectsByGroupId(fetchedProjectsByGroupId);
    } catch (err) {
      // Ein 401 heisst nur "nicht (mehr) authentifiziert" - z.B. eine
      // Logout-Race - das behandelt der globale Auth-Flow bereits, kein Fall
      // für den Error-Boundary-Crash (siehe TasksContext.fetchTasks).
      if (isUnauthorized(err)) {
        setGroups([]);
        setProjectsByGroupId({});
      } else {
        showBoundary(err);
      }
    } finally {
      setLoading(false);
    }
  }, [showBoundary, loadGroupsAndProjects]);

  // Auto-Sync-Poll: Gruppen/Projekte haben kein updatedAt, daher reicht ein
  // simples Ersetzen statt Merge wie bei TasksContext.mergeTasks - aktuell setzt
  // jede Mutation hier (createGroup, deleteGroup, leaveGroup, removeMember,
  // createProject, patchProject, deleteProject) den State erst NACH dem await
  // der Server-Antwort, es gibt also keine langlebige optimistische Änderung,
  // die ein zwischenzeitlicher Poll überschreiben könnte.
  // ACHTUNG: Wer hier eine optimistische Änderung VOR dem await einbaut (z.B.
  // ein sofortiges Projekt-Rename in der UI), MUSS vorher entweder ein
  // updatedAt auf Group/Project einführen und hier per Timestamp mergen
  // (siehe mergeTasks in TasksContext.tsx), oder syncGroups so anpassen, dass
  // es diese eine Änderung gezielt schont - sonst überschreibt der nächste
  // 15s-Poll die optimistische Änderung wieder.
  const syncGroups = useCallback(async () => {
    const { fetchedGroups, fetchedProjectsByGroupId } = await loadGroupsAndProjects();
    setGroups(fetchedGroups);
    setProjectsByGroupId(fetchedProjectsByGroupId);
  }, [loadGroupsAndProjects]);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      // Intentional: reset local state in response to the AuthContext
      // singleton logging out, not derivable during render - there's no
      // per-user instance of this provider to key-remount instead.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGroups([]);
      setProjectsByGroupId({});
      setLoading(false);
      return;
    }

    fetchGroups();
  }, [isAuthenticated, isAuthLoading, fetchGroups]);

  const createGroup = useCallback(
    async (name: string) => {
      const group = await createGroupApi(name);
      setGroups((prev) => [...prev, group]);
      setProjectsByGroupId((prev) => ({ ...prev, [group.id]: [] }));
      return group;
    },
    []
  );

  const removeGroupFromProjectsMap = useCallback(
    (prev: Record<string, Project[]>, groupId: string) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => key !== groupId)),
    []
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      await deleteGroupApi(groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      setProjectsByGroupId((prev) => removeGroupFromProjectsMap(prev, groupId));
    },
    [removeGroupFromProjectsMap]
  );

  const leaveGroup = useCallback(
    async (groupId: string, successorId?: string) => {
      await leaveGroupApi(groupId, successorId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      setProjectsByGroupId((prev) => removeGroupFromProjectsMap(prev, groupId));
    },
    [removeGroupFromProjectsMap]
  );

  const removeMember = useCallback(async (groupId: string, memberId: string) => {
    await removeMemberApi(groupId, memberId);
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, members: g.members.filter((m) => m.id !== memberId) }
          : g
      )
    );
  }, []);

  const transferAdmin = useCallback(async (groupId: string, newAdminId: string) => {
    const updated = await transferAdminApi(groupId, newAdminId);
    setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)));
    return updated;
  }, []);

  const createProject = useCallback(async (groupId: string, name: string) => {
    const project = await createProjectApi(groupId, name);
    setProjectsByGroupId((prev) => ({
      ...prev,
      [groupId]: [...(prev[groupId] ?? []), project],
    }));
    return project;
  }, []);

  const patchProject = useCallback(
    async (groupId: string, projectId: string, archived: boolean) => {
      const updated = await patchProjectApi(groupId, projectId, archived);
      setProjectsByGroupId((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] ?? []).map((p) =>
          p.id === projectId ? updated : p
        ),
      }));
      return updated;
    },
    []
  );

  const deleteProject = useCallback(async (groupId: string, projectId: string) => {
    await deleteProjectApi(groupId, projectId);
    setProjectsByGroupId((prev) => ({
      ...prev,
      [groupId]: (prev[groupId] ?? []).filter((p) => p.id !== projectId),
    }));
  }, []);

  const value: GroupsContextValue = {
    groups,
    projectsByGroupId,
    loading,
    fetchGroups,
    syncGroups,
    createGroup,
    deleteGroup,
    leaveGroup,
    removeMember,
    transferAdmin,
    createProject,
    patchProject,
    deleteProject,
  };

  return (
    <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>
  );
}

export function useGroupsContext() {
  const ctx = useContext(GroupsContext);
  if (!ctx) {
    throw new Error("useGroupsContext muss innerhalb von GroupsProvider verwendet werden");
  }
  return ctx;
}
