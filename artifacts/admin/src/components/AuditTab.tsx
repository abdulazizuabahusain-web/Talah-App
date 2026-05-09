import { useEffect, useState } from "react";
import { api, type AdminAuditLog } from "@/lib/api";

export default function AuditTab() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await api.getAuditLogs({ limit: 100, offset: 0 });
      setLogs(page.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load audit logs",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <p className="text-muted-foreground text-center py-12">
        Loading audit logs…
      </p>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-destructive">{error}</p>
        <button className="text-sm font-semibold underline" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        No audit events yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="bg-card rounded-2xl border border-border p-4 space-y-1"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
              {log.action}
            </span>
            <span className="text-sm font-semibold">{log.targetTable}</span>
            {log.targetId ? (
              <span className="text-xs text-muted-foreground">
                {log.targetId}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(log.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
