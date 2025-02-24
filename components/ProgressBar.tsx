import type React from "react"
import { View, StyleSheet } from "react-native"
import { useTheme } from "./ThemeProvider"

interface ProgressBarProps {
  progress: number
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const { theme } = useTheme()

  const styles = StyleSheet.create({
    container: {
      height: 10,
      backgroundColor: "#E0E0E0",
      borderRadius: 5,
      marginVertical: 8,
    },
    bar: {
      height: "100%",
      width: `${progress}%`,
      backgroundColor: theme.primary,
      borderRadius: 5,
    },
  })

  return (
    <View style={styles.container}>
      <View style={styles.bar} />
    </View>
  )
}

