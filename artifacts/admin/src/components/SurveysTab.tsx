import { useMemo, useState } from "react";
import { type Survey } from "@/lib/api";

interface Props {
  surveys: Survey[];
}

const PAGE_SIZE = 20;

function userLabel(survey: Survey): string {
  return [survey.nickname ?? survey.userId.slice(0, 8), survey.city]
    .filter(Boolean)
    .join(" · ");
}

function mostCommonExitReason(exitSurveys: Survey[]): string {
  const counts = new Map<string, number>();
  for (const survey of exitSurveys) {
    const reason = survey.responses.reason ?? "—";
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
}

function SurveyTable({
  surveys,
  type,
}: {
  surveys: Survey[];
  type: "micro" | "exit";
}) {
  const [page, setPage] = useState(0);
  const pageRows = surveys.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasPrev = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < surveys.length;

  if (surveys.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        No {type} surveys yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">User</th>
              {type === "micro" ? (
                <>
                  <th className="text-left p-3">Source</th>
                  <th className="text-left p-3">Expectation</th>
                  <th className="text-left p-3">Word</th>
                </>
              ) : (
                <>
                  <th className="text-left p-3">Reason</th>
                  <th className="text-left p-3">Comment</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((survey) => (
              <tr key={survey.id} className="border-t border-border">
                <td className="p-3 whitespace-nowrap">
                  {new Date(survey.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3">{userLabel(survey)}</td>
                {type === "micro" ? (
                  <>
                    <td className="p-3">{survey.responses.source ?? "—"}</td>
                    <td className="p-3">
                      {survey.responses.expectation ?? "—"}
                    </td>
                    <td className="p-3">{survey.responses.word ?? "—"}</td>
                  </>
                ) : (
                  <>
                    <td className="p-3">{survey.responses.reason ?? "—"}</td>
                    <td className="p-3">{survey.responses.comment ?? "—"}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2">
        <button
          disabled={!hasPrev}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1.5 rounded-xl border border-border disabled:opacity-40"
        >
          Previous
        </button>
        <button
          disabled={!hasNext}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1.5 rounded-xl border border-border disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function SurveysTab({ surveys }: Props) {
  const { microSurveys, exitSurveys, commonReason } = useMemo(() => {
    const microSurveys = surveys.filter((survey) => survey.type === "micro");
    const exitSurveys = surveys.filter((survey) => survey.type === "exit");
    return {
      microSurveys,
      exitSurveys,
      commonReason: mostCommonExitReason(exitSurveys),
    };
  }, [surveys]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl p-4 bg-primary/10 text-primary">
          <p className="text-2xl font-bold">{microSurveys.length}</p>
          <p className="text-xs font-semibold">Micro-surveys</p>
        </div>
        <div className="rounded-2xl p-4 bg-destructive/10 text-destructive">
          <p className="text-2xl font-bold">{exitSurveys.length}</p>
          <p className="text-xs font-semibold">Exit surveys</p>
        </div>
        <div className="rounded-2xl p-4 bg-muted text-muted-foreground">
          <p className="text-lg font-bold truncate">{commonReason}</p>
          <p className="text-xs font-semibold">Most common exit reason</p>
        </div>
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Micro-Survey Responses</h2>
        <SurveyTable surveys={microSurveys} type="micro" />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Exit Survey Responses</h2>
        <SurveyTable surveys={exitSurveys} type="exit" />
      </section>
    </div>
  );
}
