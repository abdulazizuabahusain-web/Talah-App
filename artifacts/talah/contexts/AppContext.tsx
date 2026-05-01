import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api, setToken, toUser } from "@/lib/api";
import { loadJSON, saveJSON } from "@/lib/storage";
import type { User } from "@/lib/types";

type Lang = "ar" | "en";

interface AppContextValue {
  ready: boolean;
  language: Lang;
  setLanguage: (l: Lang) => void;
  currentUser: User | null;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  sendOtp: (phone: string) => Promise<{ code?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<User>;
  updateCurrentUser: (patch: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  hydrateCurrentUserFromList: (users: User[]) => void;
  setCurrentUserId: (id: string | null) => void;
}

const STORAGE_LANG = "talah:lang";
const STORAGE_TOKEN = "talah:token";

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [language, setLanguageState] = useState<Lang>("ar");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const lang = await loadJSON<Lang>(STORAGE_LANG, "ar");
      setLanguageState(lang);

      const token = await loadJSON<string | null>(STORAGE_TOKEN, null);
      if (token) {
        setToken(token);
        try {
          const apiUser = await api.me();
          setCurrentUser(toUser(apiUser));
        } catch {
          // Token expired or invalid – clear it
          setToken(null);
          await saveJSON(STORAGE_TOKEN, null);
        }
      }

      setReady(true);
    })();
  }, []);

  const setLanguage = useCallback((l: Lang) => {
    setLanguageState(l);
    saveJSON(STORAGE_LANG, l);
  }, []);

  const sendOtp = useCallback(async (phone: string): Promise<{ code?: string }> => {
    return api.sendOtp(phone);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string): Promise<User> => {
    const { token, user: apiUser } = await api.verifyOtp(phone, code);
    setToken(token);
    await saveJSON(STORAGE_TOKEN, token);
    const user = toUser(apiUser);
    setCurrentUser(user);
    return user;
  }, []);

  const updateCurrentUser = useCallback(
    async (patch: Partial<User>) => {
      if (!currentUser) return;
      const apiUser = await api.updateMe(patch as Parameters<typeof api.updateMe>[0]);
      const updated = toUser(apiUser);
      setCurrentUser(updated);
    },
    [currentUser],
  );

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout errors
    }
    setToken(null);
    setCurrentUser(null);
    setIsAdmin(false);
    await saveJSON(STORAGE_TOKEN, null);
  }, []);

  const hydrateCurrentUserFromList = useCallback(
    (users: User[]) => {
      if (!currentUser) return;
      const updated = users.find((u) => u.id === currentUser.id);
      if (updated) setCurrentUser(updated);
    },
    [currentUser],
  );

  const setCurrentUserId = useCallback((_id: string | null) => {
    // No-op in API mode – identity is tracked via token
  }, []);

  const value = useMemo(
    () => ({
      ready,
      language,
      setLanguage,
      currentUser,
      isAdmin,
      setIsAdmin,
      sendOtp,
      verifyOtp,
      updateCurrentUser,
      signOut,
      hydrateCurrentUserFromList,
      setCurrentUserId,
    }),
    [
      ready,
      language,
      setLanguage,
      currentUser,
      isAdmin,
      sendOtp,
      verifyOtp,
      updateCurrentUser,
      signOut,
      hydrateCurrentUserFromList,
      setCurrentUserId,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
