import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  PanResponder,
  Animated,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { useRouter } from "expo-router";
import { getAccountTransactions } from "../api/userData";
import { BlurView } from 'expo-blur';
import { useScrollStatus } from "./_layout";
import { useEditMode } from '../context/EditModeContext';

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.85; 
const SPACING = (screenWidth - CARD_WIDTH) / 2;

interface Transaction {
  id: number;
  name: string;
  date: string;
  amount: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: "inflow" | "outflow";
}

// Map to convert product types to card images
const productTypeToImage: Record<string, any> = {
  "Personal Current Account": require("../assets/images/carddesign.png"),
  "Savings": require("../assets/images/carddesign.png"),
  "Credit Card": require("../assets/images/carddesign.png"),
  "Overdraft": require("../assets/images/carddesign.png"),
};

// Enhanced icon mapping with more fallbacks and case-insensitive matching
const categoryToIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  "food": "fast-food-outline",
  "shopping": "cart-outline",
  "monthly income": "trending-up-outline",
  "leisure": "game-controller-outline",
  "saving": "wallet-outline",
  "utility": "flash-outline",
  "withdrawal": "cash-outline",
  "entertainment": "game-controller-outline",
  "interest": "trending-up-outline",
  "health": "fitness-outline",
  "other": "apps-outline",
  "income": "trending-up-outline",
  "expense": "trending-down-outline",
  "transfer": "swap-horizontal-outline",
  "grocery": "basket-outline",
  "restaurant": "restaurant-outline",
  "coffee": "cafe-outline",
  "subscription": "repeat-outline",
  "clothing": "shirt-outline",
  "personal": "person-outline"
};

// Helper function to get appropriate icon
const getIconForCategory = (category: string): keyof typeof Ionicons.glyphMap => {
  // Normalize category to lowercase for case-insensitive matching
  const normalizedCategory = category?.toLowerCase()?.trim() || '';
  
  // Try direct match
  if (categoryToIcon[normalizedCategory]) {
    return categoryToIcon[normalizedCategory];
  }
  
  // Try to find partial matches
  for (const [key, icon] of Object.entries(categoryToIcon)) {
    if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
      return icon;
    }
  }
  
  // Default fallback
  return "card-outline";
};

// Daily affirmations from the screenshot
const dailyAffirmations = [
  "Your financial choices today shape your tomorrow. You're on the right path!",
  "Small steps toward financial goals create big changes over time.",
  "You are building wealth with every mindful decision you make.",
  "Financial freedom is a journey, not a destination. Enjoy the process.",
  "Today's discipline becomes tomorrow's financial security.",
];

// Widget system types
interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  order: number;
  visible: boolean;
  removable?: boolean;
  screenLink?: string;
}

interface AvailableWidget {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  preview: React.ReactNode;
  screenLink?: string;
}

const CARD_HEIGHT = 200;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    backgroundColor: "#ffffff", // Changed to white
  },
  miniProgressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#015F45', // Changed from #015F45 to dark green
    borderRadius: 2,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  previewContent: {
    flexDirection: 'column',
    gap: 8,
    minHeight: 100,
  },
  accountCardsSection: {
    width: '100%',
  },
  widgetPreview: {
    padding: 16,
    backgroundColor: "#f3fee8", // Changed to light green
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 2,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  welcomeHeader: {
    backgroundColor: "#015F45",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  welcomeSubtext: {
    fontSize: 16,
    color: "#e0e0e0",
    marginTop: 4,
  },
  swipeableContainer: {
    height: CARD_HEIGHT + 20, // Added space for pagination
    marginBottom: 16,
  },
  nocarddesign: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING,
    backgroundColor: '#ffffff',
  },
  noAccountText: {
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: "#015F45", // Changed from #015F45 to dark green
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4, // Add explicit white background
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%', // Add white background to images
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0)", // Increase opacity from 0.3 to 0.5
  },
  headerCardContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingLeft: 26, 
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
    fontWeight: "500",
    color: "#fff",
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: "#fff",
    paddingBottom: 14,
  },
  balance: {
    fontSize: 32,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 12,
  },
  widgetsContainer: {
    paddingHorizontal: 16,
  },
  widgetContainer: {
    position: "relative",
    marginBottom: 16,
    backgroundColor: "#f3fee8", // Changed to light green
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dragHandle: {
    padding: 4,
    marginRight: 8,
  },
  removeHandle: {
    padding: 4,
  },
  section: {
    backgroundColor: "#ffff1", // Changed to light green
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  affirmationSection: {
    backgroundColor: "#f3fee8", // Changed to light green
    borderRadius: 16,
    padding: 16,
  },
  affirmationBox: {
    backgroundColor: "#f3fee8", // Changed to light green
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  affirmationText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#333",
    textAlign: "center",
    lineHeight: 24,
  },
  transactionItem: {
    backgroundColor: "#f3fee8", // Changed to light green
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  },
  inflow: {
    color: "#015F45", // Changed from "#4CAF50" to "#015F45"
  },
  outflow: {
    color: "#333",
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  goalName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  goalPercent: {
    fontSize: 14,
    fontWeight: "500",
    color: "#015F45", // Changed from #015F45 to dark green
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#015F45", // Changed from #015F45 to dark green
    borderRadius: 4,
  },
  insightsBox: {
    backgroundColor: "#f3fee8", // Changed to light green
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  insightsText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  quickActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionButton: {
    width: "48%",
    backgroundColor: "#f3fee8", // Changed to light green
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  viewAllButton: {
    marginTop: 12,
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: "#015F45", // Changed from #015F45 to dark green
    fontWeight: "500",
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#006a4d',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  widgetPickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '70%',
  },
  widgetPreviewContainer: {
    width: screenWidth - 40,
    padding: 16,
    marginRight: 16,
    backgroundColor: "#f3fee8", // Changed to light green
    borderRadius: 12,
  },
  widgetPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  widgetDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginLeft: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  draggableWidget: {
    zIndex: 100,
  },
  editModeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#015F45', // Changed from #015F45 to dark green
    borderStyle: 'dashed',
    zIndex: 5,
  },
  editModeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#015F45', // Changed from #015F45 to dark green
    borderRadius: 20,
    padding: 8,
    zIndex: 1000,
  },
  editModeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  closeModalButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  widgetControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  widgetContent: {
    padding: 16,
  },
  widgetIconPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  widgetPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  widgetPreviewSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  widgetPreviewData: {
    marginTop: 8,
  },
  widgetPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  widgetPreviewLabel: {
    fontSize: 12,
    color: '#666',
  },
  widgetPreviewValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  widgetPreviewButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  widgetPreviewButtonText: {
    fontSize: 12,
    color: '#015F45', // Changed from #015F45 to dark green
    fontWeight: '500',
  },
});

// Placeholder preview components
const DynamicBudgetPreview = () => {
  // Mock data for preview
  const mockBudgetData = {
    totalBudget: 1000,
    totalSpent: 650
  };

  return (
    <View style={styles.widgetPreview}>
      <Text style={styles.previewTitle}>Budget Overview</Text>
      <View style={styles.previewContent}>
        <Text>Total Budget: £{mockBudgetData.totalBudget}</Text>
        <Text>Spent: £{mockBudgetData.totalSpent}</Text>
        <View style={styles.miniProgressBar}>
          <View style={[styles.miniProgressFill, { width: `${(mockBudgetData.totalSpent / mockBudgetData.totalBudget) * 100}%` }]} />
        </View>
      </View>
    </View>
  );
};

const InvestmentPreview = () => {
  const mockData = {
    totalValue: 12450.75,
    performance: 5.2,
    topHolding: "Tech ETF"
  };
  
  return (
    <View style={styles.widgetPreview}>
      <View style={styles.widgetPreviewHeader}>
        <View style={styles.widgetIconPreview}>
          <Ionicons name="trending-up" size={24} color="#015F45" />
        </View>
        <View>
          <Text style={styles.widgetPreviewTitle}>Investment Portfolio</Text>
          <Text style={styles.widgetPreviewSubtitle}>Performance overview</Text>
        </View>
      </View>
      <View style={styles.widgetPreviewData}>
        <View style={styles.widgetPreviewRow}>
          <Text style={styles.widgetPreviewLabel}>Portfolio Value</Text>
          <Text style={styles.widgetPreviewValue}>£{mockData.totalValue.toLocaleString()}</Text>
        </View>
        <View style={styles.widgetPreviewRow}>
          <Text style={styles.widgetPreviewLabel}>Performance</Text>
          <Text style={[styles.widgetPreviewValue, { color: mockData.performance > 0 ? '#4CAF50' : '#F44336' }]}>
            {mockData.performance > 0 ? '+' : ''}{mockData.performance}%
          </Text>
        </View>
        <View style={styles.widgetPreviewRow}>
          <Text style={styles.widgetPreviewLabel}>Top Holding</Text>
          <Text style={styles.widgetPreviewValue}>{mockData.topHolding}</Text>
        </View>
      </View>
    </View>
  );
};

const LoansPreview = () => {
  const mockData = {
    totalLoans: 3,
    nextPayment: 532.50,
    dueDate: "May 15"
  };
  
  return (
    <View style={styles.widgetPreview}>
      <View style={styles.widgetPreviewHeader}>
        <View style={styles.widgetIconPreview}>
          <Ionicons name="cash" size={24} color="#015F45" />
        </View>
        <View>
          <Text style={styles.widgetPreviewTitle}>Active Loans</Text>
          <Text style={styles.widgetPreviewSubtitle}>{mockData.totalLoans} active loans</Text>
        </View>
      </View>
      <View style={styles.widgetPreviewData}>
        <View style={styles.widgetPreviewRow}>
          <Text style={styles.widgetPreviewLabel}>Next Payment</Text>
          <Text style={styles.widgetPreviewValue}>£{mockData.nextPayment.toLocaleString()}</Text>
        </View>
        <View style={styles.widgetPreviewRow}>
          <Text style={styles.widgetPreviewLabel}>Due Date</Text>
          <Text style={styles.widgetPreviewValue}>{mockData.dueDate}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.widgetPreviewButton}>
        <Text style={styles.widgetPreviewButtonText}>View Loans</Text>
      </TouchableOpacity>
    </View>
  );
};

const GroupSavingsPreview = () => {
  const mockData = {
    activeGoals: 2,
    totalSaved: 1850,
    targetAmount: 2500
  };
  
  return (
    <View style={styles.widgetPreview}>
      <View style={styles.widgetPreviewHeader}>
        <View style={styles.widgetIconPreview}>
          <Ionicons name="people" size={24} color="#015F45" />
        </View>
        <View>
          <Text style={styles.widgetPreviewTitle}>Group Savings</Text>
          <Text style={styles.widgetPreviewSubtitle}>{mockData.activeGoals} active goals</Text>
        </View>
      </View>
      <View style={styles.widgetPreviewData}>
        <View style={styles.widgetPreviewRow}>
          <Text style={styles.widgetPreviewLabel}>Total Saved</Text>
          <Text style={styles.widgetPreviewValue}>£{mockData.totalSaved.toLocaleString()}</Text>
        </View>
        <View style={styles.widgetPreviewRow}>
          <Text style={styles.widgetPreviewLabel}>Progress</Text>
          <Text style={styles.widgetPreviewValue}>{Math.round((mockData.totalSaved / mockData.targetAmount) * 100)}%</Text>
        </View>
      </View>
      <View style={styles.miniProgressBar}>
        <View style={[styles.miniProgressFill, { width: `${(mockData.totalSaved / mockData.targetAmount) * 100}%` }]} />
      </View>
    </View>
  );
};

const StockPricePreview = () => {
  const mockData = {
    stocks: [
      { symbol: "AAPL", price: 182.63, change: 1.2 },
      { symbol: "MSFT", price: 417.88, change: -0.5 },
      { symbol: "GOOGL", price: 165.27, change: 0.8 }
    ]
  };
  
  return (
    <View style={styles.widgetPreview}>
      <View style={styles.widgetPreviewHeader}>
        <View style={styles.widgetIconPreview}>
          <Ionicons name="stats-chart" size={24} color="#015F45" />
        </View>
        <View>
          <Text style={styles.widgetPreviewTitle}>Market Watch</Text>
          <Text style={styles.widgetPreviewSubtitle}>Latest stock prices</Text>
        </View>
      </View>
      <View style={styles.widgetPreviewData}>
        {mockData.stocks.map((stock, index) => (
          <View key={index} style={styles.widgetPreviewRow}>
            <Text style={styles.widgetPreviewLabel}>{stock.symbol}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.widgetPreviewValue}>£{stock.price}</Text>
              <Text style={{ 
                fontSize: 12, 
                marginLeft: 4,
                color: stock.change > 0 ? '#4CAF50' : '#F44336'
              }}>
                {stock.change > 0 ? '+' : ''}{stock.change}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const VirtualPetPreview = () => {
  const mockData = {
    petName: "Finny",
    health: 85,
    happiness: 92,
    level: 4
  };
  
  return (
    <View style={styles.widgetPreview}>
      <View style={styles.widgetPreviewHeader}>
        <View style={styles.widgetIconPreview}>
          <Ionicons name="paw" size={24} color="#015F45" />
        </View>
        <View>
          <Text style={styles.widgetPreviewTitle}>Virtual Pet: {mockData.petName}</Text>
          <Text style={styles.widgetPreviewSubtitle}>Level {mockData.level} Financial Companion</Text>
        </View>
      </View>
      <View style={styles.widgetPreviewData}>
        <View style={styles.widgetPreviewRow}>
          <Text style={styles.widgetPreviewLabel}>Health</Text>
          <Text style={styles.widgetPreviewValue}>{mockData.health}%</Text>
        </View>
        <View style={styles.miniProgressBar}>
          <View style={[styles.miniProgressFill, { width: `${mockData.health}%` }]} />
        </View>
        <View style={[styles.widgetPreviewRow, { marginTop: 8 }]}>
          <Text style={styles.widgetPreviewLabel}>Happiness</Text>
          <Text style={styles.widgetPreviewValue}>{mockData.happiness}%</Text>
        </View>
        <View style={styles.miniProgressBar}>
          <View style={[styles.miniProgressFill, { width: `${mockData.happiness}%` }]} />
        </View>
      </View>
    </View>
  );
};

const EcoImpactPreview = () => {
  const mockData = {
    carbonSaved: 247.8,
    ecoTransactions: 15,
    treesSaved: 5.2
  };
  
  return (
    <View style={styles.widgetPreview}>
      <View style={styles.widgetPreviewHeader}>
        <View style={styles.widgetIconPreview}>
          <Ionicons name="leaf" size={24} color="#015F45" />
        </View>
        <View>
          <Text style={styles.widgetPreviewTitle}>Eco Impact</Text>
          <Text style={styles.widgetPreviewSubtitle}>Your sustainable finance impact</Text>
        </View>
      </View>
      <View style={styles.widgetPreviewData}>
        <View style={styles.widgetPreviewRow}>
          <Text style={styles.widgetPreviewLabel}>Carbon Reduced</Text>
          <Text style={styles.widgetPreviewValue}>{mockData.carbonSaved} kg CO₂</Text>
        </View>
        <View style={styles.widgetPreviewRow}>
          <Text style={styles.widgetPreviewLabel}>Eco Transactions</Text>
          <Text style={styles.widgetPreviewValue}>{mockData.ecoTransactions}</Text>
        </View>
        <View style={styles.widgetPreviewRow}>
          <Text style={styles.widgetPreviewLabel}>Trees Saved</Text>
          <Text style={styles.widgetPreviewValue}>{mockData.treesSaved}</Text>
        </View>
      </View>
    </View>
  );
};

// Define available widgets
const availableWidgets: AvailableWidget[] = [
  {
    id: 'budget-calendar',
    type: 'calendar',
    title: 'Budget Calendar',
    description: 'Track your spending with a dynamic calendar view',
    icon: 'calendar',
    preview: <DynamicBudgetPreview />,
    screenLink: '/DynamicBudgetCalendarScreen'
  },
  {
    id: 'investments',
    type: 'investments',
    title: 'Investment Portfolio',
    description: 'Quick view of your investment performance',
    icon: 'trending-up',
    preview: <InvestmentPreview />,
    screenLink: '/InvestmentsScreen'
  },
  {
    id: 'loans',
    type: 'loans',
    title: 'Active Loans',
    description: 'Overview of your current loans and payments',
    icon: 'cash',
    preview: <LoansPreview />,
    screenLink: '/LoansScreen'
  },
  {
    id: 'group-savings',
    type: 'group',
    title: 'Group Savings',
    description: 'Track your group saving goals progress',
    icon: 'people',
    preview: <GroupSavingsPreview />,
    screenLink: '/GroupSavingGoalsScreen'
  },
  {
    id: 'stock-prices',
    type: 'stocks',
    title: 'Market Watch',
    description: 'Live stock and ETF price updates',
    icon: 'stats-chart',
    preview: <StockPricePreview />,
    screenLink: '/InvestmentsScreen'
  },
  {
    id: 'virtual-pet',
    type: 'pet',
    title: 'Virtual Pet Status',
    description: 'Check on your financial companion',
    icon: 'paw',
    preview: <VirtualPetPreview />,
    screenLink: '/BankableVirtualPetScreen'
  },
  {
    id: 'eco-impact',
    type: 'eco',
    title: 'Eco Impact',
    description: 'Track your sustainable financial choices',
    icon: 'leaf',
    preview: <EcoImpactPreview />,
    screenLink: '/EcoFinancialImpactScreen'
  }
];

export default function HomeScreen(): JSX.Element {
  const router = useRouter();
  const { accounts, customerName, customerId, fetchAccountsData, isLoading } = useUser();
  const { setHasScrolled } = useScrollStatus();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList<any>>(null);
  const [todayAffirmation] = useState<string>(
    dailyAffirmations[Math.floor(Math.random() * dailyAffirmations.length)]
  );
  const [accountTransactions, setAccountTransactions] = useState<Record<string, any[]>>({});
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  // Use the edit mode from context instead of local state
  const { editMode, toggleEditMode } = useEditMode();

  // Widget configuration state
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    { id: "daily-affirmation", type: "affirmation", title: "Daily Affirmation", order: 1, visible: true, removable: true },
    { id: "recent-transactions", type: "transactions", title: "Recent Transactions", order: 2, visible: true, removable: true },
    { id: "group-saving", type: "savings", title: "Group Saving Goals", order: 3, visible: true, removable: true },
    { id: "spending-insights", type: "insights", title: "Spending Insights", order: 4, visible: true, removable: true },
    { id: "emergency-fund", type: "fund", title: "Tomorrow Tracker", order: 5, visible: true, removable: true },
    { id: "quick-actions", type: "actions", title: "Quick Actions", order: 6, visible: true, removable: true },
  ]);

  // State for dragging widgets
  const [draggingWidget, setDraggingWidget] = useState<string | null>(null);
  const [draggingPosition, setDraggingPosition] = useState<number | null>(null);
  const pan = useRef(new Animated.ValueXY()).current;

  // Fetch accounts when screen loads
  useEffect(() => {
    if (customerId) {
      fetchAccountsData(customerId);
    }
  }, [customerId]);

  // Fetch transactions for current account
  useEffect(() => {
    const fetchTransactionsForAccount = async (accountId: string) => {
      if (accountId && !accountTransactions[accountId]) {
        setLoadingTransactions(true);
        try {
          const transactions = await getAccountTransactions(accountId);
          setAccountTransactions(prev => ({
            ...prev,
            [accountId]: transactions
          }));
        } catch (error) {
          console.error("Error fetching transactions:", error);
        } finally {
          setLoadingTransactions(false);
        }
      }
    };

    if (accounts.length > 0 && currentIndex < accounts.length) {
      fetchTransactionsForAccount(accounts[currentIndex].account_id);
    }
  }, [currentIndex, accounts]);

  // Preload all card images when component mounts
  useEffect(() => {
    // Preload all card images when component mounts
    if (accounts.length > 0) {
      accounts.forEach(item => {
        const imageSource = productTypeToImage[item.product.product_type] || 
                      require("../assets/images/carddesign.png");
        if (typeof imageSource === 'number') {
          Image.prefetch(Image.resolveAssetSource(imageSource).uri);
        }
      });
    }
  }, [accounts]);

  // Format transactions for display
  const formatTransactions = (rawTransactions: any[] = []): Transaction[] => {
    return rawTransactions.slice(0, 3).map((tx, index) => ({
      id: index,
      name: tx.transaction_reference || "Transaction",
      date: new Date(tx.transaction_date).toLocaleDateString(),
      amount: formatCurrency(tx.transaction_amount),
      icon: getIconForCategory(tx.transaction_category),
      type: tx.transaction_amount >= 0 ? "inflow" : "outflow"
    }));
  };

  const formatCurrency = (amount: number): string => {
    return `£${Math.abs(amount).toFixed(2)}`;
  };

  // Enhanced swipe sensitivity - even small swipes will trigger card change
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (accounts.length === 0) return;
    
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / (CARD_WIDTH + 8));
    
    // If there's any movement, prepare to snap to next/prev card
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex <= accounts.length) {
      setCurrentIndex(newIndex);
    }
  };
  
  // Enhanced onScrollEndDrag with circular scrolling support
  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (accounts.length === 0) return;
    
    const offsetX = e.nativeEvent.contentOffset.x;
    const velocity = e.nativeEvent.velocity?.x || 0;
    
    // Determine direction from velocity or position
    let newIndex = currentIndex;
    
    // Even small swipe should change card
    if (velocity < -0.1 && currentIndex < accounts.length) {
      newIndex = currentIndex + 1;
    } else if (velocity > 0.1 && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else {
      // Fallback to position-based calculation
      newIndex = Math.round(offsetX / (CARD_WIDTH + 8));
    }
    
    // Handle circular navigation
    if (newIndex > accounts.length) {
      newIndex = 0;
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: 0,
          animated: false,
        });
      }
    } else if (newIndex < 0) {
      newIndex = accounts.length;
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: accounts.length,
          animated: false,
        });
      }
    }
    
    // Ensure we're in bounds
    newIndex = Math.max(0, Math.min(newIndex, accounts.length));
    
    // Snap to position
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: newIndex,
        animated: true,
      });
    }
    
    setCurrentIndex(newIndex);
  };

  const currentAccount = accounts.length > 0 ? accounts[currentIndex] : null;
  
  // Get transactions for current account
  const currentTransactions = currentAccount 
    ? formatTransactions(accountTransactions[currentAccount.account_id]) 
    : [];
  
  // Sort widgets by order
  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  // Function to render widgets based on type
  const renderWidget = (widget: WidgetConfig) => {
    if (!widget.visible) return null;
    
    // Find the matching widget from available widgets
    const availableWidget = availableWidgets.find(aw => aw.type === widget.type);
    
    // If it's a custom widget from another screen, render its preview
    if (availableWidget && widget.type !== "affirmation" && 
        widget.type !== "transactions" && widget.type !== "savings" && 
        widget.type !== "insights" && widget.type !== "fund" && 
        widget.type !== "actions") {
      return (
        <TouchableOpacity 
          onPress={() => {
            if (widget.screenLink) {
              router.push(widget.screenLink);
            }
          }}
        >
          {availableWidget.preview}
        </TouchableOpacity>
      );
    }
    
    // Otherwise render the default widgets
    switch (widget.type) {
      case "affirmation":
        return (
          <View style={styles.affirmationSection}>
            <Text style={styles.sectionTitle}>{widget.title}</Text>
            <View style={styles.affirmationBox}>
              <Text style={styles.affirmationText}>"{todayAffirmation}"</Text>
            </View>
          </View>
        );
        
      case "transactions":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{widget.title}</Text>
            {loadingTransactions ? (
              <ActivityIndicator size="small" color="#015F45" style={{marginVertical: 20}} />
            ) : currentTransactions.length > 0 ? (
              <>
                {currentTransactions.map((tx) => (
                  <TouchableOpacity 
                    key={tx.id} 
                    style={styles.transactionItem}
                    onPress={() => {
                      if (currentAccount) {
                        router.push({
                          pathname: '/AccountDetailsScreen',
                          params: { accountId: currentAccount.account_id }
                        });
                      }
                    }}
                  >
                    <View style={styles.transactionDetails}>
                      <Ionicons name={tx.icon} size={20} color="#015F45" />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.transactionName}>{tx.name}</Text>
                        <Text style={styles.transactionDate}>{tx.date}</Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.transactionAmount, 
                      tx.type === "inflow" ? styles.inflow : styles.outflow
                    ]}>
                      {tx.type === "inflow" ? "+" : "-"}{tx.amount}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => {
                    if (currentAccount) {
                      router.push({
                        pathname: '/AccountDetailsScreen',
                        params: { accountId: currentAccount.account_id }
                      });
                    }
                  }}
                >
                  <Text style={styles.viewAllText}>View all transactions</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.emptyText}>No recent transactions</Text>
            )}
          </View>
        );
        
      case "savings":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{widget.title}</Text>
            <View style={styles.goalRow}>
              <Text style={styles.goalName}>
                {currentAccount?.product?.product_type === "Savings" ? "Savings Goal" : "Financial Goal"}
              </Text>
              <Text style={styles.goalPercent}>
                45%
              </Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: '45%' },
                ]}
              />
            </View>
          </View>
        );
        
      case "insights":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{widget.title}</Text>
            <View style={styles.insightsBox}>
              <Ionicons
                name="pie-chart"
                size={24}
                color="#015F45"
                style={{ marginRight: 12 }}
              />
              <Text style={styles.insightsText}>
                Based on your recent transactions, you're managing your finances effectively.
              </Text>
            </View>
          </View>
        );
        
      case "fund":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{widget.title}</Text>
            <Text style={styles.subTitle}>Emergency fund progress</Text>
            <View style={styles.goalRow}>
              <Text style={styles.goalName}>Current: £1,500</Text>
              <Text style={styles.goalPercent}>Goal: £3,000</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: "50%" },
                ]}
              />
            </View>
          </View>
        );
        
      case "actions":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{widget.title}</Text>
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="send" size={24} color="#015F45" />
                <Text style={styles.quickActionText}>Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="document-text" size={24} color="#015F45" />
                <Text style={styles.quickActionText}>Pay Bills</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="card" size={24} color="#015F45" />
                <Text style={styles.quickActionText}>Freeze Card</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="pulse" size={24} color="#015F45" />
                <Text style={styles.quickActionText}>Investments</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };

  // Create PanResponder for draggable widgets
  const createPanResponder = (widgetId: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => editMode,
      onMoveShouldSetPanResponder: () => editMode,
      onPanResponderGrant: () => {
        // When user starts dragging
        setDraggingWidget(widgetId);
        const widget = widgets.find(w => w.id === widgetId);
        if (widget) {
          setDraggingPosition(widget.order);
        }
        
        // Animate the widget being dragged
        Animated.event([{ y: pan.y }], { useNativeDriver: false });
      },
      onPanResponderMove: Animated.event(
        [null, { dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        // Calculate new position based on gesture
        if (draggingPosition !== null) {
          const moveDistance = gestureState.dy;
          const widgetHeight = 150; // Approximate height of a widget
          const positionChange = Math.round(moveDistance / widgetHeight);
          
          if (positionChange !== 0) {
            const newPosition = Math.max(0, Math.min(widgets.length - 1, draggingPosition + positionChange));
            
            // Reorder widgets
            reorderWidgets(draggingPosition, newPosition);
          }
        }
        
        // Reset states
        setDraggingWidget(null);
        setDraggingPosition(null);
        pan.setValue({ x: 0, y: 0 });
      }
    });
  };

  // Add widget functionality
  const addWidget = (widget: AvailableWidget) => {
    setWidgets(prev => [
      ...prev,
      {
        id: `${widget.type}-${Date.now()}`,
        type: widget.type,
        title: widget.title,
        order: prev.length,
        visible: true,
        removable: true,
        screenLink: widget.screenLink
      }
    ]);
    setShowWidgetPicker(false);
  };

  // Remove widget functionality
  const removeWidget = (widgetId: string) => {
    setWidgets(prev => {
      const filtered = prev.filter(w => w.id !== widgetId);
      // Reorder remaining widgets
      return filtered.map((w, i) => ({ ...w, order: i }));
    });
  };

  // Widget reordering logic
  const reorderWidgets = (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return;
    
    const newWidgets = [...widgets];
    // Find the widget at the start index
    const widgetToMove = newWidgets.find(w => w.order === startIndex);
    
    if (!widgetToMove) return;
    
    // Update orders for all affected widgets
    newWidgets.forEach(widget => {
      if (startIndex < endIndex) {
        // Moving down
        if (widget.order > startIndex && widget.order <= endIndex) {
          widget.order -= 1;
        }
      } else {
        // Moving up
        if (widget.order < startIndex && widget.order >= endIndex) {
          widget.order += 1;
        }
      }
    });
    
    // Set the moved widget to its new position
    widgetToMove.order = endIndex;
    
    setWidgets(newWidgets);
  };

  // Show loading indicator when fetching accounts
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#015F45" />
        <Text style={{marginTop: 20, color: '#666'}}>Loading your accounts...</Text>
      </View>
    );
  }

  // Draggable Widget Component
  const DraggableWidget = ({ children, widget }: { children: React.ReactNode, widget: WidgetConfig }) => {
    const panResponder = createPanResponder(widget.id);
    const isDragging = draggingWidget === widget.id;
    
    return (
      <Animated.View
        {...(editMode ? panResponder.panHandlers : {})}
        style={[
          styles.widgetContainer,
          isDragging && styles.draggableWidget,
          isDragging && { transform: [{ translateY: pan.y }] }
        ]}
      >
        {children}
        
        {editMode && (
          <>
            <View style={styles.editModeOverlay} />
            <View style={styles.widgetControls}>
              <TouchableOpacity 
                style={styles.dragHandle} 
                onLongPress={() => setDraggingWidget(widget.id)}
              >
                <Ionicons name="move" size={20} color="#015F45" />
              </TouchableOpacity>
              
              {widget.removable && (
                <TouchableOpacity 
                  style={styles.removeHandle} 
                  onPress={() => removeWidget(widget.id)}
                >
                  <Ionicons name="close-circle" size={20} color="#ff6b6b" />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </Animated.View>
    );
  };

  // Add a scroll handler
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    if (scrollY > 10) {
      setHasScrolled(true);
    } else {
      setHasScrolled(false);
    }
  };

  return (
    <>
      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: '#ffffff' }}
        bounces={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Static Account Cards Section - Not Editable */}
        <View style={styles.accountCardsSection}>
          {/* Swipeable Header Cards */}
          <View style={[styles.swipeableContainer, { marginTop: 16 }]}>
            {accounts.length === 0 ? (
              <View style={[styles.card, styles.nocarddesign]}>
                <Text style={styles.noAccountText}>No accounts found</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={accounts}
                keyExtractor={(item) => item.account_id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + 8}
                decelerationRate={0.8} // Changed from "fast" to a numeric value for more precise control
                snapToAlignment="center"
                onScroll={onScroll}
                onScrollEndDrag={onScrollEndDrag}
                removeClippedSubviews={true}
                scrollEventThrottle={4} // Changed from 16 to 8 for more responsive tracking
                contentContainerStyle={{ paddingHorizontal: SPACING }}
                getItemLayout={(data, index) => ({
                  length: CARD_WIDTH + 8,
                  offset: (CARD_WIDTH + 8) * index,
                  index,
                })}
                pagingEnabled={true} // Add this for more intuitive paging behavior
                directionalLockEnabled={true} // Lock to horizontal scrolling only
                scrollToOverflowEnabled={true} // Better behavior near edges
                renderItem={({ item }) => {
                  const imageSource = productTypeToImage[item.product.product_type] || 
                                      require("../assets/images/carddesign.png");
                  return (
                    <TouchableOpacity 
                      style={styles.card}
                      activeOpacity={0.9}
                      onPress={() => {
                        // Navigate to account details
                        router.push({
                          pathname: '/AccountDetailsScreen',
                          params: { accountId: item.account_id }
                        });
                      }}
                    >
                      <Image
                        source={imageSource}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                      <View style={styles.overlay} />
                      <View style={styles.headerCardContent}>
                        <Text style={styles.accountType}>{item.product.product_type}</Text>
                        <View style={styles.accountRow}>
                          <Ionicons
                            name="card"
                            size={20}
                            color="#fff"
                            style={{ marginRight: 8 }}
                            paddingBottom={14}
                          />
                          <Text style={styles.accountNumber}>{item.account_id}</Text>
                        </View>
                        <Text style={styles.balance}>
                          £{typeof item.starting_balance === 'number' 
                              ? item.starting_balance.toFixed(2) 
                              : '0.00'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
            
            {/* Card page indicator */}
            {accounts.length > 0 && (
              <View style={styles.paginationContainer}>
                {accounts.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.paginationDot,
                      i === currentIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Editable Widgets Section */}
        <View style={styles.widgetsContainer}>
          {sortedWidgets.map((widget) => (
            widget.visible && (
              <DraggableWidget key={widget.id} widget={widget}>
                {renderWidget(widget)}
              </DraggableWidget>
            )
          ))}
        </View>
      </ScrollView>

      {/* Add Widget Button */}
      <Animated.View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowWidgetPicker(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Widget Picker Modal */}
      <Modal
        visible={showWidgetPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWidgetPicker(false)}
      >
        <BlurView style={styles.modalContainer} intensity={10}>
          <View style={styles.widgetPickerContainer}>
            <Text style={styles.modalTitle}>Add Widgets</Text>
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setShowWidgetPicker(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            
            <FlatList
              data={availableWidgets}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.widgetPreviewContainer}
                  onPress={() => addWidget(item)}
                >
                  <View style={styles.widgetPreviewContent}>
                    <Ionicons name={item.icon} size={24} color="#015F45" />
                    <Text style={styles.widgetTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.widgetDescription}>{item.description}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              contentContainerStyle={{ padding: 8 }}
            />
          </View>
        </BlurView>
      </Modal>
    </>
  );
}