"use client"

import { useState } from "react"
import { Text, StyleSheet, ScrollView } from "react-native"
import { useTheme } from "../components/ThemeProvider"
import { Button } from "../components/Button"
import { Card } from "../components/Card"
import { ProgressBar } from "../components/ProgressBar"

const FinancialHealthCoachScreen = () => {
  const { theme } = useTheme()
  const [financialScore, setFinancialScore] = useState(72)

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 16,
    },
    scoreText: {
      fontSize: 48,
      fontWeight: "bold",
      color: theme.primary,
      textAlign: "center",
    },
    description: {
      fontSize: 16,
      color: theme.text,
      textAlign: "center",
      marginTop: 8,
    },
  })

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Financial Health Coach</Text>
      <Card>
        <Text style={styles.scoreText}>{financialScore}</Text>
        <ProgressBar progress={financialScore} />
        <Text style={styles.description}>Your financial health score</Text>
      </Card>
      <Card>
        <Text style={{ color: theme.text, fontSize: 18, marginBottom: 8 }}>Recommendations</Text>
        <Text style={{ color: theme.text }}>1. Increase your emergency fund</Text>
        <Text style={{ color: theme.text }}>2. Reduce unnecessary expenses</Text>
        <Text style={{ color: theme.text }}>3. Invest in low-cost index funds</Text>
      </Card>
      <Button title="Get Personalized Advice" onPress={() => {}} />
    </ScrollView>
  )
}

export default FinancialHealthCoachScreen

