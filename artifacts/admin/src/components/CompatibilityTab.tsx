import { useState } from "react";
import { api, type CompatibilityReport, type MeetupRequest, type User } from "@/lib/api";

const LABEL_STYLE: Record<string, string> = {
  excellent: "text-primary bg-primary/15",
  good: "text-emerald-700 bg-emerald-100",
  moderate: "text-accent bg-accent/15",
  weak: "text-destructive bg-destructive/15",
};

interface Props {
  users: User[];
  requests: MeetupRequest[];
  onRefresh: () => void;
}

export default function CompatibilityTab({ users, requests, onRefresh }: Props) {
  // ── Step 1: Admin must choose gender first — prevents cross-gender group creation ──
  const [genderFilter, setGenderFilter] = useState<"woman" | "man" | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [report, setReport] = useState<CompatibilityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Create Group form state
  const [area, setArea] = useState("");
  const [venue, setVenue] = useState("");
  const [dateStr, setDateStr] = useState("");

  const filteredUsers = genderFilter
    ? users.filter((u) => u.gender === genderFilter && u.onboarded)
    : [];

  const changeGender = (g: "woman" | "man") => {
    setGenderFilter(g);
    setSelected([]);
    setReport(null);
    setCreateSuccess(false);
  };

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

  const createGroup = async () => {
    if (!genderFilter || selected.length < 3 || !area.trim()) return;
    const firstUser = users.find((u) => u.id === selected[0]);
    if (!firstUser?.city) return;
    setCreating(true);
    setError(null);
    try {
      const meetupTs = dateStr ? new Date(dateStr.replace(" ", "T")).getTime() : undefined;

      // Find each selected user's pending request — auto-link and mark them as matched
      const pendingRequestIds = selected
        .map((userId) => requests.find((r) => r.userId === userId && r.status === "pending")?.id)
        .filter((id): id is string => !!id);

      // Derive meetup type from the majority of actual pending requests
      const coffeePending = pendingRequestIds.filter(
        (id) => requests.find((r) => r.id === id)?.meetupType === "coffee"
      ).length;
      const meetupType: "coffee" | "dinner" =
        coffeePending >= pendingRequestIds.length / 2 ? "coffee" : "dinner";

      await api.createGroup({
        meetupType: pendingRequestIds.length > 0 ? meetupType : ((firstUser.preferredMeetup ?? "coffee") as "coffee" | "dinner"),
        gender: genderFilter,
        city: firstUser.city,
        area: area.trim(),
        memberIds: selected,
        requestIds: pendingRequestIds.length > 0 ? pendingRequestIds : undefined,
        venue: venue.trim() || undefined,
        meetupAt: meetupTs && !isNaN(meetupTs) ? meetupTs : undefined,
      });
      setCreateSuccess(true);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Step 1: Gender selection — mandatory first step ── */}
      <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 space-y-3">
        <p className="font-semibold text-accent">Group Compatibility Calculator</p>
        <p className="text-sm text-muted-foreground">Step 1: Choose group type. Only same-gender groups are permitted.</p>
        <div className="flex gap-2">
          <button
            onClick={() => changeGender("woman")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${genderFilter === "woman" ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:bg-muted"}`}
          >
            👩 Women-only
          </button>
          <button
            onClick={() => changeGender("man")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${genderFilter === "man" ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:bg-muted"}`}
          >
            👨 Men-only
          </button>
        </div>
        {genderFilter && (
          <p className="text-sm font-medium text-foreground">
            Step 2: Select 3–5 users · <span className="text-accent">{selected.length}/5 selected</span>
          </p>
        )}
      </div>

      {/* ── Step 2: User selection — filtered by gender ── */}
      {genderFilter && (
        <div className="space-y-2">
          {filteredUsers.length === 0 && (
            <p className="text-muted-foreground text-center py-6 text-sm">
              No onboarded {genderFilter === "woman" ? "women" : "men"} found.
            </p>
          )}
          {filteredUsers.map((u) => {
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
                  <p className="text-xs text-muted-foreground">{u.city ?? "—"} · {u.ageRange ?? "—"} · {u.preferredMeetup ?? "—"}</p>
                </div>
                {u.socialEnergyScore !== null && u.socialEnergyScore !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.socialEnergyScore > 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    E {u.socialEnergyScore > 0 ? "+" : ""}{u.socialEnergyScore}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Calculate button ── */}
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

      {/* ── Step 3: Create Group — appears after compatibility calculated ── */}
      {report && !createSuccess && (
        <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-4">
          <div>
            <p className="font-semibold text-foreground">Create this group</p>
            <p className="text-sm text-muted-foreground mt-0.5">Fill in the details and create the Tal'ah group.</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Area *</label>
              <input
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. العليا, حي السفارات"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Venue (optional)</label>
              <input
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. مقهى مدد - العليا"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Meetup date & time (optional)</label>
              <input
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="YYYY-MM-DD HH:mm"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={createGroup}
            disabled={creating || !area.trim()}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {creating ? "Creating group…" : `Create ${genderFilter === "woman" ? "Women's" : "Men's"} Tal'ah Group (${selected.length} members)`}
          </button>
        </div>
      )}

      {createSuccess && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-5 text-center space-y-2">
          <p className="text-2xl">✅</p>
          <p className="font-semibold text-primary">Group created successfully!</p>
          <p className="text-sm text-muted-foreground">
            {selected.filter((uid) => requests.some((r) => r.userId === uid && r.status === "pending")).length > 0
              ? "Pending requests have been marked as matched."
              : "Go to Groups tab to set venue, time, and status."}
          </p>
          <button
            onClick={() => { setSelected([]); setReport(null); setArea(""); setVenue(""); setDateStr(""); setCreateSuccess(false); }}
            className="mt-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors"
          >
            Create another group
          </button>
        </div>
      )}
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
