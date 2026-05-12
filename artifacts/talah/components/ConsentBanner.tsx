import React from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { useConsent } from "@/contexts/ConsentContext";
import { useColors } from "@/hooks/useColors";

export function ConsentBanner() {
  const colors = useColors();
  const { accept, consent, decline, ready } = useConsent();

  if (!ready || consent !== null) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.35)" }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AppText variant="h3" style={styles.title}>Analytics consent / موافقة التحليلات</AppText>
        <AppText style={styles.body}>
          We collect anonymised usage data to improve Tal'ah. No personal information is shared.
        </AppText>
        <AppText style={styles.body}>
          نجمع بيانات استخدام مجهولة لتحسين طلعة. لا تتم مشاركة أي معلومات شخصية.
        </AppText>
        <View style={styles.actions}>
          <Button label="Decline / رفض" variant="outline" onPress={decline} fullWidth={false} style={styles.button} />
          <Button label="Accept / قبول" onPress={accept} fullWidth={false} style={styles.button} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 16,
    zIndex: 1000,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  title: { textAlign: "center" },
  body: { textAlign: "center", lineHeight: 22 },
  actions: { flexDirection: "row", gap: 10, justifyContent: "center", marginTop: 6 },
  button: { flex: 1 },
});
