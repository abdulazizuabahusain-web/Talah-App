import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ConsentBanner } from "@/components/ConsentBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/contexts/AppContext";
import { ConsentProvider } from "@/contexts/ConsentContext";
import { DataProvider } from "@/contexts/DataContext";
import { track } from "@/lib/analytics";
import { initSentry, wrapWithSentry } from "@/lib/sentry";

const sentryDsn = Constants.expoConfig?.extra?.["sentryDsn"] as string | undefined;
initSentry(sentryDsn);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const segments = useSegments();

  useEffect(() => {
    void track("screen_view", null, { screen: segments.join("/") || "index" });
  }, [segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F5EFE6" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="request" />
      <Stack.Screen
        name="reveal/[id]"
        options={{ presentation: "card" }}
      />
      <Stack.Screen name="feedback/[id]" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="code-of-conduct" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
    </Stack>
  );
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    void track("app_opened");
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current === "active" && nextState.match(/inactive|background/)) {
        void track("app_backgrounded");
      }
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        void track("app_opened");
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <ConsentProvider>
                <AppProvider>
                  <DataProvider>
                    <RootLayoutNav />
                    <ConsentBanner />
                  </DataProvider>
                </AppProvider>
              </ConsentProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}


export default wrapWithSentry(RootLayout);
