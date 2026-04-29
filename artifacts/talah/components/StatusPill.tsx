import React from "react";
import { View } from "react-native";

import { AppText } from "@/components/AppText";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/lib/i18n";
import type { GroupStatus } from "@/lib/types";

export function StatusPill({ status }: { status: GroupStatus | "pending" | "matched" | "cancelled" }) {
  const colors = useColors();
  const t = useT();

  const palette: Record<string, { bg: string; fg: string; key: string }> = {
    pending: {
      bg: colors.muted,
      fg: colors.mutedForeground,
      key: "status_pending",
    },
    matched: {
      bg: "#E5DFC9",
      fg: colors.accent,
      key: "status_matched",
    },
    revealed: {
      bg: colors.accent,
      fg: colors.accentForeground,
      key: "status_revealed",
    },
    completed: {
      bg: colors.primary,
      fg: colors.primaryForeground,
      key: "status_completed",
    },
    cancelled: {
      bg: colors.muted,
      fg: colors.destructive,
      key: "status_cancelled",
    },
  };
  const p = palette[status] ?? palette.pending;

  return (
    <View
      style={{
        backgroundColor: p.bg,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        alignSelf: "flex-start",
      }}
    >
      <AppText variant="caption" weight="semibold" color={p.fg}>
        {t(p.key)}
      </AppText>
    </View>
  );
}
