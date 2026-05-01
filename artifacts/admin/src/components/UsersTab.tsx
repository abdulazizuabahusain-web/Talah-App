import { useState } from "react";
import { api, type User } from "@/lib/api";

const SCORE_LABELS: Record<string, string> = {
  socialEnergyScore: "Energy",
  conversationDepthScore: "Conv.",
  planningScore: "Plan",
  atmosphereScore: "Atm.",
  interactionScore: "Inter.",
  opennessScore: "Open.",
  boundaryScore: "Bound.",
};

function ScoreBadge({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  const color = value > 0 ? "bg-primary/15 text-primary" : value < 0 ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      {label} {value > 0 ? `+${value}` : value}
    </span>
  );
}

function completionPct(u: User): number {
  const checks = [
    !!u.nickname, !!u.city, !!u.gender, !!u.ageRange, !!u.lifestyle,
    u.interests.length >= 3, !!u.personality, !!u.preferredMeetup,
    u.preferredDays.length > 0, u.preferredTimes.length > 0, !!u.funFact,
    !!u.socialEnergy, !!u.conversationStyle, u.enjoyedTopics.length >= 1,
    !!u.socialIntent, !!u.planningPreference, !!u.meetupAtmosphere,
    !!u.interactionPreference, u.personalityTraits.length >= 1,
    !!u.opennessLevel, !!u.socialBoundary,
  ];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

interface Props {
  users: User[];
  onRefresh: () => void;
}

export default function UsersTab({ users, onRefresh }: Props) {
  const [detail, setDetail] = useState<User | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const flag = async (u: User) => {
    setLoading(u.id);
    await api.patchUser(u.id, { flagged: !u.flagged });
    onRefresh();
    setLoading(null);
  };

  const remove = async (u: User) => {
    if (!confirm(`Delete user ${u.nickname ?? u.phone}? This cannot be undone.`)) return;
    setLoading(u.id);
    await api.deleteUser(u.id);
    onRefresh();
    setLoading(null);
  };

  if (users.length === 0) {
    return <p className="text-muted-foreground text-center py-12">No users yet.</p>;
  }

  return (
    <div className="space-y-3">
      {detail && (
        <UserDetailModal user={detail} onClose={() => setDetail(null)} />
      )}
      {users.map((u) => {
        const pct = completionPct(u);
        return (
          <div key={u.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="font-bold text-primary">{(u.nickname ?? u.phone).charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{u.nickname ?? "—"}</span>
                  {u.flagged && <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-medium">Flagged</span>}
                  {u.verified && <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">Verified</span>}
                  {u.isAdmin && <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">Admin</span>}
                </div>
                <p className="text-sm text-muted-foreground">{u.phone} · {u.city ?? "—"} · {u.gender ?? "—"} · {u.ageRange ?? "—"}</p>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {Object.entries(SCORE_LABELS).map(([k, label]) => (
                <ScoreBadge key={k} label={label} value={(u as unknown as Record<string, number | null>)[k] ?? null} />
              ))}
            </div>

            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Profile completion</span><span>{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setDetail(u)} className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">Details</button>
              <button onClick={() => flag(u)} disabled={loading === u.id} className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
                {u.flagged ? "Unflag" : "Flag"}
              </button>
              <button onClick={() => remove(u)} disabled={loading === u.id} className="text-sm px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors">
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UserDetailModal({ user: u, onClose }: { user: User; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card rounded-t-3xl border-b border-border px-5 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold">{u.nickname ?? u.phone}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-xl">×</button>
        </div>
        <div className="p-5 space-y-5">
          <Section title="Basic Profile">
            <Row label="Phone" value={u.phone} />
            <Row label="City" value={u.city} />
            <Row label="Gender" value={u.gender} />
            <Row label="Age" value={u.ageRange} />
            <Row label="Lifestyle" value={u.lifestyle} />
            <Row label="Meetup" value={u.preferredMeetup} />
            <Row label="Interests" value={u.interests.join(", ")} />
            <Row label="Fun Fact" value={u.funFact} />
          </Section>
          <Section title="Personality">
            <Row label="Social Energy" value={u.socialEnergy} />
            <Row label="Conversation" value={u.conversationStyle} />
            <Row label="Topics" value={u.enjoyedTopics.join(", ")} />
            <Row label="Intent" value={u.socialIntent} />
            <Row label="Planning" value={u.planningPreference} />
            <Row label="Atmosphere" value={u.meetupAtmosphere} />
            <Row label="Interaction" value={u.interactionPreference} />
            <Row label="Traits" value={u.personalityTraits.join(", ")} />
            <Row label="Openness" value={u.opennessLevel} />
            <Row label="Boundary" value={u.socialBoundary} />
          </Section>
          <Section title="Scores">
            <Row label="Energy Score" value={u.socialEnergyScore?.toString()} />
            <Row label="Conversation Score" value={u.conversationDepthScore?.toString()} />
            <Row label="Planning Score" value={u.planningScore?.toString()} />
            <Row label="Atmosphere Score" value={u.atmosphereScore?.toString()} />
            <Row label="Interaction Score" value={u.interactionScore?.toString()} />
            <Row label="Openness Score" value={u.opennessScore?.toString()} />
            <Row label="Boundary Score" value={u.boundaryScore?.toString()} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="bg-muted px-4 py-2.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between px-4 py-2.5 gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value || "—"}</span>
    </div>
  );
}
