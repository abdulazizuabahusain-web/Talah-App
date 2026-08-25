import { router, useLocalSearchParams } from "expo-router";
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
import { api } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { sendLoginCode, verifyLoginCode } = useApp();
  const { inviteToken: inviteTokenParam } = useLocalSearchParams<{
    inviteToken?: string;
  }>();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const normalizedEmail = email.trim().toLowerCase();

  const handleSendCode = async () => {
    setError(null);
    if (!EMAIL_RE.test(normalizedEmail)) {
      setError(t("invalid_email"));
      return;
    }
    setLoading(true);
    try {
      const res = await sendLoginCode(normalizedEmail);
      if (res.code) setDevCode(res.code);
      setStep("code");
    } catch {
      setError(t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (code.length < 4 || code.length > 6) {
      setError(t("invalid_login_code"));
      return;
    }
    setLoading(true);
    try {
      const user = await verifyLoginCode(normalizedEmail, code);
      const inviteToken = Array.isArray(inviteTokenParam)
        ? inviteTokenParam[0]
        : inviteTokenParam;

      if (user.onboarded) {
        if (inviteToken) {
          let invitationId: string | undefined;
          try {
            const invitation = await api.claimInvitation(inviteToken);
            invitationId = invitation.id;
          } catch {
            // Keep the existing email-matching list fallback if the token
            // cannot be claimed (for example, it belongs to another email).
          }
          router.replace(
            invitationId
              ? {
                  pathname: "/(tabs)/invitations",
                  params: { invitationId },
                }
              : "/(tabs)/invitations",
          );
        } else {
          router.replace("/(tabs)");
        }
      } else {
        const invitations = await api.getInvitations().catch(() => []);
        const hasPendingInvite = invitations.some((invite) => invite.status === "pending");
        if (inviteToken || hasPendingInvite) {
          const query = inviteToken
            ? `&inviteToken=${encodeURIComponent(inviteToken)}`
            : "";
          router.replace(`/onboarding?invite=1${query}` as "/onboarding");
        } else {
          router.replace("/onboarding");
        }
      }
    } catch {
      setError(t("invalid_login_code"));
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
            {step === "email" ? (
              <View style={{ gap: 16 }}>
                <Input
                  label={t("email_label")}
                  placeholder={t("email_placeholder")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  error={error ?? undefined}
                />
                <Button
                  label={t("send_login_code")}
                  onPress={handleSendCode}
                  size="lg"
                  loading={loading}
                />
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                <Input
                  label={t("login_code_label")}
                  placeholder="0000"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                  error={error ?? undefined}
                />
                {devCode ? (
                  <AppText
                    variant="caption"
                    color={colors.accent}
                    weight="semibold"
                  >
                    Dev code: {devCode}
                  </AppText>
                ) : (
                  <AppText variant="caption" color={colors.mutedForeground}>
                    {t("login_code_hint")}
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
                  onPress={() => {
                    setStep("email");
                    setDevCode(null);
                    setCode("");
                    setError(null);
                  }}
                />
              </View>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}