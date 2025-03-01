import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import SplashScreen from "./SplashScreen"; // Import the Splash Screen component

export default function RootLayout() {
  const [isSplashFinished, setIsSplashFinished] = useState(false);

  useEffect(() => {
    // Wait for the full 7 seconds (7000ms) before showing the main app
    const timer = setTimeout(() => {
      setIsSplashFinished(true);
    }, 7000); // 7 seconds

    return () => clearTimeout(timer); // Cleanup timeout on unmount
  }, []);

  // Show the SplashScreen first, then navigate to the main app
  return isSplashFinished ? <Stack /> : <SplashScreen />;
}
