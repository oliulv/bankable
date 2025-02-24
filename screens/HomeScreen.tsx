"use client"

import { useState } from "react"
import { View, Text, ScrollView, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated"
import { PanGestureHandler } from "react-native-gesture-handler"
import { useTheme } from "../components/ThemeProvider"
import BankCard from "../components/BankCard"
import Avatar from "../components/Avatar"
import { Card } from "../components/Card"
import TransactionItem from "../components/TransactionItem"
import GroupSavingGoal from "../components/GroupSavingGoal"

const bankAccounts = [
  { type: "Classic", accountNumber: "12-34-56 / 12345678", balance: 100.0 },
  { type: "Savings", accountNumber: "12-34-56 / 87654321", balance: 5000.0 },
  { type: "Joint", accountNumber: "12-34-56 / 11223344", balance: 2500.0 },
]

const transactions = [
  { id: 1, name: "McDonald's", date: "20/02/2025", amount: 8.98, icon: "utensils" },
  { id: 2, name: "Tesco", date: "11/02/2025", amount: 12.5, icon: "shopping-cart" },
]

const HomeScreen = () => {
  const { theme } = useTheme()
  const [currentBankIndex, setCurrentBankIndex] = useState(0)
  const translateX = useSharedValue(0)

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      padding: 16,
    },
    profileSection: {
      flexDirection: "row",
      alignItems: "center",
    },
    greeting: {
      fontSize: 14,
      color: theme.text,
    },
    name: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.text,
    },
    bankCardContainer: {
      height: 200,
      marginBottom: 16,
    },
    widgetsContainer: {
      padding: 16,
    },
    widgetTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 8,
    },
  })

  const panGestureEvent = (event: any) => {
    const diff = event.nativeEvent.translationX
    if (diff > 50 && currentBankIndex > 0) {
      setCurrentBankIndex(currentBankIndex - 1)
      translateX.value = withSpring(0)
    } else if (diff < -50 && currentBankIndex < bankAccounts.length - 1) {
      setCurrentBankIndex(currentBankIndex + 1)
      translateX.value = withSpring(0)
    } else {
      translateX.value = diff
    }
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <Avatar />
            <View>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.name}>Chelsea</Text>
            </View>
          </View>
        </View>

        <PanGestureHandler onGestureEvent={panGestureEvent}>
          <Animated.View style={[styles.bankCardContainer, animatedStyle]}>
            <BankCard
              type={bankAccounts[currentBankIndex].type}
              accountNumber={bankAccounts[currentBankIndex].accountNumber}
              balance={bankAccounts[currentBankIndex].balance}
            />
          </Animated.View>
        </PanGestureHandler>

        <View style={styles.widgetsContainer}>
          <Card>
            <Text style={styles.widgetTitle}>Recent Transactions</Text>
            {transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </Card>

          <Card>
            <Text style={styles.widgetTitle}>Group Saving Goals</Text>
            <GroupSavingGoal title="Traveling" progress={68} />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default HomeScreen

