import { View, Text, StyleSheet, FlatList } from "react-native"

const transactions = [
  { id: "1", name: "Grocery Store", amount: -50.25, date: "2025-02-20" },
  { id: "2", name: "Salary Deposit", amount: 2000, date: "2025-02-19" },
  { id: "3", name: "Restaurant", amount: -35.5, date: "2025-02-18" },
]

const TransactionList = () => {
  const renderItem = ({ item }) => (
    <View style={styles.transactionItem}>
      <View>
        <Text style={styles.transactionName}>{item.name}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      <Text style={[styles.transactionAmount, item.amount > 0 ? styles.positive : styles.negative]}>
        £{Math.abs(item.amount).toFixed(2)}
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Transactions</Text>
      <FlatList data={transactions} renderItem={renderItem} keyExtractor={(item) => item.id} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  transactionDate: {
    fontSize: 12,
    color: "#666",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  positive: {
    color: "green",
  },
  negative: {
    color: "red",
  },
})

export default TransactionList

