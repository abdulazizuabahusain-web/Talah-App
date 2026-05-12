import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { setAnalyticsConsent } from "@/lib/analytics";

export type AnalyticsConsent = "accepted" | "declined" | null;

interface ConsentContextValue {
  consent: AnalyticsConsent;
  ready: boolean;
  accept: () => Promise<void>;
  decline: () => Promise<void>;
}

const STORAGE_KEY = "analytics_consent";
const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<AnalyticsConsent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!mounted) return;
        const nextConsent = value === "accepted" || value === "declined" ? value : null;
        setConsent(nextConsent);
        setAnalyticsConsent(nextConsent === "accepted");
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (nextConsent: Exclude<AnalyticsConsent, null>) => {
    await AsyncStorage.setItem(STORAGE_KEY, nextConsent);
    setConsent(nextConsent);
    setAnalyticsConsent(nextConsent === "accepted");
  }, []);

  const value = useMemo<ConsentContextValue>(() => ({
    consent,
    ready,
    accept: () => persist("accepted"),
    decline: () => persist("declined"),
  }), [consent, persist, ready]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const value = useContext(ConsentContext);
  if (!value) throw new Error("useConsent must be used inside ConsentProvider");
  return value;
}
