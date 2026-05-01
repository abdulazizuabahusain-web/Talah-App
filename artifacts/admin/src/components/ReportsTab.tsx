import { type Report, type User } from "@/lib/api";

interface Props {
  reports: Report[];
  users: User[];
}

export default function ReportsTab({ reports, users }: Props) {
  const userById = (id: string) => users.find((u) => u.id === id);

  if (reports.length === 0) {
    return <p className="text-muted-foreground text-center py-12">No reports yet.</p>;
  }

  return (
    <div className="space-y-3">
      {reports.map((r) => {
        const reporter = userById(r.reporterId);
        const target = userById(r.targetUserId);
        return (
          <div key={r.id} className="bg-card rounded-2xl border border-destructive/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-semibold">Report</span>
              <span className="text-sm font-semibold">{reporter?.nickname ?? r.reporterId}</span>
              <span className="text-sm text-muted-foreground">→</span>
              <span className="text-sm font-semibold">{target?.nickname ?? r.targetUserId}</span>
            </div>
            <p className="text-sm text-foreground">{r.reason}</p>
            <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</p>
          </div>
        );
      })}
    </div>
  );
}
