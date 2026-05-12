import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface OverviewData {
  dau: number;
  wau: number;
  totalUsers: number;
  totalGroups: number;
  matchAcceptanceRate: number;
  avgFeedbackRating: number;
  groupsByCity: Record<string, number>;
  signupsByDay: { date: string; count: number }[];
}

interface FunnelData {
  otpRequested: number;
  otpVerified: number;
  profileCompleted: number;
  groupRequested: number;
  matchAccepted: number;
  feedbackSubmitted: number;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1 min-w-[130px] flex-1">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function pct(a: number, b: number) {
  if (b === 0) return "—";
  return `${Math.round((a / b) * 100)}%`;
}

function maxCount(days: { date: string; count: number }[]) {
  return Math.max(1, ...days.map((d) => d.count));
}

export default function AnalyticsTab() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getAnalyticsOverview(), api.getAnalyticsFunnel()])
      .then(([ov, fn]) => {
        setOverview(ov);
        setFunnel(fn);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Loading analytics…
      </div>
    );
  }
  if (error) {
    return <div className="text-destructive text-sm py-8 text-center">{error}</div>;
  }
  if (!overview || !funnel) return null;

  const funnelSteps = [
    { label: "OTP Requested", value: funnel.otpRequested },
    { label: "OTP Verified (signup)", value: funnel.otpVerified },
    { label: "Profile Completed", value: funnel.profileCompleted },
    { label: "Group Requested", value: funnel.groupRequested },
    { label: "Match Accepted", value: funnel.matchAccepted },
    { label: "Feedback Submitted", value: funnel.feedbackSubmitted },
  ];

  const max = maxCount(overview.signupsByDay);

  return (
    <div className="space-y-8">
      {/* Activity */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Activity</h2>
        <div className="flex flex-wrap gap-4">
          <StatCard label="Daily Active Users" value={overview.dau} sub="sessions today" />
          <StatCard label="Weekly Active Users" value={overview.wau} sub="sessions last 7 days" />
        </div>
      </section>

      {/* Key stats */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Key Stats (last 30 days)</h2>
        <div className="flex flex-wrap gap-4">
          <StatCard label="Total Users" value={overview.totalUsers} />
          <StatCard label="Total Active Groups" value={overview.totalGroups} />
          <StatCard
            label="Match Acceptance Rate"
            value={`${Math.round(overview.matchAcceptanceRate * 100)}%`}
            sub="completed / non-cancelled groups"
          />
          <StatCard
            label="Avg Feedback Rating"
            value={overview.avgFeedbackRating > 0 ? `${overview.avgFeedbackRating} / 5` : "—"}
          />
        </div>
      </section>

      {/* Groups by city */}
      {Object.keys(overview.groupsByCity).length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3">Groups by City</h2>
          <div className="flex flex-wrap gap-4">
            {Object.entries(overview.groupsByCity).map(([city, count]) => (
              <StatCard key={city} label={city} value={count} />
            ))}
          </div>
        </section>
      )}

      {/* Signups bar chart */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">New Signups — Last 14 Days</h2>
        {overview.signupsByDay.length === 0 ? (
          <p className="text-sm text-muted-foreground">No signup data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 h-32 min-w-[400px]">
              {overview.signupsByDay.map((d) => {
                const heightPct = Math.max(4, Math.round((d.count / max) * 100));
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-[24px]">
                    <span className="text-[10px] text-muted-foreground font-medium">{d.count}</span>
                    <div
                      className="w-full rounded-t-sm bg-primary/80"
                      style={{ height: `${heightPct}%` }}
                      title={`${d.date}: ${d.count}`}
                    />
                    <span
                      className="text-[9px] text-muted-foreground rotate-45 origin-left whitespace-nowrap"
                      style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
                    >
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Funnel */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Conversion Funnel — Last 30 Days</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-medium">Step</th>
                <th className="text-right px-4 py-2.5 font-medium">Count</th>
                <th className="text-right px-4 py-2.5 font-medium">Drop-off from prev.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {funnelSteps.map((step, i) => {
                const prev = funnelSteps[i - 1];
                const dropoff = prev ? pct(step.value, prev.value) : "—";
                const isLow =
                  prev && prev.value > 0 && step.value / prev.value < 0.6;
                return (
                  <tr key={step.label} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{step.label}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{step.value}</td>
                    <td
                      className={`px-4 py-2.5 text-right tabular-nums font-medium ${isLow ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {i === 0 ? "—" : dropoff}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Drop-off highlighted in red when &lt; 60% of previous step.
        </p>
      </section>
    </div>
  );
}
