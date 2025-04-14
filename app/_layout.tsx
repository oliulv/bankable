import React from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { Stack, usePathname } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Header from "../components/Header";
import Footer from "../components/Footer";
import { UserProvider } from "../context/UserContext";

export default function RootLayout() {
  const pathname = usePathname();
  const isLoginScreen = pathname === '/';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <SafeAreaView 
          style={[
            styles.safeContainer, 
            isLoginScreen ? styles.loginSafeContainer : styles.defaultSafeContainer
          ]}
        >
          {!isLoginScreen && <Header />}
          
          <View 
            style={[
              styles.content, 
              isLoginScreen ? styles.loginContent : styles.defaultContent
            ]}
          >
            <Stack screenOptions={{ headerShown: false, animation: "none" }} />
          </View>
          
          {!isLoginScreen && <Footer />}
        </SafeAreaView>
      </UserProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  loginSafeContainer: {
    backgroundColor: '#015f45',
  },
  defaultSafeContainer: {
    backgroundColor: '#015f45',
  },
  content: {
    flex: 1,
    backgroundColor: "#015f45",
  },
  loginContent: {
    backgroundColor: "#015f45",
  },
  defaultContent: {
    backgroundColor: '#015f45',
  }
});