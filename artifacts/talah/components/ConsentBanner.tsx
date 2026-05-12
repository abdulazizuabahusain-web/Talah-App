import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { useConsent } from "@/contexts/ConsentContext";
import { useColors } from "@/hooks/useColors";

export function ConsentBanner() {
  const { consentStatus, acceptAnalytics, declineAnalytics } = useConsent();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (consentStatus !== "undecided") return null;

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: colors.card ?? "#fff",
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: Math.max(insets.bottom, 16),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <AppText variant="body" weight="semibold" style={{ marginBottom: 6 }}>
        بيانات الاستخدام / Usage data
      </AppText>
      <AppText variant="bodySmall" color={colors.mutedForeground} style={{ marginBottom: 14 }}>
        نجمع بيانات استخدام مجهولة لتحسين طلعة. لا يتم مشاركة أي معلومات شخصية.{"\n"}
        We collect anonymised usage data to improve Tal'ah. No personal information is shared.
      </AppText>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={acceptAnalytics}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <AppText variant="label" weight="semibold" color={colors.primaryForeground}>
            موافقة / Accept
          </AppText>
        </Pressable>
        <Pressable
          onPress={declineAnalytics}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: colors.muted,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <AppText variant="label" weight="semibold" color={colors.mutedForeground}>
            رفض / Decline
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
