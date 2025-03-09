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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.85; 
const SPACING = (screenWidth - CARD_WIDTH) / 2;

interface Transaction {
  id: number;
  name: string;
  date: string;
  amount: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: "inflow" | "outflow"; // Added transaction type
}

interface AccountData {
  id: number;
  cardVideo: any;
  accountType: string;
  accountNumber: string;
  balance: string;
  transactions: Transaction[];
  groupSavingGoals: { goalName: string; percent: number };
  spendingInsights: string;
}

// Enhanced sample data with transaction types
const accounts: AccountData[] = [
  {
    id: 1,
    cardVideo: require("../assets/videos/REC-2.mp4"),
    accountType: "Premium",
    accountNumber: "98-76-54 / 87654321",
    balance: "£250.00",
    transactions: [
      { id: 1, name: "Starbucks", date: "15/03/2025", amount: "£5.00", icon: "cafe", type: "outflow" },
      { id: 2, name: "Amazon", date: "10/03/2025", amount: "£45.00", icon: "cart", type: "outflow" },
    ],
    groupSavingGoals: { goalName: "New Car", percent: 45 },
    spendingInsights:
      "You spent 50% on utilities, 30% on shopping, and 20% on other expenses.",
  },
  {
    id: 0, // This is the Classic account (middle one)
    cardVideo: require("../assets/videos/REC-1.mp4"),
    accountType: "Classic",
    accountNumber: "12-34-56 / 12345678",
    balance: "£100.00",
    transactions: [
      { id: 1, name: "McDonald's", date: "20/02/2025", amount: "£8.98", icon: "fast-food", type: "outflow" },
      { id: 2, name: "Tesco", date: "11/02/2025", amount: "£12.50", icon: "basket", type: "outflow" },
      { id: 3, name: "Salary", date: "01/03/2025", amount: "£1,450.00", icon: "cash", type: "inflow" },
    ],
    groupSavingGoals: { goalName: "Traveling", percent: 68 },
    spendingInsights:
      "This month, you spent 40% on groceries, 20% on entertainment, and 40% on other expenses.",
  },
  {
    id: 2,
    cardVideo: require("../assets/videos/REC-3.mp4"),
    accountType: "Gold",
    accountNumber: "11-22-33 / 44445555",
    balance: "£500.00",
    transactions: [
      { id: 1, name: "Uber", date: "05/03/2025", amount: "£15.00", icon: "car", type: "outflow" },
      { id: 2, name: "Gym", date: "03/03/2025", amount: "£30.00", icon: "fitness", type: "outflow" },
      { id: 3, name: "Refund", date: "02/03/2025", amount: "£25.50", icon: "return-down-back", type: "inflow" },
    ],
    groupSavingGoals: { goalName: "House Renovation", percent: 80 },
    spendingInsights:
      "You spent 60% on rent, 25% on groceries, and 15% on other expenses.",
  },
];

// Find index of account with id 0
const defaultAccountIndex = accounts.findIndex(account => account.id === 0);

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
}

export default function HomeScreen(): JSX.Element {
  const [currentIndex, setCurrentIndex] = useState<number>(defaultAccountIndex);
  const flatListRef = useRef<FlatList<any>>(null);
  const [todayAffirmation] = useState<string>(
    dailyAffirmations[Math.floor(Math.random() * dailyAffirmations.length)]
  );
  
  // Widget configuration state
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    { id: "daily-affirmation", type: "affirmation", title: "Daily Affirmation", order: 1, visible: true },
    { id: "recent-transactions", type: "transactions", title: "Recent Transactions", order: 2, visible: true },
    { id: "group-saving", type: "savings", title: "Group Saving Goals", order: 3, visible: true },
    { id: "spending-insights", type: "insights", title: "Spending Insights", order: 4, visible: true },
    { id: "emergency-fund", type: "fund", title: "Tomorrow Tracker", order: 5, visible: true },
    { id: "quick-actions", type: "actions", title: "Quick Actions", order: 6, visible: true },
  ]);
  
  // Scroll to default account (id 0) when component mounts
  useEffect(() => {
    if (flatListRef.current && defaultAccountIndex >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: defaultAccountIndex,
          animated: false,
        });
      }, 100); // Small delay to ensure component is fully mounted
    }
  }, []);

  // Enhanced swipe sensitivity - even small swipes will trigger card change
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / (CARD_WIDTH + 8));
    
    // If there's any movement, prepare to snap to next/prev card
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < accounts.length) {
      setCurrentIndex(newIndex);
    }
  };
  
  // On scroll end, ensure we snap correctly
  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const velocity = e.nativeEvent.velocity?.x || 0;
    
    // Determine direction from velocity or position
    let newIndex = currentIndex;
    
    // Even small swipe should change card
    if (velocity < -0.1 && currentIndex < accounts.length - 1) {
      newIndex = currentIndex + 1;
    } else if (velocity > 0.1 && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else {
      // Fallback to position-based calculation
      newIndex = Math.round(offsetX / (CARD_WIDTH + 8));
    }
    
    // Ensure we're in bounds
    newIndex = Math.max(0, Math.min(newIndex, accounts.length - 1));
    
    // Snap to position
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: newIndex,
        animated: true,
      });
    }
    
    setCurrentIndex(newIndex);
  };

  const currentAccount = accounts[currentIndex];
  
  // Sort widgets by order
  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  // Function to render widgets based on type
  const renderWidget = (widget: WidgetConfig) => {
    if (!widget.visible) return null;
    
    switch (widget.type) {
      case "affirmation":
        return (
          <DraggableWidget key={widget.id} widget={widget} onReorder={() => {}}>
            <View style={styles.affirmationSection}>
              <Text style={styles.sectionTitle}>{widget.title}</Text>
              <View style={styles.affirmationBox}>
                <Text style={styles.affirmationText}>"{todayAffirmation}"</Text>
              </View>
            </View>
          </DraggableWidget>
        );
        
      case "transactions":
        return (
          <DraggableWidget key={widget.id} widget={widget} onReorder={() => {}}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{widget.title}</Text>
              {currentAccount.transactions.map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <View style={styles.transactionDetails}>
                    <Ionicons name={tx.icon} size={20} color="#4f9f9f" />
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
                </View>
              ))}
            </View>
          </DraggableWidget>
        );
        
      case "savings":
        return (
          <DraggableWidget key={widget.id} widget={widget} onReorder={() => {}}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{widget.title}</Text>
              <View style={styles.goalRow}>
                <Text style={styles.goalName}>
                  {currentAccount.groupSavingGoals.goalName}
                </Text>
                <Text style={styles.goalPercent}>
                  {currentAccount.groupSavingGoals.percent}%
                </Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${currentAccount.groupSavingGoals.percent}%` },
                  ]}
                />
              </View>
            </View>
          </DraggableWidget>
        );
        
      case "insights":
        return (
          <DraggableWidget key={widget.id} widget={widget} onReorder={() => {}}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{widget.title}</Text>
              <View style={styles.insightsBox}>
                <Ionicons
                  name="pie-chart"
                  size={24}
                  color="#4f9f9f"
                  style={{ marginRight: 12 }}
                />
                <Text style={styles.insightsText}>
                  {currentAccount.spendingInsights}
                </Text>
              </View>
            </View>
          </DraggableWidget>
        );
        
      case "fund":
        return (
          <DraggableWidget key={widget.id} widget={widget} onReorder={() => {}}>
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
          </DraggableWidget>
        );
        
      case "actions":
        return (
          <DraggableWidget key={widget.id} widget={widget} onReorder={() => {}}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{widget.title}</Text>
              <View style={styles.quickActionsContainer}>
                <TouchableOpacity style={styles.quickActionButton}>
                  <Ionicons name="send" size={24} color="#4f9f9f" />
                  <Text style={styles.quickActionText}>Transfer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionButton}>
                  <Ionicons name="document-text" size={24} color="#4f9f9f" />
                  <Text style={styles.quickActionText}>Pay Bills</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionButton}>
                  <Ionicons name="card" size={24} color="#4f9f9f" />
                  <Text style={styles.quickActionText}>Freeze Card</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionButton}>
                  <Ionicons name="pulse" size={24} color="#4f9f9f" />
                  <Text style={styles.quickActionText}>Investments</Text>
                </TouchableOpacity>
              </View>
            </View>
          </DraggableWidget>
        );
        
      default:
        return null;
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      {/* Swipeable Header Cards - Now at the top without Account Overview */}
      <View style={[styles.swipeableContainer, { marginTop: 16 }]}>
        <FlatList
          ref={flatListRef}
          data={accounts}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 8}
          decelerationRate="fast"
          snapToAlignment="center"
          onScroll={onScroll}
          onScrollEndDrag={onScrollEndDrag}
          scrollEventThrottle={16} // Important for smooth tracking
          contentContainerStyle={{ paddingHorizontal: SPACING }}
          getItemLayout={(data, index) => ({
            length: CARD_WIDTH + 8,
            offset: (CARD_WIDTH + 8) * index,
            index,
          })}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity 
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => {
                  // Navigate to account details or perform action
                }}
              >
                <Video
                  source={item.cardVideo}
                  style={styles.video}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                />
                <View style={styles.overlay} />
                <View style={styles.headerCardContent}>
                  <Text style={styles.accountType}>{item.accountType}</Text>
                  <View style={styles.accountRow}>
                    <Ionicons
                      name="bug"
                      size={20}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.accountNumber}>{item.accountNumber}</Text>
                  </View>
                  <Text style={styles.balance}>{item.balance}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
        
        {/* Card page indicator */}
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
      </View>

      {/* Widgets Section */}
      <View style={styles.widgetsContainer}>
        {sortedWidgets.map(renderWidget)}
      </View>
    </ScrollView>
  );
}

// Simple draggable widget implementation
// Full implementation would include proper drag & drop
const DraggableWidget: React.FC<{
  children: React.ReactNode;
  widget: WidgetConfig;
  onReorder: () => void;
}> = ({ children, widget, onReorder }) => {
  return (
    <View style={styles.widgetContainer}>
      {children}
      <TouchableOpacity style={styles.dragHandle}>
        <Ionicons name="move" size={16} color="#ccc" />
      </TouchableOpacity>
    </View>
  );
};

const CARD_HEIGHT = 200;
const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    backgroundColor: "#f5f5f7",
  },
  swipeableContainer: {
    height: CARD_HEIGHT + 20, // Added space for pagination
    marginBottom: 16,
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
    backgroundColor: "#4f9f9f",
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
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  headerCardContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  widgetsContainer: {
    paddingHorizontal: 16,
  },
  widgetContainer: {
    position: "relative",
    marginBottom: 16,
  },
  dragHandle: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  affirmationBox: {
    backgroundColor: "#f8f8f8",
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
    backgroundColor: "#f8f8f8",
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
  // New styles for transaction types
  inflow: {
    color: "#4CAF50", // Green color for inflow
  },
  outflow: {
    color: "#F44336", // Red color for outflow
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
    color: "#4f9f9f",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4f9f9f",
    borderRadius: 4,
  },
  insightsBox: {
    backgroundColor: "#f8f8f8",
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
    backgroundColor: "#f8f8f8",
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
});