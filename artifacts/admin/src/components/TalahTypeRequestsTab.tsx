import { useState } from "react";
import { api, type TalahTypeChangeRequest } from "@/lib/api";

interface Props {
  requests: TalahTypeChangeRequest[];
  onRefresh: () => void;
}

function genderLabel(g: string) {
  return g === "woman" ? "Women-only" : "Men-only";
}

function statusBadge(status: string) {
  if (status === "pending")
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        Pending
      </span>
    );
  if (status === "approved")
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary">
        Approved
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-destructive/15 text-destructive">
      Rejected
    </span>
  );
}

function RequestCard({
  req,
  onApprove,
  onReject,
  actionLoading,
}: {
  req: TalahTypeChangeRequest;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, notes: string) => void;
  actionLoading: string | null;
}) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(req.status === "pending");
  const isPending = req.status === "pending";

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header row */}
      <button
        className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground truncate">
              {req.nickname ?? req.userId.slice(0, 8)}
            </span>
            {statusBadge(req.status)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <span className="font-medium">{genderLabel(req.currentGender)}</span>
            <span>→</span>
            <span className="font-medium text-accent">{genderLabel(req.requestedGender)}</span>
            <span>·</span>
            <span>{new Date(req.requestedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
        <span className="text-muted-foreground text-sm">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 flex flex-col gap-3">
          {/* Reason */}
          {req.reason ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Reason</p>
              <p className="text-sm text-foreground bg-muted rounded-xl px-3 py-2">{req.reason}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No reason provided</p>
          )}

          {/* Admin notes (reviewed) */}
          {!isPending && req.adminNotes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Admin notes</p>
              <p className="text-sm text-foreground bg-muted rounded-xl px-3 py-2">{req.adminNotes}</p>
            </div>
          )}

          {/* Reviewed info */}
          {!isPending && req.reviewedAt && (
            <p className="text-xs text-muted-foreground">
              Reviewed {new Date(req.reviewedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}

          {/* Approve / Reject for pending */}
          {isPending && (
            <div className="flex flex-col gap-2 pt-1">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Admin notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes to the user…"
                  maxLength={500}
                  rows={2}
                  className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2 text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onReject(req.id, notes)}
                  disabled={actionLoading !== null}
                  className="flex-1 py-2 rounded-xl border border-destructive/40 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  {actionLoading === `reject-${req.id}` ? "Rejecting…" : "Reject"}
                </button>
                <button
                  onClick={() => onApprove(req.id, notes)}
                  disabled={actionLoading !== null}
                  className="flex-[2] py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {actionLoading === `approve-${req.id}` ? "Approving…" : "✓ Approve & Change Type"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TalahTypeRequestsTab({ requests, onRefresh }: Props) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  const handleApprove = async (id: string, notes: string) => {
    setActionLoading(`approve-${id}`);
    setError(null);
    try {
      await api.approveTypeChangeRequest(id, notes || undefined);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string, notes: string) => {
    setActionLoading(`reject-${id}`);
    setError(null);
    try {
      await api.rejectTypeChangeRequest(id, notes || undefined);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
        <span className="text-amber-600 mt-0.5 flex-shrink-0">⚠️</span>
        <p className="text-sm text-amber-800">
          <strong>Approving</strong> a Tal'ah Type change updates the user's gender and affects all
          future group matching. <strong>Existing groups are not modified.</strong>
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Pending section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-bold text-foreground">Pending</h2>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
              {pending.length}
            </span>
          )}
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No pending requests.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onApprove={handleApprove}
                onReject={handleReject}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reviewed section */}
      {reviewed.length > 0 && (
        <div>
          <h2 className="font-bold text-foreground mb-3">Reviewed ({reviewed.length})</h2>
          <div className="flex flex-col gap-3">
            {reviewed.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onApprove={handleApprove}
                onReject={handleReject}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
