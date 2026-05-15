import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useConnectsCount } from "@/hooks/useConnectsCount";

export default function TabLayout() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";
  const newConnects = useConnectsCount();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          ...(isWeb ? { height: 84, paddingTop: 8 } : { paddingTop: 6 }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: Platform.OS === "web" ? undefined : "Inter_500Medium",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name={focused ? "home" : "home"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="upcoming"
        options={{
          title: "Tal'ahs",
          tabBarIcon: ({ color }) => (
            <Feather name="calendar" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: "Connects",
          tabBarIcon: ({ color }) => (
            <View>
              <Feather name="heart" size={22} color={color} />
              {newConnects > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -6,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.primary,
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
