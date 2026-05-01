import { useEffect, useState } from "react";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import { api } from "@/lib/api";

type AuthState = "loading" | "unauthenticated" | "authenticated";

export default function App() {
  const [auth, setAuth] = useState<AuthState>("loading");

  useEffect(() => {
    api.adminMe()
      .then(() => setAuth("authenticated"))
      .catch(() => setAuth("unauthenticated"));
  }, []);

  if (auth === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (auth === "unauthenticated") {
    return <LoginPage onLogin={() => setAuth("authenticated")} />;
  }

  return <DashboardPage onLogout={() => setAuth("unauthenticated")} />;
}
