// VirtualPetScreen.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function VirtualPetScreen(): JSX.Element {
  // Status states for the turtle (range 0-100)
  const [hunger, setHunger] = useState<number>(50);
  const [happiness, setHappiness] = useState<number>(50);
  const [cleanliness, setCleanliness] = useState<number>(50);

  // Bounce animation for the turtle mascot
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const triggerBounce = (toValue: number, duration: number = 200) => {
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Action handlers for feeding, playing, and cleaning the pet
  const feedPet = () => {
    setHunger(Math.min(100, hunger + 10));
    setHappiness(Math.min(100, happiness + 5));
    triggerBounce(1.2);
  };

  const playWithPet = () => {
    setHappiness(Math.min(100, happiness + 10));
    setHunger(Math.max(0, hunger - 5));
    triggerBounce(1.3);
  };

  const cleanPet = () => {
    setCleanliness(100);
    setHappiness(Math.min(100, happiness + 5));
    triggerBounce(1.1);
  };

  return (
    <LinearGradient
      colors={["#e0f7fa", "#80deea"]}
      style={styles.container}
    >
      <Text style={styles.title}>Your Virtual Pet Turtle</Text>

      {/* Lottie Turtle Animation with bounce animation */}
      <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
        <LottieView
          source={require("../assets/Animation - 1741464680774.json")} // Ensure correct path
          autoPlay
          loop
          style={styles.turtleAnimation}
        />
      </Animated.View>

      {/* Status Bars */}
      <View style={styles.statusContainer}>
        <StatusBar label="Hunger" value={hunger} fillColor="#00bcd4" />
        <StatusBar label="Happiness" value={happiness} fillColor="#ffeb3b" />
        <StatusBar label="Cleanliness" value={cleanliness} fillColor="#8bc34a" />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={feedPet}>
          <Text style={styles.buttonText}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={playWithPet}>
          <Text style={styles.buttonText}>Play</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={cleanPet}>
          <Text style={styles.buttonText}>Clean</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

interface StatusBarProps {
  label: string;
  value: number; // percentage 0 to 100
  fillColor: string;
}

function StatusBar({ label, value, fillColor }: StatusBarProps): JSX.Element {
  return (
    <View style={statusStyles.container}>
      <Text style={statusStyles.label}>{label}</Text>
      <View style={statusStyles.barBackground}>
        <View
          style={[
            statusStyles.barFill,
            { width: `${value}%`, backgroundColor: fillColor },
          ]}
        />
      </View>
      <Text style={statusStyles.value}>{value}%</Text>
    </View>
  );
}

const statusStyles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#004d40",
  },
  barBackground: {
    width: "100%",
    height: 10,
    backgroundColor: "#b2dfdb",
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 5,
  },
  value: {
    fontSize: 12,
    marginTop: 4,
    color: "#004d40",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "space-around",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#004d40",
    marginTop: 20,
  },
  turtleAnimation: {
    width: 200,
    height: 200,
  },
  statusContainer: {
    width: "100%",
    paddingVertical: 20,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    backgroundColor: "#00695c",
    marginHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
