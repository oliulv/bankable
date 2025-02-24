import type React from "react"
import { View, Text, StyleSheet } from "react-native"

interface BankCardProps {
  type: string
  accountNumber: string
  balance: number
}

const BankCard: React.FC<BankCardProps> = ({ type, accountNumber, balance }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardType}>{type}</Text>
      <Text style={styles.accountNumber}>{accountNumber}</Text>
      <Text style={styles.balance}>£{balance.toFixed(2)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#006a4d",
    borderRadius: 10,
    padding: 16,
    margin: 16,
  },
  cardType: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  accountNumber: {
    color: "#fff",
    fontSize: 14,
    marginTop: 8,
  },
  balance: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
  },
})

export default BankCard

