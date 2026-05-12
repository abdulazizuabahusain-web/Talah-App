import type { AnalyticsFunnel, AnalyticsOverview } from "@/lib/api";

interface Props {
  overview: AnalyticsOverview | null;
  funnel: AnalyticsFunnel | null;
}

const FUNNEL_STEPS: { key: keyof AnalyticsFunnel; label: string }[] = [
  { key: "otpRequested", label: "OTP requested" },
  { key: "otpVerified", label: "OTP verified" },
  { key: "profileCompleted", label: "Profile completed" },
  { key: "groupRequested", label: "Group requested" },
  { key: "matchAccepted", label: "Match accepted" },
  { key: "feedbackSubmitted", label: "Feedback submitted" },
];

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function AnalyticsTab({ overview, funnel }: Props) {
  if (!overview || !funnel) {
    return <p className="text-muted-foreground text-center py-12">Analytics data is not available yet.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "DAU", value: overview.dau },
          { label: "WAU", value: overview.wau },
          { label: "Total Users", value: overview.totalUsers },
          { label: "Match Acceptance", value: pct(overview.matchAcceptanceRate) },
          { label: "Avg Rating", value: overview.avgFeedbackRating.toFixed(1) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-primary">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-3">Signups by day</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2">Date</th>
                <th className="py-2">Count</th>
                <th className="py-2">Bar</th>
              </tr>
            </thead>
            <tbody>
              {overview.signupsByDay.map((day) => {
                const max = Math.max(...overview.signupsByDay.map((d) => d.count), 1);
                return (
                  <tr key={day.date} className="border-b border-border/60 last:border-0">
                    <td className="py-2">{day.date}</td>
                    <td className="py-2">{day.count}</td>
                    <td className="py-2 w-1/2">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(day.count / max) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-3">30-day funnel</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2">Step</th>
                <th className="py-2">Count</th>
                <th className="py-2">Drop-off from previous</th>
              </tr>
            </thead>
            <tbody>
              {FUNNEL_STEPS.map((step, index) => {
                const current = funnel[step.key];
                const previous = index === 0 ? current : funnel[FUNNEL_STEPS[index - 1].key];
                const dropOff = index === 0 || previous === 0 ? 0 : Math.max(0, 1 - current / previous);
                return (
                  <tr key={step.key} className="border-b border-border/60 last:border-0">
                    <td className="py-2">{step.label}</td>
                    <td className="py-2">{current}</td>
                    <td className="py-2">{index === 0 ? "—" : pct(dropOff)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
