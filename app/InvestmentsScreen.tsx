// InvestmentPage.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Svg from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(0, 77, 77, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 77, 77, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
  style: {
    borderRadius: 16
  },
};

interface InvestmentData {
  etf: {
    labels: string[];
    data: number[];
  };
  stocks: {
    labels: string[];
    data: number[];
  };
  crypto: {
    data: { name: string; population: number; color: string; legendFontColor: string; legendFontSize: number }[];
  };
  details: string;
}

const investmentData: InvestmentData = {
  etf: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    data: [100, 120, 90, 140, 130, 150],
  },
  stocks: {
    labels: ["AAPL", "GOOGL", "AMZN", "MSFT", "TSLA"],
    data: [150, 200, 180, 220, 160],
  },
  crypto: {
    data: [
      { name: "Bitcoin", population: 45, color: "#f39c12", legendFontColor: "#7F7F7F", legendFontSize: 12 },
      { name: "Ethereum", population: 25, color: "#2980b9", legendFontColor: "#7F7F7F", legendFontSize: 12 },
      { name: "Ripple", population: 15, color: "#8e44ad", legendFontColor: "#7F7F7F", legendFontSize: 12 },
      { name: "Litecoin", population: 15, color: "#27ae60", legendFontColor: "#7F7F7F", legendFontSize: 12 },
    ],
  },
  details:
    "Our investment portfolio features a diverse mix of ETFs, individual stocks, and cryptocurrencies. With ETFs, you gain exposure to a broad market. Our curated stock selection targets high-growth companies, and our crypto segment is designed to capitalize on emerging digital assets.",
};

export default function InvestmentPage(): JSX.Element {
  const [selectedSection, setSelectedSection] = useState<"ETF" | "Stocks" | "Crypto">("ETF");

  const renderChart = () => {
    switch (selectedSection) {
      case "ETF":
        return (
          <View style={styles.chartStyle}>
            <LineChart
              data={{
                labels: investmentData.etf.labels,
                datasets: [{ data: investmentData.etf.data }],
              }}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{ borderRadius: 16 }}
            />
          </View>
        );
      case "Stocks":
        return (
          <View style={styles.chartStyle}>
            <BarChart
              data={{
                labels: investmentData.stocks.labels,
                datasets: [{ data: investmentData.stocks.data }],
              }}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              style={{ borderRadius: 16 }}
              fromZero
              yAxisLabel="$"
              yAxisSuffix=""
            />
          </View>
        );
      case "Crypto":
        return (
          <View style={styles.chartStyle}>
            <PieChart
              data={investmentData.crypto.data}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Investment Portfolio</Text>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        {(["ETF", "Stocks", "Crypto"] as const).map((section) => (
          <TouchableOpacity
            key={section}
            style={[styles.tab, selectedSection === section && styles.activeTab]}
            onPress={() => setSelectedSection(section)}
          >
            <Text style={[styles.tabText, selectedSection === section && styles.activeTabText]}>
              {section}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>{renderChart()}</View>

      {/* Detailed Information */}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsHeader}>Investment Details</Text>
        <Text style={styles.detailsText}>{investmentData.details}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#ddd",
  },
  activeTab: {
    backgroundColor: "#006a4d",
  },
  tabText: {
    fontSize: 16,
    color: "#333",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "600",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  chartStyle: {
    borderRadius: 16,
  },
  detailsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  detailsHeader: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    color: "#333",
  },
  detailsText: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
  },
});
