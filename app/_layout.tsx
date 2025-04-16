import React, { useState, createContext, useContext, useEffect } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { Stack, usePathname } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from "../components/Header";
import Footer from "../components/Footer";
import { UserProvider } from "../context/UserContext";
import { EditModeProvider, useEditMode } from '../context/EditModeContext';

// Create a context to track scroll position
export const ScrollContext = createContext({
  hasScrolled: false,
  setHasScrolled: (value: boolean) => {},
});

export const useScrollStatus = () => useContext(ScrollContext);

export default function RootLayout() {
  const pathname = usePathname();
  const isLoginScreen = pathname === '/';
  const [hasScrolled, setHasScrolled] = useState(false);

  // Set proper status bar color for login screen
  const statusBarColor = isLoginScreen ? "#015f45" : "#ffffff";
  const statusBarStyle = isLoginScreen ? "light-content" : "dark-content";

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: isLoginScreen ? '#015f45' : '#ffffff' }}>
      <StatusBar backgroundColor={statusBarColor} barStyle={statusBarStyle} />
      <SafeAreaProvider style={{ backgroundColor: isLoginScreen ? '#015f45' : '#ffffff' }}>
        <UserProvider>
          <EditModeProvider>
            <ScrollContext.Provider value={{ hasScrolled, setHasScrolled }}>
              <CustomSafeLayout isLoginScreen={isLoginScreen} hasScrolled={hasScrolled} />
            </ScrollContext.Provider>
          </EditModeProvider>
        </UserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function CustomSafeLayout({ isLoginScreen, hasScrolled }: { isLoginScreen: boolean, hasScrolled: boolean }) {
  const { editMode, toggleEditMode } = useEditMode();
  const insets = useSafeAreaInsets();
  const pathname = usePathname(); // Add this line to get the current pathname
  
  // Calculate reduced insets (50% of original)
  const topInset = Math.max(insets.top * 0.9, 5); // At least 5px for status bar
  const bottomInset = Math.max(insets.bottom * 0.5, 3);

  // Check if current path is BankableAIScreen
  const isBankableAIScreen = pathname === '/BankableAIScreen';

  return (
    <View style={[
      styles.container,
      { 
        paddingTop: isLoginScreen ? insets.top : topInset,
        paddingBottom: isLoginScreen ? insets.bottom : bottomInset,
        backgroundColor: isLoginScreen ? '#015f45' : '#ffffff'
      }
    ]}>
      {!isLoginScreen && <Header hasScrolled={hasScrolled} editMode={editMode} toggleEditMode={toggleEditMode} />}
      
      <View 
        style={[
          styles.content, 
          isLoginScreen ? styles.loginContent : styles.defaultContent
        ]}
      >
        <Stack screenOptions={{ headerShown: false, animation: "none" }} />
      </View>
      
      {!isLoginScreen && <Footer noShadow={isBankableAIScreen} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color set dynamically in component
  },
  content: {
    flex: 1,
    // Background color set in loginContent and defaultContent
  },
  loginContent: {
    backgroundColor: "#015f45", // Keep login screen background dark green for contrast
  },
  defaultContent: {
    backgroundColor: '#ffffff',
  }
});