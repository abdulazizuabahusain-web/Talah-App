import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";

type ContactField = {
  key: "contactPhone" | "instagram" | "snapchat" | "twitter" | "tiktok";
  icon: keyof typeof Feather.glyphMap;
  color: string;
  labelKey: string;
  placeholderKey: string;
  prefix?: string;
};

const FIELDS: ContactField[] = [
  {
    key: "contactPhone",
    icon: "phone",
    color: "#2ECC71",
    labelKey: "contact_phone_label",
    placeholderKey: "contact_phone_placeholder",
  },
  {
    key: "instagram",
    icon: "camera",
    color: "#E1306C",
    labelKey: "contact_instagram_label",
    placeholderKey: "contact_instagram_placeholder",
    prefix: "@",
  },
  {
    key: "snapchat",
    icon: "message-circle",
    color: "#FFFC00",
    labelKey: "contact_snapchat_label",
    placeholderKey: "contact_snapchat_placeholder",
  },
  {
    key: "twitter",
    icon: "twitter",
    color: "#1DA1F2",
    labelKey: "contact_twitter_label",
    placeholderKey: "contact_twitter_placeholder",
    prefix: "@",
  },
  {
    key: "tiktok",
    icon: "music",
    color: "#010101",
    labelKey: "contact_tiktok_label",
    placeholderKey: "contact_tiktok_placeholder",
    prefix: "@",
  },
];

export default function EditContactScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentUser, updateCurrentUser } = useApp();
  const isWeb = Platform.OS === "web";

  const [values, setValues] = useState({
    contactPhone: currentUser?.contactPhone ?? "",
    instagram: currentUser?.instagram ?? "",
    snapchat: currentUser?.snapchat ?? "",
    twitter: currentUser?.twitter ?? "",
    tiktok: currentUser?.tiktok ?? "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setValues({
        contactPhone: currentUser.contactPhone ?? "",
        instagram: currentUser.instagram ?? "",
        snapchat: currentUser.snapchat ?? "",
        twitter: currentUser.twitter ?? "",
        tiktok: currentUser.tiktok ?? "",
      });
    }
  }, [currentUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCurrentUser({
        contactPhone: values.contactPhone.trim() || null,
        instagram: values.instagram.trim().replace(/^@/, "") || null,
        snapchat: values.snapchat.trim() || null,
        twitter: values.twitter.trim().replace(/^@/, "") || null,
        tiktok: values.tiktok.trim().replace(/^@/, "") || null,
      });
      router.back();
    } catch (e) {
      Alert.alert(t("error_title"), (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: isWeb ? 16 : insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <AppText variant="title" weight="semibold" style={{ flex: 1 }}>
          {t("contact_edit_title")}
        </AppText>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: saving ? colors.muted : colors.primary,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <AppText variant="label" weight="semibold" color={colors.primaryForeground}>
              {t("save")}
            </AppText>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: Math.max(insets.bottom + 40, 60),
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Privacy notice */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
            padding: 14,
            borderRadius: 12,
            backgroundColor: colors.primary + "10",
          }}
        >
          <Feather name="lock" size={16} color={colors.primary} style={{ marginTop: 2 }} />
          <AppText variant="bodySmall" color={colors.primary} style={{ flex: 1, lineHeight: 20 }}>
            {t("contact_privacy_notice")}
          </AppText>
        </View>

        <Card padded={false}>
          {FIELDS.map((field, idx) => (
            <React.Fragment key={field.key}>
              {idx > 0 && (
                <View style={{ height: 1, marginHorizontal: 18, backgroundColor: colors.border }} />
              )}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: field.color + "18",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name={field.icon} size={18} color={field.color} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <AppText variant="caption" weight="semibold" color={colors.mutedForeground}>
                    {t(field.labelKey)}
                  </AppText>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {field.prefix && (
                      <AppText variant="body" color={colors.mutedForeground}>
                        {field.prefix}
                      </AppText>
                    )}
                    <TextInput
                      value={values[field.key] ?? ""}
                      onChangeText={(v) =>
                        setValues((prev) => ({ ...prev, [field.key]: v }))
                      }
                      placeholder={t(field.placeholderKey)}
                      placeholderTextColor={colors.mutedForeground}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType={
                        field.key === "contactPhone" ? "phone-pad" : "default"
                      }
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: colors.foreground,
                        paddingVertical: 2,
                      }}
                    />
                    {values[field.key] ? (
                      <Pressable
                        onPress={() =>
                          setValues((prev) => ({ ...prev, [field.key]: "" }))
                        }
                        hitSlop={8}
                      >
                        <Feather name="x" size={16} color={colors.mutedForeground} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            </React.Fragment>
          ))}
        </Card>

        <AppText
          variant="bodySmall"
          color={colors.mutedForeground}
          style={{ textAlign: "center", paddingHorizontal: 20 }}
        >
          {t("contact_fields_optional_note")}
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
