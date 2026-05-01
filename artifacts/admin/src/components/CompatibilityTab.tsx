import { useState } from "react";
import { api, type CompatibilityReport, type User } from "@/lib/api";

const LABEL_STYLE: Record<string, string> = {
  excellent: "text-primary bg-primary/15",
  good: "text-emerald-700 bg-emerald-100",
  moderate: "text-accent bg-accent/15",
  weak: "text-destructive bg-destructive/15",
};

interface Props {
  users: User[];
}

export default function CompatibilityTab({ users }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [report, setReport] = useState<CompatibilityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
      setReport(null);
    } else if (selected.length < 5) {
      setSelected([...selected, id]);
      setReport(null);
    }
  };

  const calculate = async () => {
    if (selected.length < 3) return;
    setLoading(true);
    setError(null);
    try {
      const r = await api.checkCompatibility(selected);
      setReport(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4">
        <p className="font-semibold text-accent">Group Compatibility Calculator</p>
        <p className="text-sm text-muted-foreground mt-1">Select 3–5 users to analyse how well they'd work as a group.</p>
        <p className="text-sm font-medium text-foreground mt-2">{selected.length}/5 selected</p>
      </div>

      <div className="space-y-2">
        {users.map((u) => {
          const isSelected = selected.includes(u.id);
          return (
            <button
              key={u.id}
              onClick={() => toggle(u.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${isSelected ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-muted"}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                {isSelected ? "✓" : <span className="font-bold">{(u.nickname ?? u.phone).charAt(0).toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{u.nickname ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{u.city ?? "—"} · {u.gender ?? "—"} · {u.ageRange ?? "—"}</p>
              </div>
              {u.socialEnergyScore !== null && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.socialEnergyScore! > 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  E {u.socialEnergyScore! > 0 ? "+" : ""}{u.socialEnergyScore}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected.length >= 3 && (
        <button
          onClick={calculate}
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Calculating…" : "Calculate Compatibility"}
        </button>
      )}

      {error && <p className="text-destructive text-sm bg-destructive/10 rounded-xl p-3">{error}</p>}

      {report && <CompatibilityResult report={report} />}
    </div>
  );
}

function CompatibilityResult({ report: r }: { report: CompatibilityReport }) {
  return (
    <div className="space-y-3">
      <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center gap-3">
        <p className="text-5xl font-bold text-foreground">{r.overallScore}%</p>
        <span className={`text-sm font-semibold px-4 py-1.5 rounded-full capitalize ${LABEL_STYLE[r.label]}`}>{r.label}</span>
      </div>

      {r.warnings.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 space-y-1.5">
          {r.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-destructive mt-0.5 flex-shrink-0">⚠</span>
              <p className="text-sm text-destructive">{w}</p>
            </div>
          ))}
        </div>
      )}

      <CheckCard label="Hard Filters" ok={r.genderOk && r.cityOk && r.availabilityOk} notes={[
        r.genderOk ? "✓ Same gender" : "✗ Mixed genders",
        r.cityOk ? "✓ Same city" : "✗ Different cities",
        r.availabilityOk ? `✓ Common days: ${r.commonDays.join(", ")} / ${r.commonTimes.join(", ")}` : "✗ No availability overlap",
      ]} />
      <CheckCard label="Shared Interests" ok={r.interestOverlapPct >= 40} notes={[
        `${r.interestOverlapPct}% overlap`,
        r.sharedInterests.length > 0 ? `Shared: ${r.sharedInterests.slice(0, 5).join(", ")}` : "No shared interests",
      ]} />
      <CheckCard label="Lifestyle" ok={r.lifestyleAligned} notes={[r.lifestyleNote]} />
      <CheckCard label="Social Energy" ok={r.energyBalance === "balanced"} notes={[r.energyNote]} />
      <CheckCard label="Conversation Style" ok={r.convCompatible} notes={[r.convNote]} />
      <CheckCard label="Intent & Boundary" ok={!r.boundaryNote.startsWith("Caution")} notes={[r.intentNote, r.boundaryNote]} />
    </div>
  );
}

function CheckCard({ label, ok, notes }: { label: string; ok: boolean; notes: string[] }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${ok ? "bg-primary/20 text-primary" : "bg-destructive/15 text-destructive"}`}>
          {ok ? "✓" : "✗"}
        </div>
        <p className="font-semibold text-sm">{label}</p>
      </div>
      {notes.map((n, i) => (
        <p key={i} className="text-xs text-muted-foreground pl-8">{n}</p>
      ))}
    </div>
  );
}
