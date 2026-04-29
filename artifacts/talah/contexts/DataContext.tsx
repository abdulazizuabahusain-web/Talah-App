import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  SEED_FEEDBACK,
  SEED_GROUPS,
  SEED_REPORTS,
  SEED_REQUESTS,
  SEED_USERS,
} from "@/lib/seed";
import { genId, loadJSON, saveJSON } from "@/lib/storage";
import type {
  FeedbackEntry,
  Group,
  GroupStatus,
  ReportEntry,
  TalahRequest,
  User,
} from "@/lib/types";

const K_USERS = "talah:users";
const K_REQ = "talah:requests";
const K_GROUPS = "talah:groups";
const K_FEEDBACK = "talah:feedback";
const K_REPORTS = "talah:reports";
const K_SEEDED = "talah:seeded:v1";

interface DataContextValue {
  ready: boolean;
  users: User[];
  requests: TalahRequest[];
  groups: Group[];
  feedback: FeedbackEntry[];
  reports: ReportEntry[];

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

  submitReport: (
    input: Omit<ReportEntry, "id" | "createdAt">,
  ) => Promise<void>;

  flagUser: (userId: string, flagged: boolean) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  saveUser: (user: User) => Promise<void>;

  groupsForUser: (userId: string) => Group[];
  requestsForUser: (userId: string) => TalahRequest[];
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<TalahRequest[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [reports, setReports] = useState<ReportEntry[]>([]);

  useEffect(() => {
    (async () => {
      const seeded = await loadJSON<boolean>(K_SEEDED, false);
      if (!seeded) {
        await saveJSON(K_USERS, SEED_USERS);
        await saveJSON(K_REQ, SEED_REQUESTS);
        await saveJSON(K_GROUPS, SEED_GROUPS);
        await saveJSON(K_FEEDBACK, SEED_FEEDBACK);
        await saveJSON(K_REPORTS, SEED_REPORTS);
        await saveJSON(K_SEEDED, true);
      }
      setUsers(await loadJSON<User[]>(K_USERS, SEED_USERS));
      setRequests(await loadJSON<TalahRequest[]>(K_REQ, SEED_REQUESTS));
      setGroups(await loadJSON<Group[]>(K_GROUPS, SEED_GROUPS));
      setFeedback(await loadJSON<FeedbackEntry[]>(K_FEEDBACK, SEED_FEEDBACK));
      setReports(await loadJSON<ReportEntry[]>(K_REPORTS, SEED_REPORTS));
      setReady(true);
    })();
  }, []);

  const persistUsers = useCallback(async (next: User[]) => {
    setUsers(next);
    await saveJSON(K_USERS, next);
  }, []);
  const persistRequests = useCallback(async (next: TalahRequest[]) => {
    setRequests(next);
    await saveJSON(K_REQ, next);
  }, []);
  const persistGroups = useCallback(async (next: Group[]) => {
    setGroups(next);
    await saveJSON(K_GROUPS, next);
  }, []);
  const persistFeedback = useCallback(async (next: FeedbackEntry[]) => {
    setFeedback(next);
    await saveJSON(K_FEEDBACK, next);
  }, []);
  const persistReports = useCallback(async (next: ReportEntry[]) => {
    setReports(next);
    await saveJSON(K_REPORTS, next);
  }, []);

  const createRequest = useCallback<DataContextValue["createRequest"]>(
    async (input) => {
      const r: TalahRequest = {
        id: genId("r"),
        status: "pending",
        createdAt: Date.now(),
        ...input,
      };
      await persistRequests([...requests, r]);
      return r;
    },
    [requests, persistRequests],
  );

  const cancelRequest = useCallback<DataContextValue["cancelRequest"]>(
    async (id) => {
      const next = requests.map((r) =>
        r.id === id ? { ...r, status: "cancelled" as const } : r,
      );
      await persistRequests(next);
    },
    [requests, persistRequests],
  );

  const createGroup = useCallback<DataContextValue["createGroup"]>(
    async (input) => {
      const g: Group = { id: genId("g"), createdAt: Date.now(), ...input };
      await persistGroups([...groups, g]);
      return g;
    },
    [groups, persistGroups],
  );

  const updateGroup = useCallback<DataContextValue["updateGroup"]>(
    async (id, patch) => {
      const next = groups.map((g) => (g.id === id ? { ...g, ...patch } : g));
      await persistGroups(next);
    },
    [groups, persistGroups],
  );

  const setGroupStatus = useCallback<DataContextValue["setGroupStatus"]>(
    async (id, status) => {
      const next = groups.map((g) => (g.id === id ? { ...g, status } : g));
      await persistGroups(next);
    },
    [groups, persistGroups],
  );

  const assignUserToGroup = useCallback<DataContextValue["assignUserToGroup"]>(
    async (groupId, userId) => {
      const next = groups.map((g) => {
        if (g.id !== groupId) return g;
        if (g.memberIds.includes(userId)) return g;
        return { ...g, memberIds: [...g.memberIds, userId] };
      });
      await persistGroups(next);
    },
    [groups, persistGroups],
  );

  const removeUserFromGroup = useCallback<
    DataContextValue["removeUserFromGroup"]
  >(
    async (groupId, userId) => {
      const next = groups.map((g) =>
        g.id === groupId
          ? { ...g, memberIds: g.memberIds.filter((m) => m !== userId) }
          : g,
      );
      await persistGroups(next);
    },
    [groups, persistGroups],
  );

  const submitFeedback = useCallback<DataContextValue["submitFeedback"]>(
    async (input) => {
      const f: FeedbackEntry = {
        id: genId("f"),
        createdAt: Date.now(),
        ...input,
      };
      await persistFeedback([...feedback, f]);
    },
    [feedback, persistFeedback],
  );

  const feedbackForGroup = useCallback(
    (groupId: string) => feedback.filter((f) => f.groupId === groupId),
    [feedback],
  );

  const submitReport = useCallback<DataContextValue["submitReport"]>(
    async (input) => {
      const r: ReportEntry = {
        id: genId("rep"),
        createdAt: Date.now(),
        ...input,
      };
      await persistReports([...reports, r]);
    },
    [reports, persistReports],
  );

  const flagUser = useCallback<DataContextValue["flagUser"]>(
    async (userId, flagged) => {
      const next = users.map((u) => (u.id === userId ? { ...u, flagged } : u));
      await persistUsers(next);
    },
    [users, persistUsers],
  );

  const removeUser = useCallback<DataContextValue["removeUser"]>(
    async (userId) => {
      const next = users.filter((u) => u.id !== userId);
      await persistUsers(next);
    },
    [users, persistUsers],
  );

  const saveUser = useCallback<DataContextValue["saveUser"]>(
    async (user) => {
      const exists = users.some((u) => u.id === user.id);
      const next = exists
        ? users.map((u) => (u.id === user.id ? user : u))
        : [...users, user];
      await persistUsers(next);
    },
    [users, persistUsers],
  );

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
      feedback,
      reports,
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
    }),
    [
      ready,
      users,
      requests,
      groups,
      feedback,
      reports,
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
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
