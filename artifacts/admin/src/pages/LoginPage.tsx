import { useState } from "react";
import { api, setToken } from "@/lib/api";

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await api.adminLogin(pin);
      setToken(token);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center p-4">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 talah-pill px-4 py-2 text-xs font-medium mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            لوحة تحكم طلعة
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.4rem] bg-primary shadow-lg shadow-primary/15 mb-4">
            <span className="text-2xl font-bold text-primary-foreground">
              ط
            </span>
          </div>
          <h1 className="text-3xl font-bold text-primary">Tal'ah Admin</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Enter your admin PIN to continue
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="talah-glass rounded-[1.5rem] p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Admin PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={8}
              className="w-full px-4 py-3 rounded-full border border-input bg-white/70 text-foreground text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-2xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-50 hover:bg-primary/90 active:scale-[0.98] transition"
          >
            {loading ? "Verifying…" : "Enter Dashboard"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4">
          طلعة · Tal'ah Admin Dashboard
        </p>
      </div>
    </div>
  );
}
