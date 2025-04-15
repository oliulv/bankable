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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { useRouter } from "expo-router";
import { getAccountTransactions } from "../api/userData";

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
}

export default function HomeScreen(): JSX.Element {
  const router = useRouter();
  const { accounts, customerName, customerId, fetchAccountsData, isLoading } = useUser();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList<any>>(null);
  const [todayAffirmation] = useState<string>(
    dailyAffirmations[Math.floor(Math.random() * dailyAffirmations.length)]
  );
  const [accountTransactions, setAccountTransactions] = useState<Record<string, any[]>>({});
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Widget configuration state
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    { id: "daily-affirmation", type: "affirmation", title: "Daily Affirmation", order: 1, visible: true },
    { id: "recent-transactions", type: "transactions", title: "Recent Transactions", order: 2, visible: true },
    { id: "group-saving", type: "savings", title: "Group Saving Goals", order: 3, visible: true },
    { id: "spending-insights", type: "insights", title: "Spending Insights", order: 4, visible: true },
    { id: "emergency-fund", type: "fund", title: "Tomorrow Tracker", order: 5, visible: true },
    { id: "quick-actions", type: "actions", title: "Quick Actions", order: 6, visible: true },
  ]);

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
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < accounts.length) {
      setCurrentIndex(newIndex);
    }
  };
  
  // On scroll end, ensure we snap correctly
  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (accounts.length === 0) return;
    
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
    if (!currentAccount && widget.type !== "affirmation") return null;
    
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
              {loadingTransactions ? (
                <ActivityIndicator size="small" color="#4f9f9f" style={{marginVertical: 20}} />
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
          </DraggableWidget>
        );
        
      case "savings":
        return (
          <DraggableWidget key={widget.id} widget={widget} onReorder={() => {}}>
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
                  Based on your recent transactions, you're managing your finances effectively.
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

  // Show loading indicator when fetching accounts
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4f9f9f" />
        <Text style={{marginTop: 20, color: '#666'}}>Loading your accounts...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
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
            scrollEventThrottle={8} // Changed from 16 to 8 for more responsive tracking
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  welcomeHeader: {
    backgroundColor: "#4f9f9f",
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
    backgroundColor: '#e0e0e0',
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
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
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
  inflow: {
    color: "#4CAF50",
  },
  outflow: {
    color: "#F44336",
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
  viewAllButton: {
    marginTop: 12,
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: "#4f9f9f",
    fontWeight: "500",
  },
});