import { useEffect, useState } from "react";
import { api, type Survey } from "@/lib/api";

const PAGE_SIZE = 20;

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1 flex-1 min-w-[140px]">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mostCommon(values: string[]): string {
  if (!values.length) return "—";
  const freq: Record<string, number> = {};
  for (const v of values) freq[v] = (freq[v] ?? 0) + 1;
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

export default function SurveysTab() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [microPage, setMicroPage] = useState(0);
  const [exitPage, setExitPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    api
      .getSurveys()
      .then(setSurveys)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const micro = surveys.filter((s) => s.type === "micro");
  const exit = surveys.filter((s) => s.type === "exit");

  const exitReasons = exit
    .map((s) => (s.responses as Record<string, string>).reason)
    .filter(Boolean);
  const topReason = mostCommon(exitReasons);

  const microSlice = micro.slice(microPage * PAGE_SIZE, (microPage + 1) * PAGE_SIZE);
  const exitSlice = exit.slice(exitPage * PAGE_SIZE, (exitPage + 1) * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Loading surveys…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive text-sm py-8 text-center">{error}</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="flex flex-wrap gap-4">
        <StatCard label="Micro surveys" value={micro.length} />
        <StatCard label="Exit surveys" value={exit.length} />
        <StatCard label="Top exit reason" value={topReason} />
      </div>

      {/* Micro-survey table */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Micro-Survey Responses</h2>
        {micro.length === 0 ? (
          <p className="text-sm text-muted-foreground">No micro-survey responses yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                    <th className="text-left px-4 py-2.5 font-medium">Date</th>
                    <th className="text-left px-4 py-2.5 font-medium">User</th>
                    <th className="text-left px-4 py-2.5 font-medium">Source</th>
                    <th className="text-left px-4 py-2.5 font-medium">Expectation</th>
                    <th className="text-left px-4 py-2.5 font-medium">Word</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {microSlice.map((s) => {
                    const r = (s.responses as Record<string, string>) ?? {};
                    return (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground tabular-nums whitespace-nowrap">
                          {formatDate(s.createdAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-medium">{s.nickname ?? "—"}</span>
                          {s.city && (
                            <span className="text-muted-foreground ml-1 text-xs">· {s.city}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">{r.source ?? "—"}</td>
                        <td className="px-4 py-2.5">{r.expectation ?? "—"}</td>
                        <td className="px-4 py-2.5 italic text-muted-foreground">{r.word || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              total={micro.length}
              page={microPage}
              setPage={setMicroPage}
              pageSize={PAGE_SIZE}
            />
          </>
        )}
      </section>

      {/* Exit survey table */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Exit Survey Responses</h2>
        {exit.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exit survey responses yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                    <th className="text-left px-4 py-2.5 font-medium">Date</th>
                    <th className="text-left px-4 py-2.5 font-medium">User</th>
                    <th className="text-left px-4 py-2.5 font-medium">Reason</th>
                    <th className="text-left px-4 py-2.5 font-medium">Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {exitSlice.map((s) => {
                    const r = (s.responses as Record<string, string>) ?? {};
                    return (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground tabular-nums whitespace-nowrap">
                          {formatDate(s.createdAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-medium">{s.nickname ?? "—"}</span>
                          {s.city && (
                            <span className="text-muted-foreground ml-1 text-xs">· {s.city}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">{r.reason ?? "—"}</td>
                        <td className="px-4 py-2.5 max-w-xs text-muted-foreground">
                          {r.comment || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              total={exit.length}
              page={exitPage}
              setPage={setExitPage}
              pageSize={PAGE_SIZE}
            />
          </>
        )}
      </section>
    </div>
  );
}

function Pagination({
  total,
  page,
  setPage,
  pageSize,
}: {
  total: number;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
      <button
        disabled={page === 0}
        onClick={() => setPage(page - 1)}
        className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
      >
        ← Prev
      </button>
      <span>
        Page {page + 1} / {totalPages}
      </span>
      <button
        disabled={page >= totalPages - 1}
        onClick={() => setPage(page + 1)}
        className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
      >
        Next →
      </button>
    </div>
  );
}
