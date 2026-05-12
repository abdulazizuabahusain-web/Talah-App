import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CONSENT_KEY = "analytics_consent";

type ConsentStatus = "undecided" | "accepted" | "declined";

interface ConsentContextValue {
  consentStatus: ConsentStatus;
  acceptAnalytics: () => Promise<void>;
  declineAnalytics: () => Promise<void>;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>("undecided");

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_KEY)
      .then((val) => {
        if (val === "accepted") setConsentStatus("accepted");
        else if (val === "declined") setConsentStatus("declined");
        // else stays "undecided" → banner will show
      })
      .catch(() => {});
  }, []);

  const acceptAnalytics = useCallback(async () => {
    await AsyncStorage.setItem(CONSENT_KEY, "accepted");
    setConsentStatus("accepted");
  }, []);

  const declineAnalytics = useCallback(async () => {
    await AsyncStorage.setItem(CONSENT_KEY, "declined");
    setConsentStatus("declined");
  }, []);

  return (
    <ConsentContext.Provider value={{ consentStatus, acceptAnalytics, declineAnalytics }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}
