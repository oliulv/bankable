import React, { useEffect, useState } from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { Stack } from "expo-router";

import SplashScreen from "./SplashScreen";
import Header from "../components/Header";
import Footer from "../components/Footer"; // Import the new Footer

export default function RootLayout() {
  const [isSplashFinished, setIsSplashFinished] = useState(false);

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
    <SafeAreaView style={styles.safeContainer}>
      {/* Header at the top */}
      <Header />

      {/* Screen content in the middle */}
      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>

      {/* Green footer at the bottom */}
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#006a4d", // White so no leftover green
  },
  content: {
    flex: 1,
    backgroundColor: "#006a4d",
  },
});
