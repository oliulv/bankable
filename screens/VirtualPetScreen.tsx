"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Image } from "react-native"
import { useTheme } from "../components/ThemeProvider"
import { Button } from "../components/Button"
import { Card } from "../components/Card"
import { ProgressBar } from "../components/ProgressBar"

const VirtualPetScreen = () => {
  const { theme } = useTheme()
  const [happiness, setHappiness] = useState(80)
  const [energy, setEnergy] = useState(90)
  const [coins, setCoins] = useState(100)

  useEffect(() => {
    const timer = setInterval(() => {
      setHappiness((prev) => Math.max(0, prev - 1))
      setEnergy((prev) => Math.max(0, prev - 0.5))
    }, 10000)

    return () => clearInterval(timer)
  }, [])

  const feed = () => {
    setHappiness((prev) => Math.min(100, prev + 10))
    setCoins((prev) => prev - 5)
  }

  const play = () => {
    setHappiness((prev) => Math.min(100, prev + 15))
    setEnergy((prev) => Math.max(0, prev - 10))
    setCoins((prev) => prev + 10)
  }

  const sleep = () => {
    setEnergy((prev) => Math.min(100, prev + 30))
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 16,
    },
    petImage: {
      width: 200,
      height: 200,
      alignSelf: "center",
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    stat: {
      fontSize: 16,
      color: theme.text,
    },
  })

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-19%20at%201.55.58%E2%80%AFPM-vXzN5aOAgtQrhdBHIwpQIWKWOunpSJ.png",
        }}
        style={styles.petImage}
      />
      <Card>
        <View style={styles.statsContainer}>
          <Text style={styles.stat}>Happiness: {happiness}%</Text>
          <Text style={styles.stat}>Energy: {energy}%</Text>
          <Text style={styles.stat}>Coins: {coins}</Text>
        </View>
        <ProgressBar progress={happiness} />
        <Text style={styles.stat}>Happiness</Text>
        <ProgressBar progress={energy} />
        <Text style={styles.stat}>Energy</Text>
      </Card>
      <Button title="Feed" onPress={feed} />
      <Button title="Play" onPress={play} />
      <Button title="Sleep" onPress={sleep} />
    </View>
  )
}

export default VirtualPetScreen

