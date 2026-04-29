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
  const { loginByPhone } = useApp();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const handleSendOtp = () => {
    setError(null);
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 8) {
      setError(t("invalid_phone"));
      return;
    }
    setStep("otp");
  };

  const handleVerify = async () => {
    setError(null);
    if (otp !== "0000") {
      setError(t("invalid_otp"));
      return;
    }
    setLoading(true);
    const fullPhone = phone.startsWith("+") ? phone : `+966${phone.replace(/^0/, "")}`;
    const user = await loginByPhone(fullPhone);
    setLoading(false);
    if (user.onboarded) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding");
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
                <AppText variant="caption" color={colors.mutedForeground}>
                  {t("otp_hint")}
                </AppText>
                <Button
                  label={t("verify")}
                  onPress={handleVerify}
                  size="lg"
                  loading={loading}
                />
                <Button
                  label={t("back")}
                  variant="ghost"
                  onPress={() => setStep("phone")}
                />
              </View>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
