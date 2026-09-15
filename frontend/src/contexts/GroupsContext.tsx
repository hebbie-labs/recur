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
  getProjects,
  createProject as createProjectApi,
  patchProject as patchProjectApi,
  deleteProject as deleteProjectApi,
  type Group,
  type Project,
} from "@/services/groupService";
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
  leaveGroup: (groupId: string) => Promise<void>;
  removeMember: (groupId: string, memberId: string) => Promise<void>;
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
    const fetchedGroups = await getGroups();
    const projectEntries = await Promise.all(
      fetchedGroups.map(async (group) => {
        const projects = await getProjects(group.id);
        return [group.id, projects] as const;
      })
    );
    return {
      fetchedGroups,
      fetchedProjectsByGroupId: Object.fromEntries(projectEntries),
    };
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const { fetchedGroups, fetchedProjectsByGroupId } = await loadGroupsAndProjects();
      setGroups(fetchedGroups);
      setProjectsByGroupId(fetchedProjectsByGroupId);
    } catch (err) {
      showBoundary(err);
    } finally {
      setLoading(false);
    }
  }, [showBoundary, loadGroupsAndProjects]);

  // Auto-Sync-Poll: Gruppen/Projekte haben kein updatedAt, daher reicht ein
  // simples Ersetzen statt Merge - anders als bei Tasks gibt es hier keine
  // langlebigen optimistischen lokalen Updates, die dadurch verloren gehen könnten.
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
    async (groupId: string) => {
      await leaveGroupApi(groupId);
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
