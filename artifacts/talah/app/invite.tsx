import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function InviteLinkScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { currentUser, ready } = useApp();
  const colors = useColors();

  useEffect(() => {
    if (!ready) return;
    if (currentUser) {
      router.replace("/(tabs)/invitations");
    } else {
      const suffix = token ? `?inviteToken=${encodeURIComponent(token)}` : "";
      router.replace(`/login${suffix}` as "/login");
    }
  }, [currentUser, ready, token]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}