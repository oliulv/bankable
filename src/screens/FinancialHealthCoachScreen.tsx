import { View, Text, StyleSheet } from "react-native"

const FinancialHealthCoachScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Financial Health Coach</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
})

export default FinancialHealthCoachScreen

