import { useState } from "react";
import { Download, Search, X } from "lucide-react";
import { type WaitlistSignup } from "@/lib/api";

interface Props {
  signups: WaitlistSignup[];
  total: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Neutralize CSV formula injection: prefix a leading =, +, -, or @ with an apostrophe. */
function sanitizeCsvValue(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function exportCsv(signups: WaitlistSignup[]) {
  const header = "Name,Phone,Signed Up";
  const rows = signups.map((s) => {
    const name = `"${sanitizeCsvValue(s.name).replace(/"/g, '""')}"`;
    const phone = `"${sanitizeCsvValue(s.phone).replace(/"/g, '""')}"`;
    const date = `"${new Date(s.createdAt).toISOString()}"`;
    return `${name},${phone},${date}`;
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Highlight matching substring within text. */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function WaitlistTab({ signups, total }: Props) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const filtered = trimmed
    ? signups.filter(
        (s) =>
          s.name.toLowerCase().includes(trimmed.toLowerCase()) ||
          s.phone.toLowerCase().includes(trimmed.toLowerCase()),
      )
    : signups;

  if (signups.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        No waitlist signups yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {trimmed ? (
            <>
              <span className="font-semibold text-foreground">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">{total}</span>{" "}
              {total === 1 ? "signup" : "signups"} match
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground">{total}</span>{" "}
              {total === 1 ? "signup" : "signups"} — newest first
            </>
          )}
        </p>
        <button
          onClick={() => exportCsv(signups)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Phone
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
                  Signed Up
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No results for &ldquo;{trimmed}&rdquo;
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Highlight text={s.name} query={trimmed} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      <Highlight text={s.phone} query={trimmed} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(s.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
