import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";

import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import type { RequestInvitation } from "@/lib/types";

const STATUS_AR: Record<RequestInvitation["status"], string> = {
  pending: "بانتظار الرد",
  accepted: "تم القبول",
  declined: "تم الاعتذار",
  expired: "انتهت الدعوة",
  finalized: "تم تأكيد المجموعة",
};

export default function InvitationsScreen() {
  const colors = useColors();
  const { currentUser } = useApp();
  const [items, setItems] = useState<RequestInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.getInvitations());
    } catch {
      Alert.alert("تعذر تحميل الدعوات", "حاولي مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const respond = async (id: string, response: "accepted" | "declined") => {
    setWorking(id);
    try {
      const updated = await api.respondToInvitation(id, response);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (error) {
      Alert.alert("تعذر تحديث الدعوة", error instanceof Error ? error.message : "حاولي مرة أخرى.");
    } finally {
      setWorking(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="دعوات طلعة" />
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          {items.length === 0 ? (
            <Card>
              <AppText align="center" color={colors.mutedForeground}>
                لا توجد دعوات حالياً.
              </AppText>
            </Card>
          ) : (
            items.map((invite) => {
              const isRequester = invite.requesterId === currentUser?.id;
              const expires = new Date(invite.expiresAt).toLocaleString("ar-SA-u-ca-gregory", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              });
              return (
                <Card key={invite.id}>
                  <View style={{ gap: 10 }}>
                    <AppText variant="title" weight="semibold">
                      {isRequester ? "دعوة صديقتك" : "تمت دعوتك إلى طلعة"}
                    </AppText>
                    <AppText variant="bodySmall" color={colors.mutedForeground}>
                      {isRequester
                        ? `تم إرسال الدعوة إلى ${invite.invitedEmail}`
                        : "انضمي إلى طلعة صديقتك، وسنرتّب بقية المجموعة بعناية."}
                    </AppText>
                    <AppText variant="caption" color={colors.mutedForeground}>
                      الحالة: {STATUS_AR[invite.status]} · تنتهي {expires}
                    </AppText>
                    {!isRequester && invite.status === "pending" && (
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Button
                            label="قبول الدعوة"
                            size="sm"
                            loading={working === invite.id}
                            onPress={() => respond(invite.id, "accepted")}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Button
                            label="اعتذار"
                            size="sm"
                            variant="outline"
                            disabled={working === invite.id}
                            onPress={() => respond(invite.id, "declined")}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}