import { useEffect, useState } from "react";
import { api, clearToken, type Feedback, type Group, type MeetupRequest, type Report, type SyncStatus, type User } from "@/lib/api";
import UsersTab from "@/components/UsersTab";
import RequestsTab from "@/components/RequestsTab";
import GroupsTab from "@/components/GroupsTab";
import FeedbackTab from "@/components/FeedbackTab";
import ReportsTab from "@/components/ReportsTab";
import CompatibilityTab from "@/components/CompatibilityTab";

type Tab = "users" | "requests" | "groups" | "compatibility" | "feedback" | "reports";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "users", label: "Users", emoji: "👤" },
  { id: "requests", label: "Requests", emoji: "📋" },
  { id: "groups", label: "Groups", emoji: "🫂" },
  { id: "compatibility", label: "Compatibility", emoji: "⚡" },
  { id: "feedback", label: "Feedback", emoji: "⭐" },
  { id: "reports", label: "Reports", emoji: "🚩" },
];

const PAGE_SIZE = 50;

interface Data {
  users: User[];
  requests: MeetupRequest[];
  groups: Group[];
  feedback: Feedback[];
  reports: Report[];
}

interface HasMore {
  users: boolean;
  requests: boolean;
  groups: boolean;
}

interface Props {
  onLogout: () => void;
}

export default function DashboardPage({ onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("users");
  const [data, setData] = useState<Data>({
    users: [], requests: [], groups: [], feedback: [], reports: [],
  });
  const [hasMore, setHasMore] = useState<HasMore>({ users: false, requests: false, groups: false });
  const [loadingMore, setLoadingMore] = useState<Partial<Record<keyof HasMore, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncLoading, setSyncLoading] = useState(true);

  const loadSync = async (showSpinner = false) => {
    if (showSpinner) setSyncLoading(true);
    try {
      const status = await api.getSyncStatus();
      setSyncStatus(status);
    } catch {
      setSyncStatus({ ok: false, error: "Could not reach sync-status endpoint" });
    } finally {
      if (showSpinner) setSyncLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersPage, requestsPage, groupsPage, feedback, reports] = await Promise.all([
        api.getUsers({ limit: PAGE_SIZE, offset: 0 }),
        api.getRequests({ limit: PAGE_SIZE, offset: 0 }),
        api.getGroups({ limit: PAGE_SIZE, offset: 0 }),
        api.getFeedback(),
        api.getReports(),
      ]);
      setData({ users: usersPage.data, requests: requestsPage.data, groups: groupsPage.data, feedback, reports });
      setHasMore({ users: usersPage.hasMore, requests: requestsPage.hasMore, groups: groupsPage.hasMore });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async (entity: keyof HasMore) => {
    setLoadingMore((prev) => ({ ...prev, [entity]: true }));
    try {
      const offset = data[entity].length;
      const page = entity === "users"
        ? await api.getUsers({ limit: PAGE_SIZE, offset })
        : entity === "requests"
          ? await api.getRequests({ limit: PAGE_SIZE, offset })
          : await api.getGroups({ limit: PAGE_SIZE, offset });
      setData((prev) => ({ ...prev, [entity]: [...prev[entity], ...page.data] }));
      setHasMore((prev) => ({ ...prev, [entity]: page.hasMore }));
    } finally {
      setLoadingMore((prev) => ({ ...prev, [entity]: false }));
    }
  };

  useEffect(() => {
    load();
    loadSync(true);
    const syncInterval = setInterval(() => loadSync(false), 60_000);
    return () => clearInterval(syncInterval);
  }, []);

  const logout = () => {
    clearToken();
    onLogout();
  };

  const pendingRequests = data.requests.filter((r) => r.status === "pending").length;
  const flaggedUsers = data.users.filter((u) => u.flagged).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">ط</span>
            </div>
            <div>
              <h1 className="font-bold text-foreground leading-none">Tal'ah Admin</h1>
              <p className="text-xs text-muted-foreground">طلعة · Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pendingRequests > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold">
                {pendingRequests} pending
              </span>
            )}
            {flaggedUsers > 0 && (
              <span className="text-xs bg-destructive/15 text-destructive px-2.5 py-1 rounded-full font-semibold">
                {flaggedUsers} flagged
              </span>
            )}

            {/* GitHub Sync Status */}
            {syncLoading ? (
              <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-full border border-border flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />
                GitHub…
              </span>
            ) : syncStatus && syncStatus.ok ? (
              <a
                href={`https://github.com/abdulazizuabahusain-web/Talah-App/commit/${syncStatus.githubSha}`}
                target="_blank"
                rel="noreferrer"
                title={`Last sync: ${new Date(syncStatus.committedAt).toLocaleString()}\n${syncStatus.message}`}
                className="text-xs px-2.5 py-1 rounded-full border border-border flex items-center gap-1.5 hover:bg-muted transition-colors"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${syncStatus.upToDate ? "bg-green-500" : "bg-red-500"}`} />
                <span className="font-mono">{syncStatus.shortSha}</span>
                <span className="text-muted-foreground hidden sm:inline">
                  · {new Date(syncStatus.committedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </a>
            ) : (
              <span
                title={syncStatus && !syncStatus.ok ? syncStatus.error : "Unknown error"}
                className="text-xs px-2.5 py-1 rounded-full border border-destructive/40 bg-destructive/10 text-destructive flex items-center gap-1.5 cursor-default"
              >
                <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                Sync error
              </span>
            )}

            <button
              onClick={() => { load(); loadSync(true); }}
              className="text-sm px-3 py-1.5 rounded-xl border border-border hover:bg-muted transition-colors"
              title="Refresh"
            >
              ↻
            </button>
            <button
              onClick={logout}
              className="text-sm px-3 py-1.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Users", value: data.users.length, color: "bg-primary/10 text-primary" },
            { label: "Requests", value: data.requests.filter((r) => r.status === "pending").length, color: "bg-amber-100 text-amber-700" },
            { label: "Groups", value: data.groups.length, color: "bg-primary/10 text-primary" },
            { label: "Feedback", value: data.feedback.length, color: "bg-muted text-muted-foreground" },
            { label: "Reports", value: data.reports.length, color: "bg-destructive/15 text-destructive" },
            { label: "Onboarded", value: data.users.filter((u) => u.onboarded).length, color: "bg-primary/10 text-primary" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl p-3 text-center ${s.color}`}>
              <p className="text-2xl font-bold leading-none">{s.value}</p>
              <p className="text-xs font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-muted"}`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 mb-4">
            <p className="text-destructive text-sm">{error}</p>
            <button onClick={load} className="text-sm underline mt-1">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {tab === "users" && <UsersTab users={data.users} onRefresh={load} hasMore={hasMore.users} loadingMore={!!loadingMore.users} onLoadMore={() => loadMore("users")} />}
            {tab === "requests" && <RequestsTab requests={data.requests} users={data.users} onRefresh={load} hasMore={hasMore.requests} loadingMore={!!loadingMore.requests} onLoadMore={() => loadMore("requests")} />}
            {tab === "groups" && <GroupsTab groups={data.groups} users={data.users} onRefresh={load} hasMore={hasMore.groups} loadingMore={!!loadingMore.groups} onLoadMore={() => loadMore("groups")} />}
            {tab === "compatibility" && <CompatibilityTab users={data.users} requests={data.requests} onRefresh={load} />}
            {tab === "feedback" && <FeedbackTab feedback={data.feedback} users={data.users} />}
            {tab === "reports" && <ReportsTab reports={data.reports} users={data.users} />}
          </>
        )}
      </div>
    </div>
  );
}
