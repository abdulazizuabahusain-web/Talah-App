import { useState } from "react";
import { api, type Group, type User } from "@/lib/api";
import { getVenuesForCity } from "@/lib/venues";

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
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export default function GroupsTab({ groups, users, onRefresh, hasMore, loadingMore, onLoadMore }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const userById = (id: string) => users.find((u) => u.id === id);

  const changeStatus = async (g: Group, status: string) => {
    setLoading(g.id);
    await api.patchGroup(g.id, { status });
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
              <VenueEditor
                city={g.city}
                initialVenue={g.venue ?? ""}
                initialDate={g.meetupAt ? new Date(g.meetupAt).toISOString().slice(0, 16).replace("T", " ") : ""}
                onSave={async (v, d) => {
                  setLoading(g.id);
                  const ts = d ? new Date(d.replace(" ", "T")).getTime() : undefined;
                  await api.patchGroup(g.id, { venue: v || undefined, meetupAt: isNaN(ts ?? NaN) ? undefined : ts });
                  setEditing(null);
                  onRefresh();
                  setLoading(null);
                }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <button
                onClick={() => setEditing(g.id)}
                className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                {g.venue ? "Edit venue" : "Set venue & time"}
              </button>
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
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Venue editor sub-component ─────────────────────────────────────────────

function VenueEditor({
  city,
  initialVenue,
  initialDate,
  onSave,
  onCancel,
}: {
  city: string;
  initialVenue: string;
  initialDate: string;
  onSave: (venue: string, date: string) => Promise<void>;
  onCancel: () => void;
}) {
  const suggestions = getVenuesForCity(city);
  const [venue, setVenue] = useState(initialVenue);
  const [dateStr, setDateStr] = useState(initialDate);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(venue, dateStr);
    setSaving(false);
  };

  return (
    <div className="space-y-3 pt-2 border-t border-border">
      {suggestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">
            Suggested venues in {city}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s.name}
                onClick={() => setVenue(s.name)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  venue === s.name
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border hover:bg-muted"
                }`}
              >
                {s.name}
                <span className="text-muted-foreground ml-1">· {s.area}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Or type a custom venue…"
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
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
