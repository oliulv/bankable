// components/Header.tsx
import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useUser } from "../context/UserContext";
import { Sheet, SheetTrigger, SheetContent } from './ui/sheet';
import SideMenu from "./SideMenu";

export default function Header({ hasScrolled = false, editMode = false, toggleEditMode = () => {} }) {
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
      <View style={[
        styles.header,
        hasScrolled && isHomePage && styles.headerWithShadow
      ]}>
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
              <Ionicons name="arrow-back" size={20} color="#015f45" />
            </TouchableOpacity>
          )}
          <Text style={styles.userName}>
            Hello, {customerName || 'Guest'}
          </Text>
        </View>

        {/* Right side: edit icon (only on home page) and menu icon */}
        <View style={styles.right}>
          {isHomePage && (
            <TouchableOpacity 
              onPress={toggleEditMode}
              style={styles.editButton}
            >
              <Ionicons 
                name={editMode ? "checkmark" : "pencil"} 
                size={22} 
                color="#015f45" 
              />
            </TouchableOpacity>
          )}
          <SheetTrigger>
            <Ionicons name="menu" size={24} color="#015f45" />
          </SheetTrigger>
        </View>
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
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    // Remove border
    // borderBottomWidth: 1,
    // borderBottomColor: "#f0f0f0",
  },
  headerWithShadow: {
    // Add shadow when scrolled
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 24,
    height: 24,
    tintColor: "#015f45",
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
    color: "#015f45",
  },
  editButton: {
    marginRight: 16,
  },
  sheetContent: {
    width: '60%', 
  }
});