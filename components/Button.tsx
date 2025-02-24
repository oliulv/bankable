import type React from "react"
import { TouchableOpacity, Text, StyleSheet } from "react-native"
import { useTheme } from "./ThemeProvider"

interface ButtonProps {
  title: string
  onPress: () => void
}

export const Button: React.FC<ButtonProps> = ({ title, onPress }) => {
  const { theme } = useTheme()

  const styles = StyleSheet.create({
    button: {
      backgroundColor: theme.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginVertical: 8,
    },
    text: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },
  })

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  )
}

