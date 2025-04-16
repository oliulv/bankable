// components/Footer.tsx
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Footer() {
  const router = useRouter();

  return (
    <View style={styles.footer}>
      {/* Virtual Pet */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => router.push("/BankableVirtualPetScreen")}
      >
        <Ionicons name="bug" size={24} color="#015f45" />
      </TouchableOpacity>

      {/* Group Savings Goals */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => router.push("/InvestmentsScreen")}
      >
        <Ionicons name="trending-up-outline" size={24} color="#015f45" />
      </TouchableOpacity>

      {/* Home - Center */}
      <TouchableOpacity
        style={[styles.iconContainer, styles.homeIcon]}
        onPress={() => router.push("/HomeScreen")}
      >
        <Ionicons name="home" size={28} color="#015f45" />
      </TouchableOpacity>

      {/* Bankable AI */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => router.push("/BankableAIScreen")}
      >
        <Ionicons name="bulb" size={24} color="#015f45" />
      </TouchableOpacity>

      {/* Settings */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => router.push("/SettingsScreen")}
      >
        <Ionicons name="settings" size={24} color="#015f45" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    height: 60,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    // Remove border
    // borderTopWidth: 1,
    // borderTopColor: "#f0f0f0",
    // Add shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    padding: 8,
  },
  homeIcon: {
    transform: [{ scale: 1.2 }],
    marginHorizontal: 5,
  },
});
