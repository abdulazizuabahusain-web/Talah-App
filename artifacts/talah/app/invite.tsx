import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

export default function InviteLinkScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { currentUser, ready } = useApp();
  const colors = useColors();

  useEffect(() => {
    if (!ready) return;
    const inviteToken = Array.isArray(token) ? token[0] : token;

    if (currentUser) {
      if (!currentUser.onboarded) {
        const suffix = inviteToken
          ? `?invite=1&inviteToken=${encodeURIComponent(inviteToken)}`
          : "?invite=1";
        router.replace(`/onboarding${suffix}` as "/onboarding");
        return;
      }

      if (!inviteToken) {
        router.replace("/(tabs)/invitations");
        return;
      }

      // Claiming is authenticated and the API also checks that the token's
      // invitation email matches the signed-in account. If it fails, retain
      // the email-based invitation list as the safe fallback.
      api
        .claimInvitation(inviteToken)
        .then((invitation) => {
          router.replace({
            pathname: "/(tabs)/invitations",
            params: { invitationId: invitation.id },
          });
        })
        .catch(() => {
          router.replace("/(tabs)/invitations");
        });
    } else {
      const suffix = inviteToken
        ? `?inviteToken=${encodeURIComponent(inviteToken)}`
        : "";
      router.replace(`/login${suffix}` as "/login");
    }
  }, [currentUser, ready, token]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}