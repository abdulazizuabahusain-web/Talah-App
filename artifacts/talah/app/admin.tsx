import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";

const ADMIN_PIN = "1234";

export default function AdminScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { isAdmin, setIsAdmin } = useApp();

  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={t("admin_pin_title")} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 14 }}>
            <Card>
              <View style={{ gap: 14 }}>
                <Input
                  label={t("admin_pin_title")}
                  placeholder="••••"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  value={pin}
                  onChangeText={setPin}
                  error={pinError ?? undefined}
                />
                <AppText variant="caption" color={colors.mutedForeground}>
                  {t("admin_pin_hint")}
                </AppText>
                <Button
                  label={t("verify")}
                  onPress={() => {
                    if (pin === ADMIN_PIN) { setIsAdmin(true); setPinError(null); }
                    else setPinError(t("invalid_otp"));
                  }}
                />
              </View>
            </Card>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t("admin_title")} />
      <View
        style={{
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: Math.max(insets.bottom, webBottomPad) + 24,
          gap: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppText variant="display" weight="bold" color={colors.primaryForeground}>
            ط
          </AppText>
        </View>

        <View style={{ gap: 8, alignItems: "center" }}>
          <AppText variant="h2" weight="bold" align="center">
            Tal'ah Admin Dashboard
          </AppText>
          <AppText variant="body" color={colors.mutedForeground} align="center">
            The admin panel has moved to the web dashboard for a better experience. Open it in your browser.
          </AppText>
        </View>

        <Card style={{ width: "100%" }}>
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
                <Feather name="users" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body" weight="semibold">Users & Requests</AppText>
                <AppText variant="caption" color={colors.mutedForeground}>Review profiles and pending meetup requests</AppText>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
                <Feather name="layers" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body" weight="semibold">Groups & Compatibility</AppText>
                <AppText variant="caption" color={colors.mutedForeground}>Create groups and run compatibility analysis</AppText>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
                <Feather name="flag" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body" weight="semibold">Feedback & Reports</AppText>
                <AppText variant="caption" color={colors.mutedForeground}>Monitor meetup quality and safety reports</AppText>
              </View>
            </View>
          </View>
        </Card>

        <View style={{ width: "100%", gap: 10 }}>
          <Button
            label="Open Admin Dashboard"
            size="lg"
            onPress={() => Linking.openURL("/admin/")}
          />
          <Button
            label={t("back")}
            variant="ghost"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </View>
  );
}
