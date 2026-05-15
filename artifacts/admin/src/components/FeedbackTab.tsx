import { type Feedback, type FeedbackConnection, type User } from "@/lib/api";

interface Props {
  feedback: Feedback[];
  users: User[];
}

const VERDICT_STYLE: Record<FeedbackConnection["verdict"], string> = {
  connect: "bg-primary/15 text-primary",
  pass: "bg-muted text-muted-foreground",
};

const VERDICT_ICON: Record<FeedbackConnection["verdict"], string> = {
  connect: "✓",
  pass: "✕",
};

const WMA_STYLE: Record<string, string> = {
  yes: "text-primary",
  maybe: "text-amber-600",
  no: "text-destructive",
};

type MutualPair = { a: string; b: string; groupId: string };

function computeMutualPairs(feedback: Feedback[]): MutualPair[] {
  // Group feedback by groupId
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
    // Find all unordered mutual pairs
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

export default function FeedbackTab({ feedback, users }: Props) {
  const userById = (id: string) => users.find((u) => u.id === id);
  const mutualPairs = computeMutualPairs(feedback);

  if (feedback.length === 0) {
    return <p className="text-muted-foreground text-center py-12">No feedback yet.</p>;
  }

  return (
    <div className="space-y-6">
      {/* ── Mutual Pairs ─────────────────────────────────────── */}
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

      {/* ── Individual feedback rows ──────────────────────────── */}
      <div className="space-y-3">
        {feedback.map((f) => {
          const from = userById(f.fromUserId);
          const connections = f.connections ?? [];
          const connects = connections.filter((c) => c.verdict === "connect");
          const passes = connections.filter((c) => c.verdict === "pass");

          return (
            <div key={f.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{from?.nickname ?? f.fromUserId}</p>
                  <p className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {f.wouldMeetAgain && (
                    <span className={`text-xs font-semibold capitalize ${WMA_STYLE[f.wouldMeetAgain] ?? ""}`}>
                      {f.wouldMeetAgain === "yes" ? "👍" : f.wouldMeetAgain === "maybe" ? "🤔" : "👎"} {f.wouldMeetAgain}
                    </span>
                  )}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-base ${i < f.rating ? "text-accent" : "text-border"}`}>★</span>
                    ))}
                  </div>
                </div>
              </div>

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
                          <span>{VERDICT_ICON[c.verdict]}</span>
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
