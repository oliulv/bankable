import { View, Text, StyleSheet, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import BankCard from "../components/BankCard"
import TransactionList from "../components/TransactionList"

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, Chelsea</Text>
        </View>
        <BankCard type="Classic" accountNumber="12-34-56 / 12345678" balance={1000.5} />
        <TransactionList />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
  },
})

export default HomeScreen

