import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";

import { api, setToken, toUser } from "@/lib/api";
import { track } from "@/lib/analytics";
import { loadJSON, saveJSON } from "@/lib/storage";
import type { User } from "@/lib/types";

// Request push permissions and return the Expo push token, or null if unavailable.
async function registerForPushAsync(): Promise<string | null> {
  // Push tokens only work on physical devices and iOS/Android — not web or simulator
  if (Platform.OS === "web") return null;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;
    const { data } = await Notifications.getExpoPushTokenAsync();
    return data;
  } catch {
    return null;
  }
}

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

// Configure how notifications appear while the app is in the foreground.
// Without this, foreground notifications are silently dropped on iOS.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const STORAGE_LANG = "talah:lang";
const STORAGE_TOKEN = "talah:token";

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [language, setLanguageState] = useState<Lang>("ar");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const pushRegistered = useRef(false);

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

  // Register for push notifications once after the user is authenticated
  useEffect(() => {
    if (!currentUser || pushRegistered.current) return;
    pushRegistered.current = true;
    registerForPushAsync().then((token) => {
      if (token) {
        // Fire-and-forget — store token on the user record server-side
        api.updateMe({ expoPushToken: token } as Parameters<typeof api.updateMe>[0]).catch(() => {});
      }
    });
  }, [currentUser]);

  // Handle taps on push notifications — navigate to the appropriate screen.
  // This fires whether the app was in background or completely quit (cold launch).
  // Both APIs are unavailable on web — guard to avoid an uncaught error.
  useEffect(() => {
    if (Platform.OS === "web") return;

    // Check if the app was launched via a notification tap (cold start)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const groupId = response.notification.request.content.data?.groupId as string | undefined;
      void track("notification_tapped", null, { screen: groupId ? "reveal" : "unknown" });
      if (groupId) router.push(`/reveal/${groupId}`);
    });

    // Subscribe to notification taps while app is running
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const groupId = response.notification.request.content.data?.groupId as string | undefined;
      void track("notification_tapped", null, { screen: groupId ? "reveal" : "unknown" });
      if (groupId) router.push(`/reveal/${groupId}`);
    });

    return () => sub.remove();
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
