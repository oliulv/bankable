// components/Header.tsx
import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useUser } from "../context/UserContext";
import { Sheet, SheetTrigger, SheetContent } from './ui/sheet';
import SideMenu from "./SideMenu";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { customerName } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Check if we're on the home page
  const isHomePage = pathname === '/HomeScreen';

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <View style={styles.header}>
        {/* Left side: Conditional turtle or back button + Hello, [Name] */}
        <View style={styles.left}>
          {isHomePage ? (
            // Show turtle on home page
            <Image
              source={{
                uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2024-11-17_at_7.03.16_PM-removebg-preview-qYVjiMHoaYBDi7UFT0Diy07RmwLjrH.png",
              }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            // Show back button on other pages
            <TouchableOpacity 
              onPress={handleBack}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          <Text style={styles.userName}>
            Hello, {customerName || 'Guest'}
          </Text>
        </View>

        {/* Right side: menu icon */}
        <SheetTrigger>
          <Ionicons name="menu" size={24} color="#fff" />
        </SheetTrigger>
      </View>
      
      {/* The sliding menu */}
      <SheetContent side="right" style={styles.sheetContent}>
        <SideMenu closeDrawer={() => setMenuOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#015f45",
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
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  sheetContent: {
    width: '60%', // Make the menu 70% of screen width instead of full width
  }
});