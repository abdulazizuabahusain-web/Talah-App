import { useState } from "react";
import { api, type Group, type User } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  matched: "bg-amber-100 text-amber-700",
  revealed: "bg-primary/15 text-primary",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-destructive/15 text-destructive",
};

const ALL_STATUSES = ["pending", "matched", "revealed", "completed", "cancelled"];

interface Props {
  groups: Group[];
  users: User[];
  onRefresh: () => void;
}

export default function GroupsTab({ groups, users, onRefresh }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const userById = (id: string) => users.find((u) => u.id === id);

  const changeStatus = async (g: Group, status: string) => {
    setLoading(g.id);
    await api.patchGroup(g.id, { status });
    onRefresh();
    setLoading(null);
  };

  const saveVenue = async (g: Group) => {
    setLoading(g.id);
    const ts = dateStr ? new Date(dateStr.replace(" ", "T")).getTime() : undefined;
    await api.patchGroup(g.id, { venue: venue || undefined, meetupAt: isNaN(ts ?? NaN) ? undefined : ts });
    setEditing(null);
    onRefresh();
    setLoading(null);
  };

  if (groups.length === 0) {
    return <p className="text-muted-foreground text-center py-12">No groups yet.</p>;
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const members = g.memberIds.map(userById).filter(Boolean) as User[];
        return (
          <div key={g.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{g.meetupType === "coffee" ? "☕ Coffee" : "🌙 Dinner"} · {g.city} · {g.area}</p>
                <p className="text-sm text-muted-foreground">{g.gender === "woman" ? "Women" : "Men"} · {g.memberIds.length} members</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[g.status] ?? "bg-muted text-muted-foreground"}`}>
                {g.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {members.map((u) => (
                <span key={u.id} className="bg-muted rounded-full px-2.5 py-1 text-xs font-medium">{u.nickname ?? u.phone}</span>
              ))}
            </div>

            {g.venue && <p className="text-sm">📍 {g.venue}</p>}
            {g.meetupAt && <p className="text-sm">⏰ {new Date(g.meetupAt).toLocaleString()}</p>}

            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => changeStatus(g, s)}
                  disabled={g.status === s || loading === g.id}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${g.status === s ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:bg-muted"}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {editing === g.id ? (
              <div className="space-y-2 pt-2 border-t border-border">
                <input
                  className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Venue name (e.g. مقهى مدد)"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
                <input
                  className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Date & time (YYYY-MM-DD HH:mm)"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={() => saveVenue(g)} className="text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90">Save</button>
                  <button onClick={() => setEditing(null)} className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted">Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setEditing(g.id); setVenue(g.venue ?? ""); setDateStr(g.meetupAt ? new Date(g.meetupAt).toISOString().slice(0, 16).replace("T", " ") : ""); }}
                className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                {g.venue ? "Edit venue" : "Set venue & time"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
