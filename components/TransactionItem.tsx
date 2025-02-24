import type React from "react"
import { View, Text, StyleSheet } from "react-native"
import Icon from "react-native-vector-icons/Feather"

interface TransactionItemProps {
  transaction: {
    name: string
    date: string
    amount: number
    icon: string
  }
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name={transaction.icon} size={20} color="#000" />
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.name}>{transaction.name}</Text>
        <Text style={styles.date}>{transaction.date}</Text>
      </View>
      <Text style={styles.amount}>£{transaction.amount.toFixed(2)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8DC",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  iconContainer: {
    backgroundColor: "#98FB98",
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  date: {
    fontSize: 12,
    color: "#666",
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default TransactionItem

