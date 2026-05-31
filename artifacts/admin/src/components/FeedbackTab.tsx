import { type Feedback, type FeedbackConnection, type User } from "@/lib/api";

interface Props {
  feedback: Feedback[];
  users: User[];
}

type MutualPair = { a: string; b: string; groupId: string };

function computeMutualPairs(feedback: Feedback[]): MutualPair[] {
  const byGroup = new Map<string, Feedback[]>();
  for (const f of feedback) {
    const list = byGroup.get(f.groupId) ?? [];
    list.push(f);
    byGroup.set(f.groupId, list);
  }
  const pairs: MutualPair[] = [];
  for (const [groupId, rows] of byGroup) {
    const connectsFrom = new Map<string, Set<string>>();
    for (const row of rows) {
      const chosen = new Set(
        (row.connections ?? [])
          .filter((c) => c.verdict === "connect")
          .map((c) => c.userId),
      );
      connectsFrom.set(row.fromUserId, chosen);
    }
    const userIds = Array.from(connectsFrom.keys());
    for (let i = 0; i < userIds.length; i++) {
      for (let j = i + 1; j < userIds.length; j++) {
        const a = userIds[i]!;
        const b = userIds[j]!;
        if (connectsFrom.get(a)?.has(b) && connectsFrom.get(b)?.has(a)) {
          pairs.push({ a, b, groupId });
        }
      }
    }
  }
  return pairs;
}

const VERDICT_STYLE: Record<FeedbackConnection["verdict"], string> = {
  connect: "bg-primary/15 text-primary",
  pass: "bg-muted text-muted-foreground",
};

const WJA_STYLE: Record<string, string> = {
  yes: "text-primary",
  maybe: "text-amber-600",
  no: "text-destructive",
};

const WJA_ICON: Record<string, string> = {
  yes: "👍",
  maybe: "🤔",
  no: "👎",
};

const GROUP_FIT_LABEL: Record<string, string> = {
  very_suitable: "Very suitable",
  somewhat: "Somewhat",
  not_suitable: "Not suitable",
};

const GROUP_FIT_STYLE: Record<string, string> = {
  very_suitable: "bg-primary/10 text-primary",
  somewhat: "bg-amber-50 text-amber-700",
  not_suitable: "bg-destructive/10 text-destructive",
};

const V_SUITABLE_LABEL: Record<string, string> = {
  yes: "Yes",
  maybe: "Maybe",
  no: "No",
};

function Stars({ n, max = 5 }: { n: number | null; max?: number }) {
  if (n === null) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span className="text-sm tracking-tight">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < n ? "text-amber-400" : "text-border"}>
          ★
        </span>
      ))}
      <span className="text-xs text-muted-foreground ml-1">{n}/5</span>
    </span>
  );
}

export default function FeedbackTab({ feedback, users }: Props) {
  const userById = (id: string) => users.find((u) => u.id === id);
  const mutualPairs = computeMutualPairs(feedback);

  if (feedback.length === 0) {
    return <p className="text-muted-foreground text-center py-12">No feedback yet.</p>;
  }

  // ── Summary stats ──────────────────────────────────────────────────────────
  const avgComfort =
    feedback.reduce((s, f) => s + (f.comfortRating ?? 0), 0) / feedback.length;
  const venueRatings = feedback.map((f) => f.venueRating).filter((v): v is number => v !== null);
  const avgVenue =
    venueRatings.length > 0
      ? venueRatings.reduce((s, v) => s + v, 0) / venueRatings.length
      : null;
  const safetyConcernCount = feedback.filter((f) => f.safetyConcern).length;
  const wjaYes = feedback.filter((f) => f.wouldJoinAgain === "yes").length;
  const wjaMaybe = feedback.filter((f) => f.wouldJoinAgain === "maybe").length;
  const wjaNo = feedback.filter((f) => f.wouldJoinAgain === "no").length;

  return (
    <div className="space-y-6">
      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{feedback.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Submissions</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{avgComfort.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Avg Comfort</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">
            {avgVenue !== null ? avgVenue.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Avg Venue</p>
        </div>
        {safetyConcernCount > 0 ? (
          <div className="bg-destructive/8 border border-destructive/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{safetyConcernCount}</p>
            <p className="text-xs text-destructive/80 mt-0.5">⚠️ Safety Concerns</p>
          </div>
        ) : (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground mt-0.5">Safety Concerns</p>
          </div>
        )}
      </div>

      {/* ── Would-join-again bar ───────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">Would Join Again</p>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-primary font-semibold">👍 {wjaYes} yes</span>
          <span className="text-amber-600 font-semibold">🤔 {wjaMaybe} maybe</span>
          <span className="text-destructive font-semibold">👎 {wjaNo} no</span>
        </div>
      </div>

      {/* ── Safety concerns section (only if any) ─────────────────────────── */}
      {safetyConcernCount > 0 && (
        <div className="border border-destructive/40 rounded-2xl p-4 space-y-3 bg-destructive/5">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <p className="font-semibold text-destructive">
              Safety Concerns — {safetyConcernCount} report{safetyConcernCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="space-y-2">
            {feedback
              .filter((f) => f.safetyConcern)
              .map((f) => {
                const from = f.userNickname ?? userById(f.fromUserId)?.nickname ?? f.fromUserId.slice(0, 8);
                return (
                  <div key={f.id} className="bg-card rounded-xl border border-destructive/30 p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-destructive">{from}</span>
                      {f.groupCity && (
                        <span className="text-xs text-muted-foreground">· {f.groupCity} / {f.groupArea}</span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {f.safetyConcernDetails && (
                      <p className="text-sm text-foreground italic">"{f.safetyConcernDetails}"</p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Mutual Connects ───────────────────────────────────────────────── */}
      {mutualPairs.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🤝</span>
            <p className="font-semibold text-primary">
              Mutual Connects · {mutualPairs.length} pair{mutualPairs.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {mutualPairs.map((pair, i) => {
              const a = userById(pair.a);
              const b = userById(pair.b);
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-semibold"
                >
                  <span>{a?.nickname ?? pair.a.slice(0, 6)}</span>
                  <span className="opacity-60">↔</span>
                  <span>{b?.nickname ?? pair.b.slice(0, 6)}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Individual feedback rows ──────────────────────────────────────── */}
      <div className="space-y-3">
        {feedback.map((f) => {
          const from = f.userNickname ?? userById(f.fromUserId)?.nickname ?? f.fromUserId.slice(0, 8);
          const connections = f.connections ?? [];
          const connects = connections.filter((c) => c.verdict === "connect");
          const passes = connections.filter((c) => c.verdict === "pass");
          const hasSafety = f.safetyConcern;

          return (
            <div
              key={f.id}
              className={`bg-card rounded-2xl border p-4 space-y-3 ${
                hasSafety ? "border-destructive/50" : "border-border"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{from}</p>
                    {hasSafety && (
                      <span className="inline-flex items-center gap-1 bg-destructive/10 text-destructive text-xs font-semibold px-2 py-0.5 rounded-full">
                        ⚠️ Needs Review
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {f.userGender && <span>{f.userGender}</span>}
                    {f.userCity && <span>· {f.userCity}</span>}
                    {f.groupCity && (
                      <span className="text-foreground/60">
                        · {f.groupCity} / {f.groupArea}
                        {f.groupVenue ? ` @ ${f.groupVenue}` : ""}
                      </span>
                    )}
                    <span>· {new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Ratings row */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Comfort</p>
                  <Stars n={f.comfortRating} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Venue</p>
                  <Stars n={f.venueRating} />
                </div>
              </div>

              {/* Chip row */}
              <div className="flex flex-wrap gap-2">
                {f.wouldJoinAgain && (
                  <span
                    className={`text-xs font-semibold capitalize ${WJA_STYLE[f.wouldJoinAgain] ?? ""}`}
                  >
                    {WJA_ICON[f.wouldJoinAgain]} {f.wouldJoinAgain === "yes" ? "Would join again" : f.wouldJoinAgain === "maybe" ? "Maybe join again" : "Won't join again"}
                  </span>
                )}
                {f.groupFit && (
                  <span
                    className={`text-xs font-semibold rounded-full px-2 py-0.5 ${GROUP_FIT_STYLE[f.groupFit] ?? "bg-muted text-muted-foreground"}`}
                  >
                    Group: {GROUP_FIT_LABEL[f.groupFit] ?? f.groupFit}
                  </span>
                )}
                {f.venueSuitable && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    Venue suitable: {V_SUITABLE_LABEL[f.venueSuitable] ?? f.venueSuitable}
                  </span>
                )}
              </div>

              {/* Safety concern details */}
              {hasSafety && f.safetyConcernDetails && (
                <div className="bg-destructive/8 rounded-lg p-2.5">
                  <p className="text-xs font-semibold text-destructive mb-1">Safety note</p>
                  <p className="text-sm text-foreground italic">"{f.safetyConcernDetails}"</p>
                </div>
              )}

              {/* Comment */}
              {f.comment && (
                <p className="text-sm text-muted-foreground italic">"{f.comment}"</p>
              )}

              {/* Connections */}
              {connections.length > 0 && (
                <div className="border-t border-border pt-2 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Verdicts · {connects.length} connect, {passes.length} pass
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {connections.map((c) => {
                      const target = userById(c.userId);
                      const isMutual =
                        c.verdict === "connect" &&
                        mutualPairs.some(
                          (p) =>
                            p.groupId === f.groupId &&
                            ((p.a === f.fromUserId && p.b === c.userId) ||
                              (p.b === f.fromUserId && p.a === c.userId)),
                        );
                      return (
                        <span
                          key={c.userId}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${VERDICT_STYLE[c.verdict]} ${isMutual ? "ring-1 ring-primary/40" : ""}`}
                        >
                          <span>{c.verdict === "connect" ? "✓" : "✕"}</span>
                          <span>{target?.nickname ?? c.userId.slice(0, 8)}</span>
                          {isMutual && <span title="mutual">🤝</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
