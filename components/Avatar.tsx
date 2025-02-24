import { View, Text, StyleSheet } from "react-native"

const Avatar = () => {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>CH</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#8FBC8F",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
})

export default Avatar

