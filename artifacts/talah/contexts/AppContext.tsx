import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { genId, loadJSON, saveJSON } from "@/lib/storage";
import type { User } from "@/lib/types";

type Lang = "ar" | "en";

interface AppContextValue {
  ready: boolean;
  language: Lang;
  setLanguage: (l: Lang) => void;
  currentUser: User | null;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  loginByPhone: (phone: string) => Promise<User>;
  updateCurrentUser: (patch: Partial<User>) => Promise<void>;
  setCurrentUserId: (id: string | null) => void;
  signOut: () => Promise<void>;
  // For DataContext to refresh user reference after edits
  hydrateCurrentUserFromList: (users: User[]) => void;
}

const STORAGE_LANG = "talah:lang";
const STORAGE_USER_ID = "talah:currentUserId";
const STORAGE_USERS = "talah:users";

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [language, setLanguageState] = useState<Lang>("ar");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const lang = await loadJSON<Lang>(STORAGE_LANG, "ar");
      const userId = await loadJSON<string | null>(STORAGE_USER_ID, null);
      setLanguageState(lang);
      if (userId) {
        const users = await loadJSON<User[]>(STORAGE_USERS, []);
        const u = users.find((x) => x.id === userId) ?? null;
        setCurrentUser(u);
      }
      setReady(true);
    })();
  }, []);

  const setLanguage = useCallback((l: Lang) => {
    setLanguageState(l);
    saveJSON(STORAGE_LANG, l);
  }, []);

  const loginByPhone = useCallback(async (phone: string): Promise<User> => {
    const users = await loadJSON<User[]>(STORAGE_USERS, []);
    const existing = users.find((u) => u.phone === phone);
    if (existing) {
      setCurrentUser(existing);
      await saveJSON(STORAGE_USER_ID, existing.id);
      return existing;
    }
    const newUser: User = {
      id: genId("u"),
      phone,
      nickname: "",
      gender: "woman",
      city: "",
      ageRange: "25-29",
      lifestyle: "employee",
      interests: [],
      personality: "calm",
      preferredMeetup: "coffee",
      preferredDays: [],
      preferredTimes: [],
      funFact: "",
      verified: false,
      flagged: false,
      onboarded: false,
      createdAt: Date.now(),
    };
    const next = [...users, newUser];
    await saveJSON(STORAGE_USERS, next);
    await saveJSON(STORAGE_USER_ID, newUser.id);
    setCurrentUser(newUser);
    return newUser;
  }, []);

  const updateCurrentUser = useCallback(
    async (patch: Partial<User>) => {
      if (!currentUser) return;
      const merged = { ...currentUser, ...patch };
      setCurrentUser(merged);
      const users = await loadJSON<User[]>(STORAGE_USERS, []);
      const next = users.map((u) => (u.id === merged.id ? merged : u));
      await saveJSON(STORAGE_USERS, next);
    },
    [currentUser],
  );

  const setCurrentUserId = useCallback((id: string | null) => {
    saveJSON(STORAGE_USER_ID, id);
  }, []);

  const signOut = useCallback(async () => {
    setCurrentUser(null);
    setIsAdmin(false);
    await saveJSON(STORAGE_USER_ID, null);
  }, []);

  const hydrateCurrentUserFromList = useCallback(
    (users: User[]) => {
      if (!currentUser) return;
      const updated = users.find((u) => u.id === currentUser.id);
      if (updated) setCurrentUser(updated);
    },
    [currentUser],
  );

  const value = useMemo(
    () => ({
      ready,
      language,
      setLanguage,
      currentUser,
      isAdmin,
      setIsAdmin,
      loginByPhone,
      updateCurrentUser,
      setCurrentUserId,
      signOut,
      hydrateCurrentUserFromList,
    }),
    [
      ready,
      language,
      setLanguage,
      currentUser,
      isAdmin,
      loginByPhone,
      updateCurrentUser,
      setCurrentUserId,
      signOut,
      hydrateCurrentUserFromList,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
