import type React from "react"
import { View, StyleSheet } from "react-native"
import { useTheme } from "./ThemeProvider"

export const Card: React.FC = ({ children }) => {
  const { theme } = useTheme()

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 16,
      marginVertical: 8,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
  })

  return <View style={styles.card}>{children}</View>
}

