import { useState } from "react";
import { api, type User } from "@/lib/api";

// ── Matching notes — mirrors generateMatchingNotes() from the mobile lib/types.ts ──
function generateMatchingNotes(u: User): string[] {
  const notes: string[] = [];
  if (u.socialEnergyScore !== null && u.socialEnergyScore !== undefined) {
    if (u.socialEnergyScore >= 2) notes.push("High-energy social user");
    else if (u.socialEnergyScore <= -1) notes.push("Reserved user — best matched with a balanced group");
  }
  if (u.conversationDepthScore !== null && u.conversationDepthScore !== undefined) {
    if (u.conversationDepthScore >= 1) notes.push("Prefers deep conversations");
    else if (u.conversationDepthScore <= -1) notes.push("Prefers light and fun conversations");
  }
  if (u.atmosphereScore !== null && u.atmosphereScore !== undefined) {
    if (u.atmosphereScore <= -1) notes.push("Prefers calm, relaxed meetups");
    else if (u.atmosphereScore >= 1) notes.push("Enjoys lively, energetic atmospheres");
  }
  if (u.interactionScore !== null && u.interactionScore !== undefined) {
    if (u.interactionScore >= 1) notes.push("Activity-oriented — prefers doing over talking");
  }
  if (u.boundaryScore !== null && u.boundaryScore !== undefined) {
    if (u.boundaryScore <= -1) notes.push("Strong privacy preference — handle with care");
  }
  if (u.opennessScore !== null && u.opennessScore !== undefined) {
    if (u.opennessScore <= -1) notes.push("Opens up slowly — needs a comfortable group");
  }
  if (u.socialIntent === "long_term_connections") {
    notes.push("Best for long-term connection groups");
  } else if (
    u.socialIntent === "new_friends" ||
    u.socialIntent === "expand_circle" ||
    u.socialIntent === "casual_conversations"
  ) {
    notes.push("Best for casual / social-circle expansion groups");
  }
  return notes;
}

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
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export default function UsersTab({ users, onRefresh, hasMore, loadingMore, onLoadMore }: Props) {
  const [detail, setDetail] = useState<User | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const flag = async (u: User) => {
    setLoading(u.id);
    await api.patchUser(u.id, { flagged: !u.flagged });
    onRefresh();
    setLoading(null);
  };

  const remove = async (u: User) => {
    if (!confirm(`Delete user ${u.nickname ?? u.email ?? u.phone}? This cannot be undone.`)) return;
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
        <UserDetailModal
          user={detail}
          onClose={() => setDetail(null)}
          onRefresh={() => { onRefresh(); setDetail(null); }}
        />
      )}
      {users.map((u) => {
        const pct = completionPct(u);
        return (
          <div key={u.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="font-bold text-primary">{(u.nickname ?? u.email ?? u.phone).charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{u.nickname ?? "—"}</span>
                  {u.flagged && <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-medium">Flagged</span>}
                  {u.verified && <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">Verified</span>}
                  {u.isAdmin && <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">Admin</span>}
                </div>
                <p className="text-sm text-muted-foreground">{(u.email ?? u.phone)} · {u.city ?? "—"} · {u.gender ?? "—"} · {u.ageRange ?? "—"}</p>
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

// ── User detail modal ─────────────────────────────────────────────────────────

function UserDetailModal({
  user: u,
  onClose,
  onRefresh,
}: {
  user: User;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const notes = generateMatchingNotes(u);

  const action = async (key: string, patch: Record<string, unknown>) => {
    setLoading(key);
    await api.patchUser(u.id, patch);
    onRefresh();
    setLoading(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card rounded-t-3xl border-b border-border px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold">{u.nickname ?? u.email ?? u.phone}</h2>
            {u.flagged && <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-medium">Flagged</span>}
            {u.verified && <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">Verified</span>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Quick actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => action("flag", { flagged: !u.flagged })}
              disabled={loading === "flag"}
              className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            >
              {loading === "flag" ? "Saving…" : u.flagged ? "✓ Unflag" : "⚑ Flag"}
            </button>
            <button
              onClick={() => action("verify", { verified: !u.verified })}
              disabled={loading === "verify"}
              className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            >
              {loading === "verify" ? "Saving…" : u.verified ? "Unverify" : "✓ Verify"}
            </button>
          </div>

          {/* Basic profile */}
          <Section title="Basic Profile">
            <Row label="Email" value={u.email ?? u.phone} />
            <Row label="City" value={u.city} />
            <Row label="Gender" value={u.gender} />
            <Row label="Age range" value={u.ageRange} />
            <Row label="Lifestyle" value={u.lifestyle} />
            <Row label="Preferred meetup" value={u.preferredMeetup} />
            <Row label="Preferred days" value={u.preferredDays?.join(", ")} />
            <Row label="Preferred times" value={u.preferredTimes?.join(", ")} />
          </Section>

          {/* Fun fact */}
          {u.funFact ? (
            <Section title="Fun Fact">
              <p className="text-sm text-foreground italic">"{u.funFact}"</p>
            </Section>
          ) : null}

          {/* Personality */}
          <Section title="Personality & Interests">
            <Row label="Personality" value={u.personality} />
            <Row label="Traits" value={u.personalityTraits?.join(", ")} />
            <Row label="Interests" value={u.interests?.join(", ")} />
            <Row label="Topics enjoyed" value={u.enjoyedTopics?.join(", ")} />
            <Row label="Social energy" value={u.socialEnergy} />
            <Row label="Conversation style" value={u.conversationStyle} />
            <Row label="Social intent" value={u.socialIntent} />
            <Row label="Planning pref." value={u.planningPreference} />
            <Row label="Atmosphere" value={u.meetupAtmosphere} />
            <Row label="Interaction pref." value={u.interactionPreference} />
            <Row label="Openness" value={u.opennessLevel} />
            <Row label="Social boundary" value={u.socialBoundary} />
          </Section>

          {/* Personality scores */}
          <Section title="Personality Scores">
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(SCORE_LABELS).map(([k, label]) => (
                <ScoreBadge key={k} label={label} value={(u as unknown as Record<string, number | null>)[k] ?? null} />
              ))}
            </div>
          </Section>

          {/* Matching notes */}
          {notes.length > 0 ? (
            <Section title="Matching Notes">
              <ul className="space-y-1">
                {notes.map((n, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary">›</span>{n}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {/* Blocked users */}
          {(u.blockedUserIds ?? []).length > 0 ? (
            <Section title={`Blocked Users (${u.blockedUserIds!.length})`}>
              <p className="text-sm text-muted-foreground font-mono break-all">
                {u.blockedUserIds!.join(", ")}
              </p>
            </Section>
          ) : null}

          {/* Metadata */}
          <Section title="Account">
            <Row label="Joined" value={new Date(u.createdAt).toLocaleString()} />
            <Row label="Onboarded" value={u.onboarded ? "Yes" : "No"} />
            <Row label="Push token" value={u.expoPushToken ? "Registered" : "None"} />
          </Section>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <div className="bg-muted rounded-xl px-3 py-2 space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-foreground text-right break-all">{value}</span>
    </div>
  );
}
