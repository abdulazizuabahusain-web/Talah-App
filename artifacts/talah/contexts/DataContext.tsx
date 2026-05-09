import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useApp } from "@/contexts/AppContext";
import { api, toGroup, toRequest, toUser } from "@/lib/api";
import { genId, loadJSON, saveJSON } from "@/lib/storage";
import type {
  FeedbackEntry,
  Group,
  GroupStatus,
  ReportEntry,
  TalahRequest,
  User,
} from "@/lib/types";

interface DataContextValue {
  ready: boolean;
  users: User[];
  requests: TalahRequest[];
  groups: Group[];
  feedback: FeedbackEntry[];
  reports: ReportEntry[];
  error: string | null;
  clearError: () => void;

  createRequest: (
    input: Omit<TalahRequest, "id" | "status" | "createdAt">,
  ) => Promise<TalahRequest>;
  cancelRequest: (id: string) => Promise<void>;

  createGroup: (input: Omit<Group, "id" | "createdAt">) => Promise<Group>;
  updateGroup: (id: string, patch: Partial<Group>) => Promise<void>;
  setGroupStatus: (id: string, status: GroupStatus) => Promise<void>;
  assignUserToGroup: (groupId: string, userId: string) => Promise<void>;
  removeUserFromGroup: (groupId: string, userId: string) => Promise<void>;

  submitFeedback: (
    input: Omit<FeedbackEntry, "id" | "createdAt">,
  ) => Promise<void>;
  feedbackForGroup: (groupId: string) => FeedbackEntry[];

  submitReport: (input: Omit<ReportEntry, "id" | "createdAt">) => Promise<void>;

  flagUser: (userId: string, flagged: boolean) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  saveUser: (user: User) => Promise<void>;

  groupsForUser: (userId: string) => Group[];
  requestsForUser: (userId: string) => TalahRequest[];

  refresh: () => Promise<void>;
}

const DATA_CACHE_KEY = "talah:data-cache";

type DataCache = {
  requests: TalahRequest[];
  groups: Group[];
  users: User[];
  cachedAt: number;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, ready: appReady, signOut } = useApp();

  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<TalahRequest[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);

  const readError = useCallback((err: unknown, fallback: string): string => {
    return err instanceof Error ? err.message : fallback;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const loadCachedData = useCallback(async () => {
    const cached = await loadJSON<DataCache | null>(DATA_CACHE_KEY, null);
    if (!cached) return;
    setRequests(cached.requests);
    setGroups(cached.groups);
    setUsers(cached.users);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [rawRequests, rawGroups] = await Promise.all([
        api.getRequests(),
        api.getGroups(),
      ]);

      setRequests(rawRequests.map(toRequest));

      const converted = rawGroups.map(toGroup);
      setGroups(converted.map(({ _members: _, ...g }) => g));

      // Collect unique member profiles from all groups
      const memberMap: Record<string, User> = {};
      converted.forEach(({ _members }) => {
        _members.forEach((u) => {
          memberMap[u.id] = u;
        });
      });
      const nextUsers = Object.values(memberMap);
      setUsers(nextUsers);
      await saveJSON<DataCache>(DATA_CACHE_KEY, {
        requests: rawRequests.map(toRequest),
        groups: converted.map(({ _members: _, ...g }) => g),
        users: nextUsers,
        cachedAt: Date.now(),
      });
      setError(null);
    } catch (err) {
      await loadCachedData();
      setError(readError(err, "Could not refresh your Tal'ah data."));
    }
  }, [loadCachedData, readError]);

  useEffect(() => {
    if (!appReady) return;
    if (!currentUser) {
      setRequests([]);
      setGroups([]);
      setUsers([]);
      setError(null);
      saveJSON<DataCache | null>(DATA_CACHE_KEY, null);
      setReady(true);
      return;
    }
    setReady(false);
    loadCachedData().finally(() => {
      fetchAll().finally(() => setReady(true));
    });
  }, [appReady, currentUser?.id, fetchAll, loadCachedData]);

  const refresh = useCallback(async () => {
    if (currentUser) await fetchAll();
  }, [currentUser, fetchAll]);

  // ── User requests ──────────────────────────────────────────────────────────

  const createRequest = useCallback<DataContextValue["createRequest"]>(
    async (input) => {
      const created = await api.createRequest({
        meetupType: input.meetupType,
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
        area: input.area,
      });
      const r = toRequest(created);
      setRequests((prev) => [...prev, r]);
      setError(null);
      return r;
    },
    [],
  );

  const cancelRequest = useCallback<DataContextValue["cancelRequest"]>(
    async (id) => {
      await api.cancelRequest(id);
      setError(null);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "cancelled" as const } : r,
        ),
      );
    },
    [],
  );

  // ── Feedback & reports ─────────────────────────────────────────────────────

  const submitFeedback = useCallback<DataContextValue["submitFeedback"]>(
    async (input) => {
      await api.submitFeedback({
        groupId: input.groupId,
        rating: input.rating,
        connections: input.connections,
        wouldMeetAgain: input.wouldMeetAgain,
        comment: input.comment,
      });
      setError(null);
    },
    [],
  );

  const feedbackForGroup = useCallback(
    (_groupId: string): FeedbackEntry[] => [],
    [],
  );

  const submitReport = useCallback<DataContextValue["submitReport"]>(
    async (input) => {
      await api.submitReport({
        targetUserId: input.targetUserId,
        groupId: input.groupId,
        reason: input.reason,
      });
      setError(null);
    },
    [],
  );

  // ── Account deletion ────────────────────────────────────────────────────────

  const removeUser = useCallback<DataContextValue["removeUser"]>(
    async (_userId) => {
      await api.deleteMe();
      setError(null);
      await signOut();
    },
    [signOut],
  );

  // ── Admin-only stubs (mobile admin panel removed — use web dashboard) ───────

  const createGroup = useCallback<DataContextValue["createGroup"]>(
    async (input) => {
      const stub: Group = { id: genId("g"), createdAt: Date.now(), ...input };
      return stub;
    },
    [],
  );

  const updateGroup = useCallback<DataContextValue["updateGroup"]>(
    async (_id, _patch) => {
      /* admin only */
    },
    [],
  );

  const setGroupStatus = useCallback<DataContextValue["setGroupStatus"]>(
    async (_id, _status) => {
      /* admin only */
    },
    [],
  );

  const assignUserToGroup = useCallback<DataContextValue["assignUserToGroup"]>(
    async (_groupId, _userId) => {
      /* admin only */
    },
    [],
  );

  const removeUserFromGroup = useCallback<
    DataContextValue["removeUserFromGroup"]
  >(async (_groupId, _userId) => {
    /* admin only */
  }, []);

  const flagUser = useCallback<DataContextValue["flagUser"]>(
    async (_userId, _flagged) => {
      /* admin only */
    },
    [],
  );

  const saveUser = useCallback<DataContextValue["saveUser"]>(async (_user) => {
    /* admin only */
  }, []);

  // ── Derived helpers ────────────────────────────────────────────────────────

  const groupsForUser = useCallback(
    (userId: string) => groups.filter((g) => g.memberIds.includes(userId)),
    [groups],
  );

  const requestsForUser = useCallback(
    (userId: string) => requests.filter((r) => r.userId === userId),
    [requests],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      ready,
      users,
      requests,
      groups,
      feedback: [],
      reports: [],
      error,
      clearError,
      createRequest,
      cancelRequest,
      createGroup,
      updateGroup,
      setGroupStatus,
      assignUserToGroup,
      removeUserFromGroup,
      submitFeedback,
      feedbackForGroup,
      submitReport,
      flagUser,
      removeUser,
      saveUser,
      groupsForUser,
      requestsForUser,
      refresh,
    }),
    [
      ready,
      users,
      requests,
      groups,
      error,
      clearError,
      createRequest,
      cancelRequest,
      createGroup,
      updateGroup,
      setGroupStatus,
      assignUserToGroup,
      removeUserFromGroup,
      submitFeedback,
      feedbackForGroup,
      submitReport,
      flagUser,
      removeUser,
      saveUser,
      groupsForUser,
      requestsForUser,
      refresh,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
