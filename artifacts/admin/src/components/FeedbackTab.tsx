import { type Feedback, type User } from "@/lib/api";

interface Props {
  feedback: Feedback[];
  users: User[];
}

export default function FeedbackTab({ feedback, users }: Props) {
  const userById = (id: string) => users.find((u) => u.id === id);

  if (feedback.length === 0) {
    return <p className="text-muted-foreground text-center py-12">No feedback yet.</p>;
  }

  return (
    <div className="space-y-3">
      {feedback.map((f) => {
        const from = userById(f.fromUserId);
        return (
          <div key={f.id} className="bg-card rounded-2xl border border-border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{from?.nickname ?? f.fromUserId}</p>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-base ${i < f.rating ? "text-accent" : "text-border"}`}>★</span>
                ))}
              </div>
            </div>
            {f.comment && <p className="text-sm text-muted-foreground italic">"{f.comment}"</p>}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {f.wouldMeetAgain && (
                <span>Would meet again: <strong className="text-foreground capitalize">{f.wouldMeetAgain}</strong></span>
              )}
              <span>{new Date(f.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
