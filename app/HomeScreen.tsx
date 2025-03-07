import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* HEADER CARD WITH BACKGROUND IMAGE */}
      <View style={styles.headerCardContainer}>
        <ImageBackground
          source={{
            uri: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?fit=crop&w=600&q=80",
          }}
          style={styles.headerCardBackground}
          imageStyle={styles.headerCardImage}
        >
          <View style={styles.headerCardContent}>
            <Text style={styles.accountType}>Classic</Text>
            <View style={styles.accountRow}>
              <Ionicons
                name="bug"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.accountNumber}>12-34-56 / 12345678</Text>
            </View>
            <Text style={styles.balance}>£100.00</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Pay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* RECENT TRANSACTIONS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.transactionItem}>
          <View style={styles.transactionDetails}>
            <Ionicons name="fast-food" size={20} color="#4f9f9f" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.transactionName}>McDonald's</Text>
              <Text style={styles.transactionDate}>20/02/2025</Text>
            </View>
          </View>
          <Text style={styles.transactionAmount}>£8.98</Text>
        </View>
        <View style={styles.transactionItem}>
          <View style={styles.transactionDetails}>
            <Ionicons name="cart" size={20} color="#4f9f9f" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.transactionName}>Tesco</Text>
              <Text style={styles.transactionDate}>11/02/2025</Text>
            </View>
          </View>
          <Text style={styles.transactionAmount}>£12.50</Text>
        </View>
      </View>

      {/* GROUP SAVING GOALS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Group Saving Goals</Text>
        <View style={styles.goalRow}>
          <Text style={styles.goalName}>Traveling</Text>
          <Text style={styles.goalPercent}>68%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: "68%" }]} />
        </View>
      </View>

      {/* SPENDING INSIGHTS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spending Insights</Text>
        <View style={styles.insightsBox}>
          <Ionicons
            name="pie-chart"
            size={24}
            color="#4f9f9f"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.insightsText}>
            This month, you spent 40% on groceries, 20% on entertainment, and
            40% on other expenses. Keep up the good work!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  /* HEADER CARD */
  headerCardContainer: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 16,
    marginBottom: 16,
    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
  },
  headerCardBackground: {
    flex: 1,
    justifyContent: "center",
  },
  headerCardImage: {
    resizeMode: "cover",
  },
  headerCardContent: {
    backgroundColor: "rgba(0,0,0,0.3)",
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  accountType: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: "#fff",
  },
  balance: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
  },
  actionButton: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  actionButtonText: {
    color: "#4f9f9f",
    fontWeight: "600",
  },

  /* SECTIONS */
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },

  /* TRANSACTIONS */
  transactionItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
  },
  transactionDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  transactionDate: {
    fontSize: 12,
    color: "#888",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },

  /* GROUP SAVING GOALS */
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  goalName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  goalPercent: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4f9f9f",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#ddd",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4f9f9f",
  },

  /* SPENDING INSIGHTS */
  insightsBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
  },
  insightsText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
});