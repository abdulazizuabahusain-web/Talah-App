import { useState } from "react";
import { api, type Report, type User } from "@/lib/api";

interface Props {
  reports: Report[];
  users: User[];
  onReportsChange: (reports: Report[]) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-amber-100 text-amber-700" },
  reviewed: { label: "Reviewed", color: "bg-blue-100 text-blue-700" },
  dismissed: { label: "Dismissed", color: "bg-muted text-muted-foreground" },
  actioned: { label: "Actioned", color: "bg-green-100 text-green-700" },
};

const CATEGORY_LABELS: Record<string, string> = {
  uncomfortable: "Uncomfortable behavior",
  noshow: "No-show",
  not_suitable: "Not suitable for group",
  inappropriate: "Inappropriate behavior",
  other: "Other",
};

const STATUS_OPTIONS = ["open", "reviewed", "dismissed", "actioned"] as const;

export default function ReportsTab({ reports, users, onReportsChange }: Props) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const userById = (id: string) => users.find((u) => u.id === id);

  const filtered = filterStatus ? reports.filter((r) => r.status === filterStatus) : reports;

  const handleStatusChange = async (r: Report, newStatus: string) => {
    setUpdating(r.id);
    try {
      const updated = await api.patchReport(r.id, newStatus);
      onReportsChange(reports.map((x) => (x.id === r.id ? updated : x)));
    } catch {
      // ignore
    } finally {
      setUpdating(null);
    }
  };

  if (reports.length === 0) {
    return <p className="text-muted-foreground text-center py-12">No reports yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          className="text-sm px-3 py-1.5 rounded-xl border border-input bg-background"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">{filtered.length} report{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const reporter = userById(r.reporterId);
          const target = userById(r.targetUserId);
          const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG["open"];

          return (
            <div key={r.id} className="bg-card rounded-2xl border border-destructive/30 p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-semibold">
                    Report
                  </span>
                  <span className="text-sm font-semibold">{reporter?.nickname ?? r.reporterId.slice(0, 8)}</span>
                  <span className="text-sm text-muted-foreground">→</span>
                  <span className="text-sm font-semibold">{target?.nickname ?? r.targetUserId.slice(0, 8)}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>

              {/* Category */}
              {r.reportCategory && (
                <p className="text-xs font-semibold text-muted-foreground">
                  Category: {CATEGORY_LABELS[r.reportCategory] ?? r.reportCategory}
                </p>
              )}

              {/* Reason / details */}
              {r.reason && r.reason !== r.reportCategory && (
                <p className="text-sm text-foreground">{r.reason}</p>
              )}
              {r.details && (
                <p className="text-sm text-muted-foreground italic">"{r.details}"</p>
              )}

              {/* Timestamp */}
              <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</p>

              {/* Status actions */}
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.filter((s) => s !== r.status).map((s) => {
                  const c = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(r, s)}
                      disabled={updating === r.id}
                      className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
                    >
                      → {c?.label ?? s}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
