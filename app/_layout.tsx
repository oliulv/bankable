import React, { useEffect, useState } from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { Stack, usePathname } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SplashScreen from "./SplashScreen";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { UserProvider } from "../context/UserContext";

export default function RootLayout() {
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const pathname = usePathname();
  const isLoginScreen = pathname === '/';

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashFinished(true);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  if (!isSplashFinished) {
    return <SplashScreen />;
  }

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
    backgroundColor: '#000',
  },
  defaultSafeContainer: {
    backgroundColor: '#006a4d',
  },
  content: {
    flex: 1,
    backgroundColor: "#006a4d",
  },
  loginContent: {
    backgroundColor: 'transparent',
  },
  defaultContent: {
    backgroundColor: '#006a4d',
  }
});