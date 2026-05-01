import { useState } from "react";
import { api, type MeetupRequest, type User } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  matched: "bg-primary/15 text-primary",
  cancelled: "bg-muted text-muted-foreground",
};

interface Props {
  requests: MeetupRequest[];
  users: User[];
  onRefresh: () => void;
}

export default function RequestsTab({ requests, users, onRefresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const cancel = async (r: MeetupRequest) => {
    if (r.status !== "pending") return;
    setLoading(r.id);
    await api.patchRequest(r.id, { status: "cancelled" });
    onRefresh();
    setLoading(null);
  };

  const userById = (id: string) => users.find((u) => u.id === id);

  if (requests.length === 0) {
    return <p className="text-muted-foreground text-center py-12">No requests yet.</p>;
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => {
        const u = userById(r.userId);
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
                <p className="font-medium">{r.meetupType === "coffee" ? "☕ Coffee" : "🌙 Dinner"}</p>
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
            {r.status === "pending" && (
              <button
                onClick={() => cancel(r)}
                disabled={loading === r.id}
                className="text-sm px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
              >
                Cancel Request
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
