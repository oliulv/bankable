// components/Footer.tsx
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Footer() {
  const router = useRouter();

  return (
    <View style={styles.footer}>
      {/* Home */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => router.push("/HomeScreen")}
      >
        <Ionicons name="home" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Bankable AI */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => router.push("/BankableAIScreen")}
      >
        <Ionicons name="bulb" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Virtual Pet */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => router.push("/BankableVirtualPetScreen")}
      >
        <Ionicons name="bug" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Settings */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => router.push("/SettingsScreen")}
      >
        <Ionicons name="settings" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    height: 60,
    backgroundColor: "#006a4d", // GREEN FOOTER
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  iconContainer: {
    padding: 8,
  },
});
