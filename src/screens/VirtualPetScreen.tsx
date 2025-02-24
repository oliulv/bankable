import { Text, StyleSheet, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const VirtualPetScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Virtual Pet</Text>
      <Image
        source={{
          uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-19%20at%201.55.58%E2%80%AFPM-vXzN5aOAgtQrhdBHIwpQIWKWOunpSJ.png",
        }}
        style={styles.petImage}
      />
      {/* Add pet interaction components here */}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  petImage: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
})

export default VirtualPetScreen

