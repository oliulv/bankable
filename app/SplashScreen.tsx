import { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import * as AV from "expo-av"; // Ensure expo-av is properly imported

export default function SplashScreen() {
  const videoRef = useRef<AV.Video>(null);

  useEffect(() => {
    videoRef.current?.playAsync();
  }, []);

  return (
    <View style={styles.container}>
      <AV.Video
        ref={videoRef}
        source={require("../assets/videos/VIDEO.mp4")} // Ensure this path is correct
        style={styles.video}
        resizeMode={AV.ResizeMode.COVER} // Use AV.ResizeMode
        shouldPlay
        isLooping={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});
