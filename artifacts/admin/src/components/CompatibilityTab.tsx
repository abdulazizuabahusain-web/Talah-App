import { useState } from "react";
import {
  api,
  type Candidate,
  type CompatibilityReport,
  type MeetupRequest,
  type User,
} from "@/lib/api";

// ── helpers ──────────────────────────────────────────────────────────────────

const LABEL_STYLE: Record<string, string> = {
  excellent: "text-primary bg-primary/15",
  good: "text-emerald-700 bg-emerald-100",
  moderate: "text-accent bg-accent/15",
  weak: "text-destructive bg-destructive/15",
};

function overlap(a: string[], b: string[]): string[] {
  const sb = new Set(b);
  return a.filter((x) => sb.has(x));
}

function scoreBadgeClass(score: number) {
  if (score >= 80) return "bg-primary/15 text-primary";
  if (score >= 60) return "bg-emerald-100 text-emerald-700";
  if (score >= 40) return "bg-accent/15 text-accent";
  return "bg-muted text-muted-foreground";
}

// ── types ─────────────────────────────────────────────────────────────────────

type Mode = "from-request" | "manual";

interface Props {
  users: User[];
  requests: MeetupRequest[];
  onRefresh: () => void;
}

// ── main component ───────────────────────────────────────────────────────────

export default function CompatibilityTab({ users, requests, onRefresh }: Props) {
  const [mode, setMode] = useState<Mode>("from-request");

  // shared
  const [selected, setSelected] = useState<string[]>([]);
  const [report, setReport] = useState<CompatibilityReport | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [area, setArea] = useState("");
  const [venue, setVenue] = useState("");
  const [dateStr, setDateStr] = useState("");

  // from-request mode
  const [anchorRequest, setAnchorRequest] = useState<MeetupRequest | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  // manual mode
  const [genderFilter, setGenderFilter] = useState<"woman" | "man" | null>(null);
  const [cityFilter, setCityFilter] = useState<string>("");
  const [pendingOnly, setPendingOnly] = useState(true);

  // ── derived ──────────────────────────────────────────────────────────────

  const pendingRequests = requests.filter((r) => r.status === "pending");

  const anchorUser = anchorRequest
    ? users.find((u) => u.id === anchorRequest.userId) ?? null
    : null;

  // For manual mode: all unique cities from onboarded users
  const cities = [...new Set(users.filter((u) => u.onboarded).map((u) => u.city).filter(Boolean) as string[])].sort();

  const manualPool = users.filter((u) => {
    if (!u.onboarded) return false;
    if (genderFilter && u.gender !== genderFilter) return false;
    if (cityFilter && u.city !== cityFilter) return false;
    if (pendingOnly && !requests.some((r) => r.userId === u.id && r.status === "pending")) return false;
    return true;
  });

  // The "locked" gender+city come from either the anchor or the manual filters
  const lockedGender = mode === "from-request" ? anchorUser?.gender ?? null : genderFilter;
  const lockedCity = mode === "from-request" ? anchorUser?.city ?? null : (cityFilter || null);

  // ── actions ──────────────────────────────────────────────────────────────

  const reset = () => {
    setSelected([]);
    setReport(null);
    setCalcError(null);
    setCreateSuccess(false);
    setArea("");
    setVenue("");
    setDateStr("");
  };

  const selectAnchorRequest = async (req: MeetupRequest) => {
    reset();
    setAnchorRequest(req);
    setSelected([req.userId]);
    setCandidates([]);
    setCandidatesLoading(true);
    try {
      const list = await api.getCandidates(req.id);
      setCandidates(list);
    } catch {
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    reset();
    setAnchorRequest(null);
    setCandidates([]);
    setGenderFilter(null);
    setCityFilter("");
    setMode(m);
  };

  const toggleUser = (id: string) => {
    if (id === anchorRequest?.userId) return; // anchor can't be deselected
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
    setCalcLoading(true);
    setCalcError(null);
    try {
      const r = await api.checkCompatibility(selected);
      setReport(r);
    } catch (e) {
      setCalcError(e instanceof Error ? e.message : "Error");
    } finally {
      setCalcLoading(false);
    }
  };

  const createGroup = async () => {
    if (!lockedGender || !lockedCity || selected.length < 3 || !area.trim()) return;
    setCreating(true);
    setCalcError(null);
    try {
      const meetupTs = dateStr ? new Date(dateStr.replace(" ", "T")).getTime() : undefined;
      const pendingRequestIds = selected
        .map((uid) => requests.find((r) => r.userId === uid && r.status === "pending")?.id)
        .filter((id): id is string => !!id);

      const coffeePending = pendingRequestIds.filter(
        (id) => requests.find((r) => r.id === id)?.meetupType === "coffee",
      ).length;
      const meetupType: "coffee" | "dinner" =
        coffeePending >= pendingRequestIds.length / 2 ? "coffee" : "dinner";

      await api.createGroup({
        meetupType: pendingRequestIds.length > 0 ? meetupType : "coffee",
        gender: lockedGender as "woman" | "man",
        city: lockedCity,
        area: area.trim(),
        memberIds: selected,
        requestIds: pendingRequestIds.length > 0 ? pendingRequestIds : undefined,
        venue: venue.trim() || undefined,
        meetupAt: meetupTs && !isNaN(meetupTs) ? meetupTs : undefined,
      });
      setCreateSuccess(true);
      onRefresh();
    } catch (e) {
      setCalcError(e instanceof Error ? e.message : "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Mode switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => switchMode("from-request")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${mode === "from-request" ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:bg-muted"}`}
        >
          🎯 Start from a request
        </button>
        <button
          onClick={() => switchMode("manual")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${mode === "manual" ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:bg-muted"}`}
        >
          ✋ Pick manually
        </button>
      </div>

      {/* ── FROM-REQUEST MODE ─────────────────────────────────────────────── */}
      {mode === "from-request" && (
        <>
          {/* Anchor request picker */}
          <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 space-y-3">
            <p className="font-semibold text-accent text-sm">Step 1 — Choose an anchor request</p>
            <p className="text-xs text-muted-foreground">
              Pick a pending request. Its gender and city will lock the pool, and candidates will be pre-ranked by compatibility score.
            </p>
            {pendingRequests.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">No pending requests.</p>
            )}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
              {pendingRequests.map((req) => {
                const u = users.find((u) => u.id === req.userId);
                const isAnchor = anchorRequest?.id === req.id;
                return (
                  <button
                    key={req.id}
                    onClick={() => selectAnchorRequest(req)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isAnchor ? "border-accent bg-accent/15" : "border-border bg-background hover:bg-muted"}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isAnchor ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                      {isAnchor ? "⚓" : (u?.nickname ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{u?.nickname ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {u?.city ?? "—"} · {u?.gender ?? "—"} · {req.meetupType} · {req.preferredDate}
                      </p>
                    </div>
                    {isAnchor && (
                      <span className="text-xs font-semibold text-accent bg-accent/20 px-2 py-0.5 rounded-full flex-shrink-0">anchor</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Candidate list — shown after anchor chosen */}
          {anchorRequest && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-foreground">
                  Step 2 — Add candidates{" "}
                  <span className="text-muted-foreground font-normal">
                    ({selected.length}/5 selected · need {Math.max(0, 3 - selected.length)} more)
                  </span>
                </p>
                {anchorUser && (
                  <div className="flex gap-1.5">
                    <FilterChip label={anchorUser.gender === "woman" ? "👩 Women" : "👨 Men"} />
                    <FilterChip label={`📍 ${anchorUser.city}`} />
                  </div>
                )}
              </div>

              {candidatesLoading && (
                <p className="text-sm text-muted-foreground text-center py-4">Loading candidates…</p>
              )}

              {!candidatesLoading && candidates.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-xl">
                  No compatible candidates found for this request.
                </p>
              )}

              {/* Anchor user card (pre-selected, locked) */}
              {anchorUser && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-accent bg-accent/10">
                  <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center flex-shrink-0 text-xs font-bold">⚓</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{anchorUser.nickname ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{anchorUser.city ?? "—"} · {anchorUser.ageRange ?? "—"} · {anchorRequest.meetupType}</p>
                  </div>
                  <span className="text-xs font-semibold text-accent">anchor</span>
                </div>
              )}

              {/* Ranked candidate cards */}
              {candidates.map((c) => {
                const isSelected = selected.includes(c.userId);
                const u = users.find((u) => u.id === c.userId);
                const dayOverlap = anchorUser
                  ? overlap(anchorUser.preferredDays, u?.preferredDays ?? [])
                  : [];
                const timeOverlap = anchorUser
                  ? overlap(anchorUser.preferredTimes, u?.preferredTimes ?? [])
                  : [];
                const noOverlap = dayOverlap.length === 0 && timeOverlap.length === 0;

                return (
                  <button
                    key={c.userId}
                    onClick={() => toggleUser(c.userId)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${isSelected ? "border-accent bg-accent/10" : noOverlap ? "border-amber-200 bg-amber-50/50 opacity-75" : "border-border bg-card hover:bg-muted"}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${isSelected ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                      {isSelected ? "✓" : (c.nickname ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{c.nickname ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.city ?? "—"} · {c.ageRange ?? "—"} · {c.preferredMeetup ?? "—"}
                      </p>
                      {noOverlap && (
                        <p className="text-xs text-amber-600 mt-0.5">⚠ No day/time overlap with anchor</p>
                      )}
                      {!noOverlap && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Days: {dayOverlap.join(", ") || "—"} · Times: {timeOverlap.join(", ") || "—"}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${scoreBadgeClass(c.score * 10)}`}>
                        {c.score}/10
                      </span>
                      <span className="text-xs text-muted-foreground">{c.preferredDate}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── MANUAL MODE ───────────────────────────────────────────────────── */}
      {mode === "manual" && (
        <>
          <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 space-y-3">
            <p className="font-semibold text-accent text-sm">Filters — narrow the pool first</p>

            {/* Gender */}
            <div className="flex gap-2">
              <button
                onClick={() => { setGenderFilter("woman"); setSelected([]); setReport(null); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${genderFilter === "woman" ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:bg-muted"}`}
              >
                👩 Women-only
              </button>
              <button
                onClick={() => { setGenderFilter("man"); setSelected([]); setReport(null); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${genderFilter === "man" ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:bg-muted"}`}
              >
                👨 Men-only
              </button>
            </div>

            {/* City */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">City</label>
              <select
                className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setSelected([]); setReport(null); }}
              >
                <option value="">All cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Pending only toggle */}
            <button
              onClick={() => { setPendingOnly((v) => !v); setSelected([]); setReport(null); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm font-medium transition-all ${pendingOnly ? "border-accent bg-accent/10 text-accent" : "border-border bg-card text-muted-foreground"}`}
            >
              <span>Show pending-request users only</span>
              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${pendingOnly ? "bg-accent border-accent" : "border-muted-foreground"}`} />
            </button>

            {genderFilter && (
              <p className="text-xs text-muted-foreground">
                {manualPool.length} user{manualPool.length !== 1 ? "s" : ""} match · select {selected.length}/5
              </p>
            )}
          </div>

          {/* User list */}
          {genderFilter && (
            <div className="space-y-2">
              {manualPool.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6 bg-muted/50 rounded-xl">
                  No users match the current filters.
                </p>
              )}
              {manualPool.map((u) => {
                const isSelected = selected.includes(u.id);
                const hasPending = requests.some((r) => r.userId === u.id && r.status === "pending");

                // city conflict with any already-selected user
                const selUsers = selected.map((id) => users.find((x) => x.id === id)).filter(Boolean) as User[];
                const cityConflict = selUsers.length > 0 && u.city !== selUsers[0]?.city;

                // Day overlap with first selected user
                const ref = selUsers[0];
                const dayOv = ref ? overlap(ref.preferredDays, u.preferredDays) : [];

                return (
                  <button
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    disabled={!isSelected && (selected.length >= 5 || cityConflict)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left
                      ${isSelected ? "border-accent bg-accent/10" : ""}
                      ${cityConflict && !isSelected ? "opacity-40 cursor-not-allowed border-destructive/30" : ""}
                      ${!isSelected && !cityConflict ? "border-border bg-card hover:bg-muted" : ""}
                    `}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${isSelected ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                      {isSelected ? "✓" : (u.nickname ?? u.email ?? u.phone).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm">{u.nickname ?? "—"}</p>
                        {hasPending && <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">pending</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.city ?? "—"} · {u.ageRange ?? "—"} · {u.preferredMeetup ?? "—"}</p>
                      {ref && !cityConflict && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {dayOv.length > 0 ? `Days: ${dayOv.join(", ")}` : "⚠ No day overlap"}
                        </p>
                      )}
                      {cityConflict && (
                        <p className="text-xs text-destructive mt-0.5">✗ Different city — cannot be in same group</p>
                      )}
                    </div>
                    {u.socialEnergyScore != null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${scoreBadgeClass(u.socialEnergyScore)}`}>
                        E {u.socialEnergyScore}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Calculate button ── */}
      {selected.length >= 3 && (
        <button
          onClick={calculate}
          disabled={calcLoading}
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {calcLoading ? "Calculating…" : `Calculate Compatibility (${selected.length} users)`}
        </button>
      )}
      {selected.length > 0 && selected.length < 3 && (
        <p className="text-center text-xs text-muted-foreground">Select {3 - selected.length} more to calculate</p>
      )}

      {calcError && <p className="text-destructive text-sm bg-destructive/10 rounded-xl p-3">{calcError}</p>}

      {report && <CompatibilityResult report={report} />}

      {/* ── Create Group ── */}
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
            {creating
              ? "Creating group…"
              : `Create ${lockedGender === "woman" ? "Women's" : "Men's"} Tal'ah Group (${selected.length} members)`}
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
            onClick={() => { reset(); setAnchorRequest(null); setCandidates([]); setGenderFilter(null); setCityFilter(""); }}
            className="mt-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors"
          >
            Create another group
          </button>
        </div>
      )}
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function FilterChip({ label }: { label: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap">
      {label}
    </span>
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
        r.availabilityOk
          ? `✓ Common days: ${r.commonDays.join(", ")} / ${r.commonTimes.join(", ")}`
          : "✗ No availability overlap",
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
