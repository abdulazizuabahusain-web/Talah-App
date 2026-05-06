import { useState } from "react";
import { api, type Candidate, type MeetupRequest, type User } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  matched: "bg-primary/15 text-primary",
  cancelled: "bg-muted text-muted-foreground",
};

interface Props {
  requests: MeetupRequest[];
  users: User[];
  onRefresh: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export default function RequestsTab({ requests, users, onRefresh, hasMore, loadingMore, onLoadMore }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [candidatesLoading, setCandidatesLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const cancel = async (r: MeetupRequest) => {
    if (r.status !== "pending") return;
    setLoading(r.id);
    await api.patchRequest(r.id, { status: "cancelled" });
    onRefresh();
    setLoading(null);
  };

  const loadCandidates = async (r: MeetupRequest) => {
    if (expanded === r.id) { setExpanded(null); return; }
    setExpanded(r.id);
    if (candidates[r.id]) return;
    setCandidatesLoading(r.id);
    try {
      const list = await api.getCandidates(r.id);
      setCandidates((prev) => ({ ...prev, [r.id]: list }));
    } catch {
      setCandidates((prev) => ({ ...prev, [r.id]: [] }));
    } finally {
      setCandidatesLoading(null);
    }
  };

  const userById = (id: string) => users.find((u) => u.id === id);

  if (requests.length === 0) {
    return <p className="text-muted-foreground text-center py-12">No requests yet.</p>;
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => {
        const u = userById(r.userId);
        const isPending = r.status === "pending";
        const isExpanded = expanded === r.id;
        const reqCandidates = candidates[r.id] ?? [];
        return (
          <div key={r.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{u?.nickname ?? r.userId}</p>
                <p className="text-sm text-muted-foreground">{u?.city ?? "—"} · {u?.gender ?? "—"}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[r.status] ?? "bg-muted text-muted-foreground"}`}>
                {r.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted rounded-xl px-3 py-2">
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium">{r.meetupType === "coffee" ? "Coffee" : "Dinner"}</p>
              </div>
              <div className="bg-muted rounded-xl px-3 py-2">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{r.preferredDate}</p>
              </div>
              <div className="bg-muted rounded-xl px-3 py-2">
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-medium capitalize">{r.preferredTime}</p>
              </div>
              <div className="bg-muted rounded-xl px-3 py-2">
                <p className="text-xs text-muted-foreground">Area</p>
                <p className="font-medium">{r.area}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isPending && (
                <>
                  <button
                    onClick={() => loadCandidates(r)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    {candidatesLoading === r.id ? "Loading..." : isExpanded ? "Hide matches" : "Suggested matches"}
                  </button>
                  <button
                    onClick={() => cancel(r)}
                    disabled={loading === r.id}
                    className="text-sm px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
            {isExpanded && (
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Top Matches ({reqCandidates.length})
                </p>
                {reqCandidates.length === 0 && !candidatesLoading ? (
                  <p className="text-sm text-muted-foreground">No compatible candidates found.</p>
                ) : (
                  reqCandidates.map((c) => (
                    <div key={c.userId} className="flex items-center justify-between gap-2 bg-muted rounded-xl px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold">{c.nickname ?? "?"}</p>
                        <p className="text-xs text-muted-foreground">{c.city} - {c.ageRange} - {c.preferredDate}</p>
                      </div>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {c.score}pts
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
