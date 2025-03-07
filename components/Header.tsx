// components/Header.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { getCustomerById } from "../api/userData";

export default function Header() {
  const { customerId, customerName } = useUser();
  const [displayName, setDisplayName] = useState("Guest");

  useEffect(() => {
    async function fetchUserName() {
      try {
        // If we already have a name from the login process, use that
        if (customerName) {
          setDisplayName(customerName);
        }
        // Otherwise if we have an ID but no name, fetch from the database
        else if (customerId) {
          const customer = await getCustomerById(customerId);
          if (customer && customer.name) {
            setDisplayName(customer.name);
          }
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      }
    }

    fetchUserName();
  }, [customerId, customerName]);

  return (
    <View style={styles.header}>
      {/* Left side: turtle + Hello, [Name] */}
      <View style={styles.left}>
        <Image
          source={{
            uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2024-11-17_at_7.03.16_PM-removebg-preview-qYVjiMHoaYBDi7UFT0Diy07RmwLjrH.png",
          }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.userName}>Hello, {displayName}</Text>
      </View>

      {/* Right side: menu icon */}
      <TouchableOpacity onPress={() => console.log("Open menu")}>
        <Ionicons name="menu" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#006a4d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 24,
    height: 24,
    tintColor: "#fff",
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});