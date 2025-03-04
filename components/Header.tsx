// components/Header.tsx
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Header() {
  // If you want to open a side menu, add logic here (e.g. useState or props)
  return (
    <View style={styles.header}>
      {/* Left side: turtle + Hello, Chelsea */}
      <View style={styles.left}>
        <Image
          source={{
            uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2024-11-17_at_7.03.16_PM-removebg-preview-qYVjiMHoaYBDi7UFT0Diy07RmwLjrH.png",
          }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.userName}>Hello, Chelsea</Text>
      </View>

      {/* Right side: menu icon */}
      <TouchableOpacity onPress={() => console.log("Open menu")}>
        <Ionicons name="menu" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#006a4d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 24,
    height: 24,
    tintColor: "#fff",
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
