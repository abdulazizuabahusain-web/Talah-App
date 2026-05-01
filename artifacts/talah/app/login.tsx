import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";

export default function LoginScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { sendOtp, verifyOtp } = useApp();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const handleSendOtp = async () => {
    setError(null);
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 8) {
      setError(t("invalid_phone"));
      return;
    }
    setLoading(true);
    try {
      const fullPhone = phone.startsWith("+") ? phone : `+966${phone.replace(/^0/, "")}`;
      const res = await sendOtp(fullPhone);
      if (res.code) setDevCode(res.code); // shown in dev to skip SMS
      setStep("otp");
    } catch {
      setError(t("invalid_phone"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (otp.length !== 4) {
      setError(t("invalid_otp"));
      return;
    }
    setLoading(true);
    try {
      const fullPhone = phone.startsWith("+") ? phone : `+966${phone.replace(/^0/, "")}`;
      const user = await verifyOtp(fullPhone, otp);
      if (user.onboarded) {
        router.replace("/(tabs)");
      } else {
        router.replace("/onboarding");
      }
    } catch {
      setError(t("invalid_otp"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t("signin_title")} subtitle={t("signin_subtitle")} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, webBottomPad) + 24,
            gap: 18,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            {step === "phone" ? (
              <View style={{ gap: 16 }}>
                <Input
                  label={t("phone_label")}
                  placeholder={t("phone_placeholder")}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  error={error ?? undefined}
                />
                <Button
                  label={t("send_otp")}
                  onPress={handleSendOtp}
                  size="lg"
                  loading={loading}
                />
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                <Input
                  label={t("otp_label")}
                  placeholder="0000"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={otp}
                  onChangeText={setOtp}
                  error={error ?? undefined}
                />
                {devCode ? (
                  <AppText variant="caption" color={colors.accent} weight="semibold">
                    Dev code: {devCode}
                  </AppText>
                ) : (
                  <AppText variant="caption" color={colors.mutedForeground}>
                    {t("otp_hint")}
                  </AppText>
                )}
                <Button
                  label={t("verify")}
                  onPress={handleVerify}
                  size="lg"
                  loading={loading}
                />
                <Button
                  label={t("back")}
                  variant="ghost"
                  onPress={() => { setStep("phone"); setDevCode(null); setOtp(""); setError(null); }}
                />
              </View>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
