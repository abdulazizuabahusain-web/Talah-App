import { useEffect, useState } from "react";
import { api, clearToken, type Feedback, type Group, type MeetupRequest, type Report, type User } from "@/lib/api";
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

interface Data {
  users: User[];
  requests: MeetupRequest[];
  groups: Group[];
  feedback: Feedback[];
  reports: Report[];
}

interface Props {
  onLogout: () => void;
}

export default function DashboardPage({ onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("users");
  const [data, setData] = useState<Data>({
    users: [], requests: [], groups: [], feedback: [], reports: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, requests, groups, feedback, reports] = await Promise.all([
        api.getUsers(),
        api.getRequests(),
        api.getGroups(),
        api.getFeedback(),
        api.getReports(),
      ]);
      setData({ users, requests, groups, feedback, reports });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
            <button
              onClick={load}
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
            {tab === "users" && <UsersTab users={data.users} onRefresh={load} />}
            {tab === "requests" && <RequestsTab requests={data.requests} users={data.users} onRefresh={load} />}
            {tab === "groups" && <GroupsTab groups={data.groups} users={data.users} onRefresh={load} />}
            {tab === "compatibility" && <CompatibilityTab users={data.users} />}
            {tab === "feedback" && <FeedbackTab feedback={data.feedback} users={data.users} />}
            {tab === "reports" && <ReportsTab reports={data.reports} users={data.users} />}
          </>
        )}
      </div>
    </div>
  );
}
