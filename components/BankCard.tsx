import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import Icon from "react-native-vector-icons/Feather"

interface BankCardProps {
  type: string
  accountNumber: string
  balance: number
}

const BankCard: React.FC<BankCardProps> = ({ type, accountNumber, balance }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardType}>{type}</Text>
          <View style={styles.accountNumberContainer}>
            <Icon name="lock" size={12} color="#fff" />
            <Text style={styles.accountNumber}>{accountNumber}</Text>
          </View>
        </View>
        <Icon name="turtle" size={24} color="#fff" />
      </View>

      <Text style={styles.balance}>£{balance.toFixed(2)}</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button}>
          <Icon name="credit-card" size={16} color="#8FBC8F" />
          <Text style={styles.buttonText}>Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Icon name="repeat" size={16} color="#8FBC8F" />
          <Text style={styles.buttonText}>Transfer</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#8FBC8F",
    borderRadius: 16,
    padding: 16,
    height: "100%",
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardType: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  accountNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  accountNumber: {
    fontSize: 12,
    color: "#fff",
    marginLeft: 4,
  },
  balance: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#8FBC8F",
    marginLeft: 8,
    fontWeight: "bold",
  },
})

export default BankCard

