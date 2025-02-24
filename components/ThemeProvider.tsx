"use client"

import type React from "react"
import { createContext, useState, useContext } from "react"
import { useColorScheme } from "react-native"

const lightTheme = {
  background: "#FFFFFF",
  text: "#000000",
  primary: "#006a4d",
  secondary: "#8FBC8F",
  card: "#F0F0F0",
}

const darkTheme = {
  background: "#121212",
  text: "#FFFFFF",
  primary: "#00A86B",
  secondary: "#4A7864",
  card: "#1E1E1E",
}

const ThemeContext = createContext({
  theme: lightTheme,
  toggleTheme: () => {},
})

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider: React.FC = ({ children }) => {
  const deviceTheme = useColorScheme()
  const [isDark, setIsDark] = useState(deviceTheme === "dark")

  const theme = isDark ? darkTheme : lightTheme

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

