import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent, SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Import necessary icons
import { useUser } from '../context/UserContext'; // Context for user data
import { getAccountTransactions } from '../api/userData'; // API function
import { PieChart, LineChart } from 'react-native-chart-kit'; // Charting library
import { LinearGradient } from 'expo-linear-gradient'; // For gradient effects

// Define the structure of a transaction object (matching API response)
interface Transaction {
  transaction_id: string;
  account_id: string;
  transaction_date: string;
  transaction_reference: string;
  transaction_amount: number;
  transaction_category: string;
  merchant_name?: string; // Optional merchant name
}

// Define categories considered 'eco-friendly'
const ECO_FRIENDLY_CATEGORIES = ['Public Transport', 'Cycling', 'Renewable Energy', 'Sustainable Shopping', 'Local Produce', "Local Farmer's Market", 'EcoShare Ride', 'Green Energy Co-op'];
// Define categories considered 'less eco-friendly'
const LESS_ECO_FRIENDLY_CATEGORIES = ['Flights', 'Fast Fashion', 'Meat Consumption', 'Single-Use Plastics', 'Driving'];

// Define colors for the pie chart segments
const chartColors = {
  ecoFriendly: '#4CAF50', // Green
  lessEcoFriendly: '#FFC107', // Amber
  neutral: '#9E9E9E', // Grey
};

// Define types for challenges and actions (using existing data structure)
type EcoChallenge = {
  id: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  icon: string;
};

type EcoAction = {
  id: string;
  title: string;
  description: string;
  impact: string;
  icon: string;
};

/**
 * Eco-Financial Impact Screen Component.
 * Analyzes user spending patterns based on transaction categories to estimate
 * the environmental impact of their financial activities.
 * Displays metrics like eco score, carbon footprint estimate, spending breakdown,
 * challenges, and actionable tips.
 * Fetches transaction data for all user accounts.
 */
export default function EcoFinancialImpactScreen() {
  // --- State Variables ---
  const { accounts, isLoading: userLoading } = useUser(); // Get accounts and loading state from context
  const [transactions, setTransactions] = useState<Transaction[]>([]); // Store all fetched transactions
  const [isLoading, setIsLoading] = useState(true); // Loading state for this screen's data fetching
  const [error, setError] = useState<string | null>(null); // Error state for data fetching
  const [activeTab, setActiveTab] = useState<string>('impact'); // Controls which tab content is visible ('impact', 'actions', 'challenges')
  const [hasScrolled, setHasScrolled] = useState(false); // Tracks if the ScrollView has been scrolled for header shadow effect

  // --- Static Data (Example Data) ---
  // Note: In a real app, this data might come from an API or be calculated dynamically.
  const [totalCarbonSaved] = useState<number>(247.8); // Example total carbon saved
  const [monthlyImpact] = useState<number[]>([12, 19, 25, 32, 45, 52, 63]); // Example monthly impact data for line chart
  const [impactDetails] = useState<{ trees: number; water: number; energy: number }>({ // Example equivalent impact metrics
    trees: 5.2,
    water: 1280,
    energy: 95.4,
  });

  // Example challenges data
  const ecoChallenges: EcoChallenge[] = [
    { id: '1', title: 'Zero Waste Month', description: 'Avoid single-use plastic purchases for 30 days', reward: '500 eco-points', progress: 0.65, icon: 'recycle' },
    { id: '2', title: 'Public Transport Hero', description: 'Use public transportation instead of car 10 times', reward: '300 eco-points', progress: 0.8, icon: 'bus' },
    { id: '3', title: 'Sustainable Shopping', description: 'Make 5 purchases from certified eco-friendly stores', reward: '400 eco-points', progress: 0.4, icon: 'shopping-outline' }, // Corrected icon name
  ];

  // Example actions data
  const ecoActions: EcoAction[] = [
    { id: '1', title: 'Switch to paperless statements', description: 'Save paper and reduce your carbon footprint', impact: 'Saves 2.4kg CO2 per year', icon: 'file-document-outline' },
    { id: '2', title: 'Invest in our Renewable Energy Fund', description: 'Support clean energy projects with as little as £50', impact: 'Avg. 6.2% return while reducing CO2 emissions', icon: 'cash-multiple' },
    { id: '3', title: 'Round-up transactions for reforestation', description: 'Round up purchases to donate to tree planting initiatives', impact: 'Plant a tree with just £2 of round-ups', icon: 'tree-outline' }, // Corrected icon name
  ];

  // Get screen width for chart dimensions
  const screenWidth = Dimensions.get('window').width;

  // --- Effects ---

  // Fetch transactions for all accounts when the component mounts or accounts/userLoading state changes
  useEffect(() => {
    const fetchAllTransactions = async () => {
      // Wait if user data/accounts are loading or if there are no accounts
      if (userLoading || accounts.length === 0) {
        if (!userLoading && accounts.length === 0) {
          setIsLoading(false); // Stop loading if no accounts exist
        }
        return;
      }

      setIsLoading(true); // Start loading indicator for this screen
      setError(null); // Reset error state
      let allTransactions: Transaction[] = [];
      try {
        // Fetch transactions for each account concurrently
        const transactionPromises = accounts.map(account =>
          getAccountTransactions(account.account_id)
        );
        const results = await Promise.all(transactionPromises);
        // Flatten results and filter out income (positive amounts) to only analyze spending
        allTransactions = results.flat().filter(tx => tx.transaction_amount < 0);
        setTransactions(allTransactions);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transaction data. Please try again.');
      } finally {
        setIsLoading(false); // Stop loading indicator
      }
    };

    fetchAllTransactions();
  }, [accounts, userLoading]); // Dependencies: re-run effect if accounts or userLoading changes

  // --- Data Calculation (Memoized) ---

  /**
   * Calculates spending totals for eco-friendly, less eco-friendly, and neutral categories.
   * Uses useMemo to optimize performance by only recalculating when transactions change.
   */
  const spendingAnalysis = useMemo(() => {
    let ecoFriendlySpending = 0;
    let lessEcoFriendlySpending = 0;
    let neutralSpending = 0;
    let totalSpending = 0;

    transactions.forEach(tx => {
      const amount = Math.abs(tx.transaction_amount); // Use absolute amount for spending
      totalSpending += amount;
      const category = tx.transaction_category || 'Other'; // Default category if missing

      // Check if category matches known eco-friendly categories
      if (ECO_FRIENDLY_CATEGORIES.some(ecoCat => category.toLowerCase().includes(ecoCat.toLowerCase()))) {
        ecoFriendlySpending += amount;
      // Check if category matches known less eco-friendly categories
      } else if (LESS_ECO_FRIENDLY_CATEGORIES.some(lessEcoCat => category.toLowerCase().includes(lessEcoCat.toLowerCase()))) {
        lessEcoFriendlySpending += amount;
      // Otherwise, classify as neutral/other
      } else {
        neutralSpending += amount;
      }
    });

    return {
      ecoFriendlySpending,
      lessEcoFriendlySpending,
      neutralSpending,
      totalSpending,
    };
  }, [transactions]); // Dependency: recalculate only if transactions change

  /**
   * Calculates the overall eco score (0-100) based on spending patterns.
   * Higher score indicates more eco-friendly spending.
   */
  const ecoScore = useMemo(() => {
    if (spendingAnalysis.totalSpending === 0) return 50; // Default score if no spending data
    // Base score on the ratio of eco-friendly spending
    const score = (spendingAnalysis.ecoFriendlySpending / spendingAnalysis.totalSpending) * 100;
    // Apply a penalty based on the ratio of less eco-friendly spending (max 20 points)
    const penalty = (spendingAnalysis.lessEcoFriendlySpending / spendingAnalysis.totalSpending) * 20;
    // Ensure the final score is within the 0-100 range
    return Math.max(0, Math.min(100, Math.round(score - penalty)));
  }, [spendingAnalysis]); // Dependency: recalculate if spendingAnalysis changes

  /**
   * Provides a qualitative rating (e.g., 'Excellent', 'Good') and color based on the eco score.
   */
  const ecoRating = useMemo(() => {
    if (ecoScore >= 80) return { text: 'Excellent', color: '#4CAF50' }; // Green
    if (ecoScore >= 60) return { text: 'Good', color: '#8BC34A' }; // Light Green
    if (ecoScore >= 40) return { text: 'Average', color: '#FFC107' }; // Amber
    if (ecoScore >= 20) return { text: 'Needs Improvement', color: '#FF9800' }; // Orange
    return { text: 'Poor', color: '#F44336' }; // Red
  }, [ecoScore]); // Dependency: recalculate if ecoScore changes

  /**
   * Estimates the carbon footprint (kg CO₂e) based on spending patterns.
   * Uses simplified, arbitrary factors for demonstration.
   */
  const carbonFootprintEstimate = useMemo(() => {
    // Assign arbitrary CO2 factors (kg CO2 per £ spent) - THESE ARE VERY ROUGH ESTIMATES
    const factors = {
      ecoFriendly: 0.1,
      lessEcoFriendly: 0.8,
      neutral: 0.3,
    };
    // Calculate total estimated CO2 based on spending in each category
    const co2 =
      spendingAnalysis.ecoFriendlySpending * factors.ecoFriendly +
      spendingAnalysis.lessEcoFriendlySpending * factors.lessEcoFriendly +
      spendingAnalysis.neutralSpending * factors.neutral;
    return co2.toFixed(1); // Return formatted to one decimal place
  }, [spendingAnalysis]); // Dependency: recalculate if spendingAnalysis changes

  /**
   * Prepares data formatted specifically for the PieChart component.
   * Filters out categories with zero spending.
   */
  const pieChartData = useMemo(() => {
    const data = [
      {
        name: 'Eco-Friendly',
        population: spendingAnalysis.ecoFriendlySpending, // Value for the chart segment
        color: chartColors.ecoFriendly, // Color for this segment
        legendFontColor: '#333', // Legend text color
        legendFontSize: 13, // Legend text size
      },
      {
        name: 'Less Eco-Friendly',
        population: spendingAnalysis.lessEcoFriendlySpending,
        color: chartColors.lessEcoFriendly,
        legendFontColor: '#333',
        legendFontSize: 13,
      },
      {
        name: 'Neutral/Other',
        population: spendingAnalysis.neutralSpending,
        color: chartColors.neutral,
        legendFontColor: '#333',
        legendFontSize: 13,
      },
    ];
    // Filter out segments with zero population (spending) to avoid chart errors/clutter
    return data.filter(item => item.population > 0);
  }, [spendingAnalysis]); // Dependency: recalculate if spendingAnalysis changes

  /**
   * Prepares data formatted specifically for the LineChart component.
   */
  const lineChartData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], // Example labels
    datasets: [
      {
        data: monthlyImpact, // Use the example monthly impact data
        color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`, // Line color (Bankable green)
        strokeWidth: 2, // Line thickness
      },
    ],
  }), [monthlyImpact]); // Dependency: recalculate if monthlyImpact changes

  // --- Chart Configuration ---

  /**
   * Configuration object for the react-native-chart-kit charts.
   */
  const chartConfig = {
    backgroundGradientFrom: '#f3fee8', // Background start color for charts
    backgroundGradientTo: '#f3fee8', // Background end color for charts
    color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`, // Default color for labels, lines etc.
    strokeWidth: 2, // Default stroke width
    barPercentage: 0.6, // Bar width percentage for bar charts (if used)
    decimalPlaces: 0, // Number of decimal places for labels
  };

  // --- Event Handlers ---

  /**
   * Handles the scroll event of the ScrollView.
   * Sets the `hasScrolled` state to true if scrolled down, false if scrolled back to top.
   * Used to conditionally apply a shadow to the header.
   * @param event - The native scroll event.
   */
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    if (scrollY > 0 && !hasScrolled) {
      setHasScrolled(true); // Scrolled down
    } else if (scrollY <= 0 && hasScrolled) {
      setHasScrolled(false); // Scrolled back to top
    }
  };

  // --- Helper Functions ---

  /**
   * Formats a number as a currency string (e.g., £123.45).
   * @param amount - The numerical amount.
   * @returns The formatted currency string.
   */
  const formatCurrency = (amount: number): string => {
    return `£${amount.toFixed(2)}`;
  };

  // --- Render Logic ---

  // Display loading indicator while fetching initial data
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006a4d" />
        <Text style={styles.loadingText}>Calculating your eco impact...</Text>
      </View>
    );
  }

  // Display error message if data fetching failed
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        {/* Consider adding a retry button here */}
      </View>
    );
  }

  // Display message if there are no spending transactions to analyze
  if (transactions.length === 0 && !isLoading) { // Check isLoading to avoid brief flash
    return (
      <SafeAreaView style={styles.container}>
        {/* Header (still shown in empty state) */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Eco Financial Impact</Text>
          <Text style={styles.subtitle}>Track your sustainable spending footprint</Text>
        </View>
        {/* Empty State Content */}
        <View style={styles.emptyContainer}>
          <Ionicons name="leaf-outline" size={64} color="#9E9E9E" />
          <Text style={styles.emptyTitle}>No Spending Data Found</Text>
          <Text style={styles.emptyText}>
            We couldn't find any spending transactions to analyze your eco-financial impact.
            Start spending to see your impact!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main component render when data is available
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with conditional shadow based on scroll position */}
      <View style={[
        styles.headerContainer,
        hasScrolled && styles.headerWithShadow // Apply shadow style if scrolled
      ]}>
        <Text style={styles.title}>Eco Financial Impact</Text>
        <Text style={styles.subtitle}>Track your sustainable spending footprint</Text>
      </View>

      {/* Scrollable main content area */}
      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll} // Attach scroll handler
        scrollEventThrottle={16} // Optimize scroll event frequency
      >
        {/* Carbon Footprint Summary Card */}
        <View style={styles.carbonSummaryContainer}>
          <View style={styles.carbonSummary}>
            <View style={styles.carbonValueContainer}>
              <Text style={styles.carbonLabel}>Carbon Footprint Reduced (Est.)</Text>
              <Text style={styles.carbonTotalValue}>{totalCarbonSaved} kg CO₂e</Text>
            </View>
          </View>
        </View>

        {/* Equivalent Impact Metrics (Trees, Water, Energy) */}
        <View style={styles.impactMetricsContainer}>
          <View style={styles.metricCard}>
            <MaterialCommunityIcons name="tree-outline" size={24} color="#006a4d" />
            <Text style={styles.metricValue}>{impactDetails.trees}</Text>
            <Text style={styles.metricLabel}>Trees Saved</Text>
          </View>
          <View style={styles.metricCard}>
            <MaterialCommunityIcons name="water-outline" size={24} color="#3498DB" />
            <Text style={styles.metricValue}>{impactDetails.water}</Text>
            <Text style={styles.metricLabel}>Liters Water</Text>
          </View>
          <View style={styles.metricCard}>
            <MaterialCommunityIcons name="lightning-bolt-outline" size={24} color="#F39C12" />
            <Text style={styles.metricValue}>{impactDetails.energy}</Text>
            <Text style={styles.metricLabel}>kWh Saved</Text>
          </View>
        </View>

        {/* Tab Navigation (Impact, Actions, Challenges) */}
        <View style={styles.enhancedTabContainer}>
          <TouchableOpacity
            style={[styles.enhancedTab, activeTab === 'impact' && styles.enhancedActiveTab]}
            onPress={() => setActiveTab('impact')}
          >
            <View style={styles.tabIconTextContainer}>
              <MaterialCommunityIcons
                name="chart-line"
                size={20}
                color={activeTab === 'impact' ? "#006a4d" : "#777"}
              />
              <Text style={[styles.enhancedTabText, activeTab === 'impact' && styles.enhancedActiveTabText]}>
                Impact
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.enhancedTab, activeTab === 'actions' && styles.enhancedActiveTab]}
            onPress={() => setActiveTab('actions')}
          >
            <View style={styles.tabIconTextContainer}>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={20}
                color={activeTab === 'actions' ? "#006a4d" : "#777"}
              />
              <Text style={[styles.enhancedTabText, activeTab === 'actions' && styles.enhancedActiveTabText]}>
                Actions
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.enhancedTab, activeTab === 'challenges' && styles.enhancedActiveTab]}
            onPress={() => setActiveTab('challenges')}
          >
            <View style={styles.tabIconTextContainer}>
              <MaterialCommunityIcons
                name="trophy-outline"
                size={20}
                color={activeTab === 'challenges' ? "#006a4d" : "#777"}
              />
              <Text style={[styles.enhancedTabText, activeTab === 'challenges' && styles.enhancedActiveTabText]}>
                Challenges
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Conditional Rendering based on Active Tab */}

        {/* --- Impact Tab Content --- */}
        {activeTab === 'impact' && (
          <View style={styles.tabContent}>
            {/* Eco Score Section */}
            <View style={[styles.card, styles.scoreCard]}>
              <Text style={styles.cardTitle}>Your Eco Score</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>{ecoScore}</Text>
                <Text style={styles.scoreOutOf}>/ 100</Text>
              </View>
              <View style={[styles.ratingBadge, { backgroundColor: ecoRating.color }]}>
                <Text style={styles.ratingText}>{ecoRating.text}</Text>
              </View>
              <Text style={styles.scoreDescription}>
                Reflects the estimated environmental impact of your spending habits.
              </Text>
            </View>

            {/* Carbon Impact Over Time Chart */}
            <View style={styles.chartSectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Carbon Impact Over Time (Est.)</Text>
                {/* Optional: Link to detailed view */}
                {/* <TouchableOpacity><Text style={styles.seeAllText}>Details</Text></TouchableOpacity> */}
              </View>
              <View style={styles.chartContainer}>
                <LineChart
                  data={lineChartData}
                  width={screenWidth - 60} // Adjust width based on container padding
                  height={220}
                  chartConfig={chartConfig}
                  bezier // Use smooth curves
                  style={styles.chart}
                />
              </View>
            </View>

            {/* Spending by Impact Category Chart */}
            <View style={styles.chartSectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Spending by Impact Category</Text>
                {/* Optional: Link to detailed view */}
                {/* <TouchableOpacity><Text style={styles.seeAllText}>Details</Text></TouchableOpacity> */}
              </View>
              <View style={styles.chartContainer}>
                {pieChartData.length > 0 ? ( // Only render chart if there's data
                  <PieChart
                    data={pieChartData}
                    width={screenWidth - 40} // Adjust width
                    height={200}
                    chartConfig={chartConfig}
                    accessor="population" // Key in data objects for values
                    backgroundColor="transparent" // Transparent background
                    paddingLeft="15" // Adjust padding
                    absolute // Show absolute values (£) instead of percentages
                    hasLegend={true} // Display the legend
                  />
                ) : (
                  <Text style={styles.noDataText}>Not enough spending data for chart.</Text>
                )}
              </View>
              {/* Display total spending analyzed */}
              <Text style={styles.totalSpendingText}>
                Total Analyzed Spending: {formatCurrency(spendingAnalysis.totalSpending)}
              </Text>
            </View>

            {/* Carbon Footprint Estimate Section */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Estimated Carbon Footprint</Text>
              <View style={styles.footprintContainer}>
                <Ionicons name="footsteps-outline" size={32} color="#607D8B" style={styles.footprintIcon} />
                <Text style={styles.footprintValue}>{carbonFootprintEstimate} kg CO₂e</Text>
              </View>
              <Text style={styles.footprintDescription}>
                A simplified estimate based on your spending categories for the analyzed period.
              </Text>
            </View>
          </View>
        )}

        {/* --- Actions Tab Content --- */}
        {activeTab === 'actions' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended Eco Actions</Text>
            </View>
            {/* List of recommended actions */}
            {ecoActions.map((action) => (
              <TouchableOpacity key={action.id} style={styles.actionCard}>
                <View style={styles.actionIconContainer}>
                  <MaterialCommunityIcons name={action.icon as any} size={28} color="#006a4d" />
                </View>
                <View style={styles.actionDetails}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                  <Text style={styles.actionImpact}>{action.impact}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#BBB" />
              </TouchableOpacity>
            ))}

            {/* Example Promotional Banner */}
            <View style={styles.customBannerContainer}>
              <LinearGradient colors={['#006a4d', '#3E8C55']} style={styles.customBanner}>
                <View style={styles.bannerContent}>
                  <MaterialCommunityIcons name="leaf" size={36} color="#FFF" />
                  <View style={styles.bannerTextContainer}>
                    <Text style={styles.bannerTitle}>Carbon Offset Subscription</Text>
                    <Text style={styles.bannerDescription}>
                      Offset your carbon footprint for just £5/month
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.bannerButton}>
                  <Text style={styles.bannerButtonText}>Learn More</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* --- Challenges Tab Content --- */}
        {activeTab === 'challenges' && (
          <View style={styles.tabContent}>
            <View style={styles.challengeListHeader}>
              <View>
                <Text style={styles.sectionTitle}>My Eco Challenges</Text>
                <Text style={styles.challengeSubtitle}>Complete challenges to earn rewards</Text>
              </View>
              {/* Optional: Display Eco Points */}
              {/* <View style={styles.ecoPointsContainer}><MaterialCommunityIcons name="leaf" size={18} color="#006a4d" /><Text style={styles.ecoPoints}>1250</Text></View> */}
            </View>

            {/* List of challenges */}
            {ecoChallenges.map((challenge) => (
              <View key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeCardHeader}>
                  <View style={styles.challengeIconContainer}>
                    <MaterialCommunityIcons name={challenge.icon as any} size={24} color="#FFF" />
                  </View>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                </View>
                <Text style={styles.challengeDescription}>{challenge.description}</Text>
                {/* Progress Bar */}
                <View style={styles.challengeProgressContainer}>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${challenge.progress * 100}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{Math.round(challenge.progress * 100)}%</Text>
                </View>
                {/* Footer with reward and details button */}
                <View style={styles.challengeFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="gift-outline" size={14} color="#006a4d" />
                    <Text style={[styles.challengeReward, { marginLeft: 4 }]}>
                      {challenge.reward}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.challengeButton}>
                    <Text style={styles.challengeButtonText}>Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Button to find more challenges */}
            <TouchableOpacity style={styles.findMoreButton}>
              <Text style={styles.findMoreButtonText}>Find More Challenges</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer Section (outside tabs) */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Impact estimates are based on transaction data and generalized carbon metrics. Actual impact may vary.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  // --- Main Layout & Containers ---
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Main background white
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#dc3545', // Red for errors
    textAlign: 'center',
  },
  emptyContainer: { // Styles for when no transaction data is found
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#ffffff', // Match main background
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d', // Muted text color
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#adb5bd', // Lighter muted text color
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: { // Container for the content within each tab
    paddingHorizontal: 16, // Horizontal padding for tab content
    paddingBottom: 16, // Padding at the bottom of tab content
  },

  // --- Header ---
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 14, // Adjust as needed for status bar height
    paddingBottom: 14,
    backgroundColor: '#ffffff', // White header background
    zIndex: 10, // Ensure header stays above scrolling content
    borderBottomWidth: 1, // Subtle border
    borderBottomColor: 'transparent', // Initially transparent border
  },
  headerWithShadow: { // Style applied when scrolled
    borderBottomColor: '#eaeaea', // Show border when scrolled
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3, // Android shadow
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333', // Dark text for title
  },
  subtitle: {
    fontSize: 14,
    color: '#666666', // Gray text for subtitle
    marginTop: 4,
  },

  // --- Carbon Summary Card (Top Card) ---
  carbonSummaryContainer: {
    paddingHorizontal: 16, // Match tab content padding
    paddingTop: 16, // Space above the card
  },
  carbonSummary: {
    backgroundColor: '#e9f5e9', // Light green background
    borderRadius: 12,
    padding: 16,
    alignItems: 'center', // Center content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  carbonValueContainer: {
    alignItems: 'center',
  },
  carbonLabel: {
    fontSize: 14,
    color: '#004d33', // Darker green text
  },
  carbonTotalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#006a4d', // Bankable green
    marginVertical: 4,
  },

  // --- Impact Metrics (Trees, Water, Energy) ---
  impactMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16, // Match tab content padding
    paddingVertical: 16, // Space above and below metrics
  },
  metricCard: {
    backgroundColor: '#ffffff', // White background for metric cards
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1, // Distribute space evenly
    marginHorizontal: 5, // Small gap between cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333', // Dark text for value
    marginTop: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#888', // Gray text for label
    marginTop: 2,
    textAlign: 'center', // Center label text
  },

  // --- Enhanced Tab Navigation ---
  enhancedTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0', // Light gray background for the tab bar container
    marginHorizontal: 16, // Match content padding
    borderRadius: 12, // Rounded corners for the container
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden', // Clip background color to rounded corners
    marginBottom: 16, // Space below tabs
  },
  enhancedTab: {
    flex: 1, // Each tab takes equal width
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#ffffff', // Default background for inactive tabs
  },
  enhancedActiveTab: {
    backgroundColor: '#F0FAF5', // Light green background for the active tab
    // No border needed if using background color for active state
  },
  tabIconTextContainer: { // Container for icon and text within a tab
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedTabText: {
    fontSize: 14,
    color: '#777', // Default text color for inactive tabs
    marginLeft: 6, // Space between icon and text
    fontWeight: '500',
  },
  enhancedActiveTabText: {
    color: '#006a4d', // Bankable green for active tab text
    fontWeight: '600', // Bold text for active tab
  },

  // --- General Card & Section Styles ---
  card: { // General style for content cards within tabs
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40', // Dark gray for card titles
    marginBottom: 12,
  },
  sectionHeader: { // Header for sections within tabs (e.g., chart sections)
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333', // Dark text for section titles
  },
  seeAllText: { // "See All" / "Details" link style
    fontSize: 14,
    color: '#006a4d', // Bankable green
    fontWeight: '500',
  },

  // --- Eco Score Card (Inside Impact Tab) ---
  scoreCard: {
    alignItems: 'center', // Center content
    backgroundColor: '#ffffff', // White background
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline', // Align text baselines
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#006a4d', // Bankable green
  },
  scoreOutOf: {
    fontSize: 18,
    color: '#6c757d', // Muted gray text
    marginLeft: 4,
    fontWeight: '500',
  },
  ratingBadge: { // Badge showing "Excellent", "Good", etc.
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15, // Pill shape
    marginBottom: 12,
  },
  ratingText: {
    color: '#ffffff', // White text on colored badge
    fontSize: 14,
    fontWeight: 'bold',
  },
  scoreDescription: {
    fontSize: 13,
    color: '#495057', // Dark gray text
    textAlign: 'center',
    lineHeight: 18,
  },

  // --- Chart Sections ---
  chartSectionContainer: { // Container for chart + header
    backgroundColor: '#f8f9fa', // Light background for chart sections
    borderRadius: 12,
    padding: 12, // Padding around the chart and header
    marginBottom: 16, // Space below chart section
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  chartContainer: { // Container specifically for the chart component
    backgroundColor: 'transparent', // Chart background is handled by chartConfig
    borderRadius: 12, // Match container rounding
    marginVertical: 10, // Space above/below chart
    alignItems: 'center', // Center chart horizontally
  },
  chart: { // Style applied directly to the chart component
    borderRadius: 12, // Rounded corners for the chart itself
  },
  noDataText: { // Text shown if chart data is empty
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    paddingVertical: 20, // Add padding when showing this text
  },
  totalSpendingText: { // Text below the pie chart showing total spending
    marginTop: 10, // Space above this text
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    textAlign: 'center',
  },

  // --- Carbon Footprint Card (Inside Impact Tab) ---
  footprintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  footprintIcon: {
    marginRight: 10,
  },
  footprintValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#607D8B', // Slate gray color
  },
  footprintDescription: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 18,
  },

  // --- Actions Tab ---
  actionCard: { // Style for each recommended action item
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff', // White background
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIconContainer: {
    backgroundColor: 'rgba(0, 106, 77, 0.1)', // Light green circle background for icon
    borderRadius: 20, // Circular background
    padding: 8,
    marginRight: 12,
  },
  actionDetails: {
    flex: 1, // Take remaining space
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  actionDescription: {
    fontSize: 13,
    color: '#888', // Gray text for description
    marginTop: 2,
  },
  actionImpact: { // Text showing the impact (e.g., "Saves 2.4kg CO2")
    fontSize: 13,
    color: '#006a4d', // Bankable green
    marginTop: 4,
    fontWeight: '500',
  },

  // --- Promotional Banner (Inside Actions Tab) ---
  customBannerContainer: {
    marginVertical: 15, // Space above/below banner
  },
  customBanner: { // Gradient background for banner
    borderRadius: 12,
    padding: 15,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bannerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF', // White text
  },
  bannerDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)', // Slightly transparent white text
    marginTop: 2,
  },
  bannerButton: { // "Learn More" button
    backgroundColor: '#FFF', // White button background
    borderRadius: 20, // Pill shape
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: 'flex-start', // Align button to the left
  },
  bannerButtonText: {
    color: '#006a4d', // Bankable green text
    fontWeight: '600',
    fontSize: 14,
  },

  // --- Challenges Tab ---
  challengeListHeader: { // Header specific to the challenges list
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  challengeSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  challengeCard: { // Style for each challenge item
    backgroundColor: '#ffffff', // White background
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  challengeCardHeader: { // Header within the challenge card (icon + title)
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Space below header
  },
  challengeIconContainer: {
    backgroundColor: '#006a4d', // Bankable green background for icon
    borderRadius: 8, // Slightly rounded square
    padding: 6,
    marginRight: 10,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1, // Allow title to wrap
  },
  challengeDescription: {
    fontSize: 14,
    color: '#666', // Gray text for description
    marginVertical: 8,
  },
  challengeProgressContainer: { // Container for progress bar and percentage text
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBarContainer: { // Background of the progress bar
    height: 8,
    backgroundColor: '#EEEEEE', // Light gray background
    borderRadius: 4,
    flex: 1, // Take available space
    marginRight: 10,
    overflow: 'hidden', // Clip the progress fill
  },
  progressBar: { // The fill part of the progress bar
    height: 8,
    backgroundColor: '#006a4d', // Bankable green fill
    borderRadius: 4,
  },
  progressText: { // Percentage text (e.g., "80%")
    fontSize: 14,
    fontWeight: '600',
    color: '#006a4d', // Bankable green
    width: 40, // Fixed width for alignment
    textAlign: 'right',
  },
  challengeFooter: { // Footer within the challenge card (reward + button)
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  challengeReward: { // Text showing the reward (e.g., "500 eco-points")
    fontSize: 14,
    color: '#666',
  },
  challengeButton: { // "Details" button
    backgroundColor: 'rgba(0, 106, 77, 0.1)', // Light green background
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16, // Pill shape
  },
  challengeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#006a4d', // Bankable green text
  },
  findMoreButton: { // Button below the list to find more challenges
    backgroundColor: '#ffffff', // White background
    borderWidth: 1,
    borderColor: '#006a4d', // Bankable green border
    borderRadius: 24, // Rounded corners
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10, // Space above button
  },
  findMoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006a4d', // Bankable green text
  },

  // --- Footer ---
  footer: {
    paddingHorizontal: 16, // Match content padding
    paddingVertical: 20, // Space above/below footer text
    borderTopWidth: 1, // Separator line above footer
    borderTopColor: '#eaeaea', // Light gray separator
    backgroundColor: '#ffffff', // Match main background
  },
  footerText: {
    fontSize: 12,
    color: '#888', // Gray text for footer disclaimer
    textAlign: 'center',
  },
});