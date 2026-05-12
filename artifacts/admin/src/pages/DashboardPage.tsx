import { useEffect, useRef, useState } from "react";
import { GitCommitHorizontal, X } from "lucide-react";
import { api, clearToken, type Feedback, type Group, type MeetupRequest, type Report, type SyncStatus, type User, type AnalyticsOverview, type AnalyticsFunnel } from "@/lib/api";
import UsersTab from "@/components/UsersTab";
import RequestsTab from "@/components/RequestsTab";
import GroupsTab from "@/components/GroupsTab";
import FeedbackTab from "@/components/FeedbackTab";
import ReportsTab from "@/components/ReportsTab";
import CompatibilityTab from "@/components/CompatibilityTab";
import AnalyticsTab from "@/components/AnalyticsTab";

type Tab = "analytics" | "users" | "requests" | "groups" | "compatibility" | "feedback" | "reports";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "analytics", label: "Analytics", emoji: "📈" },
  { id: "users", label: "Users", emoji: "👤" },
  { id: "requests", label: "Requests", emoji: "📋" },
  { id: "groups", label: "Groups", emoji: "🫂" },
  { id: "compatibility", label: "Compatibility", emoji: "⚡" },
  { id: "feedback", label: "Feedback", emoji: "⭐" },
  { id: "reports", label: "Reports", emoji: "🚩" },
];

const PAGE_SIZE = 50;
const DATA_INTERVAL_MS = 5 * 60_000;

interface Data {
  users: User[];
  requests: MeetupRequest[];
  groups: Group[];
  feedback: Feedback[];
  reports: Report[];
  analyticsOverview: AnalyticsOverview | null;
  analyticsFunnel: AnalyticsFunnel | null;
}

interface HasMore {
  users: boolean;
  requests: boolean;
  groups: boolean;
}

interface Props {
  onLogout: () => void;
}

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatAwayTime(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatHHMM(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage({ onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("analytics");
  const [data, setData] = useState<Data>({
    users: [], requests: [], groups: [], feedback: [], reports: [], analyticsOverview: null, analyticsFunnel: null,
  });
  const [hasMore, setHasMore] = useState<HasMore>({ users: false, requests: false, groups: false });
  const [loadingMore, setLoadingMore] = useState<Partial<Record<keyof HasMore, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncLoading, setSyncLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secsLeft, setSecsLeft] = useState<number | null>(null);
  const [refreshedJustNow, setRefreshedJustNow] = useState(false);
  const [badgeDismissing, setBadgeDismissing] = useState(false);
  const [badgeProgressKey, setBadgeProgressKey] = useState(0);
  const [awayMins, setAwayMins] = useState(0);
  const [awayDepartedAt, setAwayDepartedAt] = useState<Date | null>(null);
  const [awayReturnedAt, setAwayReturnedAt] = useState<Date | null>(null);

  const [badgePaused, setBadgePaused] = useState(false);
  const [syncPopoverOpen, setSyncPopoverOpen] = useState(false);
  const [syncPopoverClosing, setSyncPopoverClosing] = useState(false);
  const syncPopoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nextRefreshAtRef = useRef<number | null>(null);
  const catchupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenAtRef = useRef<number | null>(null);
  const badgeTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const badgeTouchPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeTimerStartRef = useRef<number | null>(null);
  const badgePausedElapsedRef = useRef<number>(0);
  const badgeSpanRef = useRef<HTMLSpanElement>(null);
  const syncPopoverRef = useRef<HTMLDivElement>(null);

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

  const load = async (silent = false, catchup = false, awayMinutes = 0) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [usersPage, requestsPage, groupsPage, feedback, reports, analyticsOverview, analyticsFunnel] = await Promise.all([
        api.getUsers({ limit: PAGE_SIZE, offset: 0 }),
        api.getRequests({ limit: PAGE_SIZE, offset: 0 }),
        api.getGroups({ limit: PAGE_SIZE, offset: 0 }),
        api.getFeedback(),
        api.getReports(),
        api.getAnalyticsOverview(),
        api.getAnalyticsFunnel(),
      ]);
      setData({ users: usersPage.data, requests: requestsPage.data, groups: groupsPage.data, feedback, reports, analyticsOverview, analyticsFunnel });
      setHasMore({ users: usersPage.hasMore, requests: requestsPage.hasMore, groups: groupsPage.hasMore });
      setLastUpdated(new Date());
      nextRefreshAtRef.current = Date.now() + DATA_INTERVAL_MS;
      setSecsLeft(Math.round(DATA_INTERVAL_MS / 1000));
      if (catchup) {
        if (badgeDismissTimerRef.current) {
          clearTimeout(badgeDismissTimerRef.current);
          badgeDismissTimerRef.current = null;
        }
        setBadgeDismissing(false);
        setBadgePaused(false);
        setRefreshedJustNow(true);
        setBadgeProgressKey((k) => k + 1);
        if (catchupTimeoutRef.current) clearTimeout(catchupTimeoutRef.current);
        badgeTimerStartRef.current = Date.now();
        badgePausedElapsedRef.current = 0;
        catchupTimeoutRef.current = setTimeout(() => dismissCatchupBadge(), 4_000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const dismissCatchupBadge = () => {
    if (catchupTimeoutRef.current) clearTimeout(catchupTimeoutRef.current);
    if (badgeDismissTimerRef.current) clearTimeout(badgeDismissTimerRef.current);
    if (badgeTouchPauseTimerRef.current) {
      clearTimeout(badgeTouchPauseTimerRef.current);
      badgeTouchPauseTimerRef.current = null;
    }
    setBadgeDismissing(true);
    setBadgePaused(false);
    badgeDismissTimerRef.current = setTimeout(() => {
      setRefreshedJustNow(false);
      setBadgeDismissing(false);
      badgeDismissTimerRef.current = null;
    }, 250);
  };

  const handleBadgeMouseEnter = () => {
    if (badgePaused) return;
    const stretchElapsed = Date.now() - (badgeTimerStartRef.current ?? Date.now());
    badgePausedElapsedRef.current += stretchElapsed;
    if (catchupTimeoutRef.current) {
      clearTimeout(catchupTimeoutRef.current);
      catchupTimeoutRef.current = null;
    }
    setBadgePaused(true);
  };

  const handleBadgeMouseLeave = () => {
    if (!badgePaused) return;
    const remaining = Math.max(0, 4_000 - badgePausedElapsedRef.current);
    badgeTimerStartRef.current = Date.now();
    if (remaining > 0) {
      catchupTimeoutRef.current = setTimeout(() => dismissCatchupBadge(), remaining);
    } else {
      dismissCatchupBadge();
      return;
    }
    setBadgePaused(false);
  };

  const handleBadgeFocusOut = (e: React.FocusEvent<HTMLSpanElement>) => {
    if (badgeSpanRef.current?.contains(e.relatedTarget as Node | null)) return;
    handleBadgeMouseLeave();
  };

  const closeSyncPopover = () => {
    if (syncPopoverCloseTimerRef.current) clearTimeout(syncPopoverCloseTimerRef.current);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setSyncPopoverOpen(false);
      setSyncPopoverClosing(false);
      return;
    }
    setSyncPopoverClosing(true);
    syncPopoverCloseTimerRef.current = setTimeout(() => {
      setSyncPopoverOpen(false);
      setSyncPopoverClosing(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (syncPopoverCloseTimerRef.current) clearTimeout(syncPopoverCloseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!syncPopoverOpen) return;
    const handleOutside = (e: PointerEvent) => {
      if (syncPopoverRef.current && !syncPopoverRef.current.contains(e.target as Node)) {
        closeSyncPopover();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSyncPopover();
    };
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [syncPopoverOpen]);

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

    let syncInterval: ReturnType<typeof setInterval> | null = null;
    let dataInterval: ReturnType<typeof setInterval> | null = null;
    let tickInterval: ReturnType<typeof setInterval> | null = null;

    const startIntervals = () => {
      if (syncInterval !== null || dataInterval !== null) return;
      syncInterval = setInterval(() => loadSync(false), 60_000);
      dataInterval = setInterval(() => load(true), DATA_INTERVAL_MS);
      tickInterval = setInterval(() => {
        if (nextRefreshAtRef.current !== null) {
          const s = Math.max(0, Math.floor((nextRefreshAtRef.current - Date.now()) / 1000));
          setSecsLeft(s);
        }
      }, 1000);
    };

    const stopIntervals = () => {
      if (syncInterval !== null) clearInterval(syncInterval);
      if (dataInterval !== null) clearInterval(dataInterval);
      if (tickInterval !== null) clearInterval(tickInterval);
      syncInterval = null;
      dataInterval = null;
      tickInterval = null;
    };

    if (!document.hidden) {
      startIntervals();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        stopIntervals();
      } else {
        const returnedAt = new Date();
        const elapsed = hiddenAtRef.current !== null ? Date.now() - hiddenAtRef.current : 0;
        const mins = Math.floor(elapsed / 60_000);
        setAwayMins(mins);
        setAwayDepartedAt(hiddenAtRef.current !== null ? new Date(hiddenAtRef.current) : null);
        setAwayReturnedAt(returnedAt);
        hiddenAtRef.current = null;
        loadSync(false);
        load(true, true, mins); // catchup=true → shows "↻ refreshed" badge on success
        startIntervals();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopIntervals();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (catchupTimeoutRef.current) clearTimeout(catchupTimeoutRef.current);
      if (badgeDismissTimerRef.current) clearTimeout(badgeDismissTimerRef.current);
      if (badgeTouchPauseTimerRef.current) clearTimeout(badgeTouchPauseTimerRef.current);
    };
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

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 justify-end">
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

            {/* GitHub Sync + PAT — mobile: collapsed icon button; desktop: full badges */}

            {/* === MOBILE: icon button + popover (hidden on sm+) === */}
            <div className="relative sm:hidden" ref={syncPopoverRef}>
              <button
                onClick={() => { if (syncPopoverOpen) { closeSyncPopover(); } else { setSyncPopoverOpen(true); setSyncPopoverClosing(false); } }}
                aria-label="Sync and PAT status"
                title="Sync and PAT status"
                aria-expanded={syncPopoverOpen}
                className="p-1.5 rounded-full border border-border flex items-center gap-1 hover:bg-muted transition-colors"
              >
                <span className="relative flex items-center">
                  <GitCommitHorizontal className="w-4 h-4 text-muted-foreground" />
                  <span
                    className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-background flex-shrink-0 ${
                      syncLoading
                        ? "bg-muted-foreground/40 animate-pulse"
                        : syncStatus?.ok
                          ? syncStatus.upToDate ? "bg-green-500" : "bg-red-500"
                          : "bg-destructive"
                    }`}
                  />
                </span>
                {syncStatus?.ok && syncStatus.patDaysLeft !== undefined && syncStatus.patDaysLeft <= 14 && (
                  <span className="text-amber-500 text-xs leading-none">⚠</span>
                )}
              </button>

              {(syncPopoverOpen || syncPopoverClosing) && (
                <div className={`absolute right-0 top-full mt-1.5 z-50 bg-background border border-border rounded-xl shadow-lg p-3 flex flex-col gap-2.5 min-w-[230px] relative ${syncPopoverClosing ? "popover-exiting" : "popover-entering"}`}>
                  <button
                    onClick={closeSyncPopover}
                    aria-label="Close"
                    className="absolute top-2 right-2 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {/* Sync row */}
                  {syncLoading ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />
                      Checking GitHub…
                    </span>
                  ) : syncStatus?.ok ? (
                    <a
                      href={`https://github.com/abdulazizuabahusain-web/Talah-App/commit/${syncStatus.githubSha}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={closeSyncPopover}
                      className="text-xs flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${syncStatus.upToDate ? "bg-green-500" : "bg-red-500"}`} />
                      <span className="font-mono">{syncStatus.shortSha}</span>
                      <span className="text-muted-foreground">
                        · {new Date(syncStatus.committedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </a>
                  ) : (
                    <span className="text-xs text-destructive flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                      {syncStatus && !syncStatus.ok ? syncStatus.error : "Sync error"}
                    </span>
                  )}

                  {/* PAT row — only when expiry is within 14 days */}
                  {syncStatus?.ok && syncStatus.patDaysLeft !== undefined && syncStatus.patDaysLeft <= 14 && (
                    <span
                      title={`GitHub PAT expires on ${syncStatus.patExpiresAt} — renew it in the Replit Secrets panel`}
                      className={`text-xs px-2 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-default ${
                        syncStatus.patDaysLeft <= 0
                          ? "bg-destructive/15 text-destructive"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      ⚠ {syncStatus.patDaysLeft <= 0 ? "PAT expired" : `PAT expires in ${syncStatus.patDaysLeft} day${syncStatus.patDaysLeft === 1 ? "" : "s"}`}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* === DESKTOP: full sync badge (hidden on mobile) === */}
            {syncLoading ? (
              <span className="hidden sm:flex text-xs text-muted-foreground px-2.5 py-1 rounded-full border border-border items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />
                GitHub…
              </span>
            ) : syncStatus && syncStatus.ok ? (
              <a
                href={`https://github.com/abdulazizuabahusain-web/Talah-App/commit/${syncStatus.githubSha}`}
                target="_blank"
                rel="noreferrer"
                title={`Last sync: ${new Date(syncStatus.committedAt).toLocaleString()}\n${syncStatus.message}`}
                className="hidden sm:flex text-xs px-2.5 py-1 rounded-full border border-border items-center gap-1.5 hover:bg-muted transition-colors"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${syncStatus.upToDate ? "bg-green-500" : "bg-red-500"}`} />
                <span className="font-mono">{syncStatus.shortSha}</span>
                <span className="text-muted-foreground">
                  · {new Date(syncStatus.committedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </a>
            ) : (
              <span
                title={syncStatus && !syncStatus.ok ? syncStatus.error : "Unknown error"}
                className="hidden sm:flex text-xs px-2.5 py-1 rounded-full border border-destructive/40 bg-destructive/10 text-destructive items-center gap-1.5 cursor-default"
              >
                <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                Sync error
              </span>
            )}

            {/* === DESKTOP: PAT expiry badge (hidden on mobile) === */}
            {syncStatus && syncStatus.ok && syncStatus.patDaysLeft !== undefined && syncStatus.patDaysLeft <= 14 && (
              <span
                title={`GitHub PAT expires on ${syncStatus.patExpiresAt} — renew it in the Replit Secrets panel`}
                className={`hidden sm:flex text-xs px-2.5 py-1 rounded-full font-semibold items-center gap-1 cursor-default ${
                  syncStatus.patDaysLeft <= 0
                    ? "bg-destructive/15 text-destructive border border-destructive/40"
                    : "bg-amber-100 text-amber-700 border border-amber-300"
                }`}
              >
                ⚠ {syncStatus.patDaysLeft <= 0 ? "PAT expired" : `PAT expires in ${syncStatus.patDaysLeft} day${syncStatus.patDaysLeft === 1 ? "" : "s"}`}
              </span>
            )}

            {/* Updated timestamp + countdown — always visible, wraps on mobile */}
            {lastUpdated && (
              <span
                className="text-xs text-muted-foreground tabular-nums"
                title="Data auto-refreshes every 5 minutes"
              >
                Updated {lastUpdated.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                {secsLeft !== null && (
                  <span className="ml-1">· next in {formatCountdown(secsLeft)}</span>
                )}
              </span>
            )}

            {/* Catch-up badge — appears briefly after tab regains focus */}
            {refreshedJustNow && (
              <span
                ref={badgeSpanRef}
                className={`relative overflow-hidden text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium inline-flex items-center gap-1 touch-pan-y${badgeDismissing ? " badge-dismissing" : " badge-entering"}`}
                title={
                  awayMins >= 2 && awayDepartedAt && awayReturnedAt
                    ? `Left at ${formatHHMM(awayDepartedAt)} · Returned at ${formatHHMM(awayReturnedAt)}`
                    : undefined
                }
                onMouseEnter={handleBadgeMouseEnter}
                onMouseLeave={handleBadgeMouseLeave}
                onFocus={handleBadgeMouseEnter}
                onBlur={handleBadgeFocusOut}
                onTouchStart={(e) => {
                  badgeTouchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                  // Only pause after a sustained touch (~100 ms), not an instant tap
                  badgeTouchPauseTimerRef.current = setTimeout(() => {
                    badgeTouchPauseTimerRef.current = null;
                    handleBadgeMouseEnter();
                  }, 100);
                }}
                onTouchEnd={(e) => {
                  // Cancel the pending pause if the finger lifted before 100 ms
                  if (badgeTouchPauseTimerRef.current) {
                    clearTimeout(badgeTouchPauseTimerRef.current);
                    badgeTouchPauseTimerRef.current = null;
                  }
                  const start = badgeTouchStartRef.current;
                  if (!start) return;
                  const dx = e.changedTouches[0].clientX - start.x;
                  const dy = e.changedTouches[0].clientY - start.y;
                  badgeTouchStartRef.current = null;
                  if (Math.abs(dx) > 40 || Math.abs(dy) > 40) {
                    dismissCatchupBadge(); // swipe → dismiss (already clears pause state)
                  } else {
                    handleBadgeMouseLeave(); // sustained hold release → resume countdown
                  }
                }}
                onTouchCancel={() => {
                  // OS interrupted the touch — cancel pending pause and resume if paused
                  if (badgeTouchPauseTimerRef.current) {
                    clearTimeout(badgeTouchPauseTimerRef.current);
                    badgeTouchPauseTimerRef.current = null;
                  }
                  badgeTouchStartRef.current = null;
                  handleBadgeMouseLeave();
                }}
              >
                ↻ refreshed{lastUpdated ? ` at ${formatHHMM(lastUpdated)}` : ""}
                {awayMins >= 2 && (
                  <>
                    {` · away ${formatAwayTime(awayMins)}`}
                    {awayDepartedAt && awayReturnedAt && (
                      <span className="opacity-75">{` (left ${formatHHMM(awayDepartedAt)}, back ${formatHHMM(awayReturnedAt)})`}</span>
                    )}
                  </>
                )}
                <button
                  onClick={dismissCatchupBadge}
                  className="ml-0.5 opacity-60 hover:opacity-100 leading-none"
                  title="Dismiss"
                  aria-label="Dismiss"
                >
                  ×
                </button>
                {/* Depleting progress bar — shows time remaining before auto-dismiss */}
                {!badgeDismissing && (
                  <span
                    key={badgeProgressKey}
                    className="badge-progress-bar absolute bottom-0 left-0 h-[2px] bg-primary/50"
                    style={{ animationPlayState: badgePaused ? "paused" : "running" }}
                    aria-hidden="true"
                  />
                )}
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
            <button onClick={() => load()} className="text-sm underline mt-1">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {tab === "analytics" && <AnalyticsTab overview={data.analyticsOverview} funnel={data.analyticsFunnel} />}
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
