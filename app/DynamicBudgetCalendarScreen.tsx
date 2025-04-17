import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from "react-native";
import { useUser } from "../context/UserContext";
import { getAccountTransactions } from "../api/userData";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PieChart, LineChart } from "react-native-chart-kit";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get("window");

// Transaction interface that matches our database structure
interface Transaction {
  transaction_id: string;
  account_id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: string;
  merchant_name?: string;
  category?: string; // This will map to our standard categories
}

// Standard categories that match the user data
const STANDARD_CATEGORIES = [
  "Mortgage",
  "Leisure",
  "Utility",
  "Food",
  "Shopping",
  "Saving",
  "Health",
  "Transfer",
  "Gambling",
  "Life Event",
  "Monthly fees",
  "Interest",
  "Withdrawal",
  "Monthly income"
];

// Category colors for visualization
const CATEGORY_COLORS = {
  "Mortgage": "#006A4D",
  "Leisure": "#52B788",
  "Utility": "#4ECDC4",
  "Food": "#FF6B6B",
  "Shopping": "#C38D9E",
  "Saving": "#118AB2",
  "Health": "#1D3557",
  "Transfer": "#6C757D",
  "Gambling": "#E76F51",
  "Life Event": "#FFD166",
  "Monthly fees": "#9C6644",
  "Interest": "#06D6A0",
  "Withdrawal": "#6C757D",
  "Monthly income": "#52B788"
};

// Add this after your other interface definitions
interface CategoryBudget {
  category: string;
  budgetAmount: number;
}

const BudgetScreen = () => {
  // Context and state
  const { customerData, accounts, isLoading: userDataLoading } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "categories">("overview");
  
  // Default to November 2024
  const defaultMonth = new Date(2024, 10, 1); // November 2024 (month is 0-indexed)
  const [selectedMonth, setSelectedMonth] = useState<Date>(defaultMonth);

  // Add this to your state declarations
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([
    { category: "Food", budgetAmount: 300 },
    { category: "Shopping", budgetAmount: 200 },
    { category: "Leisure", budgetAmount: 150 },
    { category: "Utility", budgetAmount: 250 },
  ]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempBudgetAmount, setTempBudgetAmount] = useState<string>("");

  // Load transactions from user accounts
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        
        if (accounts && accounts.length > 0) {
          let allTransactions: Transaction[] = [];
          
          for (const account of accounts) {
            const accountTransactions = await getAccountTransactions(account.account_id);
            allTransactions = [...allTransactions, ...accountTransactions];
          }
          
          // Filter transactions for the selected month
          const filteredTransactions = allTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.transaction_date);
            return transactionDate.getMonth() === selectedMonth.getMonth() && 
                   transactionDate.getFullYear() === selectedMonth.getFullYear();
          });
          
          setTransactions(filteredTransactions);
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error("Failed to load transactions:", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadTransactions();
  }, [accounts, selectedMonth]);
  
  // Handle scroll for header shadow effect
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setHasScrolled(scrollY > 5);
  };
  
  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    
    // Refresh data from context and reload transactions
    if (accounts && accounts.length > 0) {
      const loadTransactions = async () => {
        try {
          let allTransactions: Transaction[] = [];
          
          for (const account of accounts) {
            const accountTransactions = await getAccountTransactions(account.account_id);
            allTransactions = [...allTransactions, ...accountTransactions];
          }
          
          // Filter for selected month
          const filteredTransactions = allTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.transaction_date);
            return transactionDate.getMonth() === selectedMonth.getMonth() && 
                   transactionDate.getFullYear() === selectedMonth.getFullYear();
          });
          
          setTransactions(filteredTransactions);
        } catch (error) {
          console.error("Failed to refresh transactions:", error);
        } finally {
          setRefreshing(false);
        }
      };
      
      loadTransactions();
    } else {
      setRefreshing(false);
    }
  };
  
  // Filter transactions based on search and filter type
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    // Apply type filter
    if (filterType === "income") {
      filtered = filtered.filter(t => t.amount > 0);
    } else if (filterType === "expense") {
      filtered = filtered.filter(t => t.amount < 0);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t => t.description?.toLowerCase().includes(query) || 
             t.merchant_name?.toLowerCase().includes(query) ||
             t.category?.toLowerCase().includes(query)
      );
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    );
  }, [transactions, filterType, searchQuery]);
  
  // Calculate spending by category
  const spendingByCategory = useMemo(() => {
    const categorySpending: Record<string, number> = {};
    
    // Only include expenses (negative amounts) for spending analysis
    transactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        const category = t.category || "Other";
        if (categorySpending[category]) {
          categorySpending[category] += Math.abs(t.amount);
        } else {
          categorySpending[category] = Math.abs(t.amount);
        }
      });
    
    return Object.entries(categorySpending)
      .map(([category, amount]) => ({
        name: category,
        amount,
        color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "#6C757D",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);
  
  // Calculate daily spending for the selected month
  const dailySpending = useMemo(() => {
    const dailyData: number[] = [];
    const labels: string[] = [];
    
    // Get days in the selected month
    const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    const daysInMonth = endDate.getDate();
    
    // Initialize data for each day
    for (let i = 1; i <= daysInMonth; i++) {
      labels.push(i.toString());
      
      // Sum expenses for this day
      const dayExpenses = transactions
        .filter(t => {
          const transactionDate = new Date(t.transaction_date);
          return transactionDate.getDate() === i && t.amount < 0;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      dailyData.push(dayExpenses);
    }
    
    return {
      labels,
      datasets: [{
        data: dailyData,
        color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`,
        strokeWidth: 2,
      }]
    };
  }, [transactions, selectedMonth]);
  
  // Calculate income vs. expenses
  const incomeVsExpenses = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return { totalIncome, totalExpenses };
  }, [transactions]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: "#f3fee8",
    backgroundGradientTo: "#f3fee8",
    color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.7})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
  };

  // Render transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.amount > 0;
    
    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionIconContainer}>
          <MaterialCommunityIcons 
            name={getCategoryIcon(item.category || "Other")} 
            size={24} 
            color="#006a4d" 
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionMerchant}>{item.merchant_name || item.description}</Text>
          <Text style={styles.transactionCategory}>
            {item.category || "Other"} • {formatDate(item.transaction_date)}
          </Text>
        </View>
        <View style={styles.transactionAmounts}>
          <Text style={[
            styles.transactionAmount, 
            { color: isIncome ? "#4CAF50" : "#FF5252" }
          ]}>
            {isIncome ? "+" : ""}{formatCurrency(item.amount)}
          </Text>
        </View>
      </View>
    );
  };

  // Get icon for category
  const getCategoryIcon = (category: string): any => {
    const iconMap: Record<string, any> = {
      "Mortgage": "home",
      "Leisure": "gamepad-variant",
      "Utility": "lightning-bolt",
      "Food": "food",
      "Shopping": "shopping",
      "Saving": "piggy-bank",
      "Health": "medical-bag",
      "Transfer": "bank-transfer",
      "Gambling": "dice-multiple",
      "Life Event": "calendar-star",
      "Monthly fees": "cash-multiple",
      "Interest": "percent",
      "Withdrawal": "cash",
      "Monthly income": "cash-plus",
      "Other": "help-circle"
    };
    
    return iconMap[category] || "help-circle";
  };

  // Update the renderCategoryItem function
  const renderCategoryItem = ({ item }: { item: any }) => {
    const categoryBudget = categoryBudgets.find(budget => budget.category === item.name);
    const budgetAmount = categoryBudget?.budgetAmount || 0;
    const progress = budgetAmount > 0 ? Math.min(item.amount / budgetAmount, 1) : 0;
    const isOverBudget = item.amount > budgetAmount && budgetAmount > 0;
    
    return (
      <View style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIconContainer, { backgroundColor: item.color }]}>
            <MaterialCommunityIcons 
              name={getCategoryIcon(item.name)} 
              size={20} 
              color="#FFF" 
            />
          </View>
          <Text style={styles.categoryName}>{item.name}</Text>
        </View>
        
        <View style={styles.categoryBudgetRow}>
          <Text style={styles.categoryAmount}>{formatCurrency(item.amount)}</Text>
          {editingCategory === item.name ? (
            <View style={styles.budgetEditContainer}>
              <TextInput
                style={styles.budgetInput}
                value={tempBudgetAmount}
                onChangeText={setTempBudgetAmount}
                keyboardType="numeric"
                placeholder="Set budget"
                autoFocus
              />
              <TouchableOpacity
                onPress={() => {
                  const amount = parseFloat(tempBudgetAmount);
                  if (!isNaN(amount) && amount > 0) {
                    setCategoryBudgets(current => 
                      current.map(budget => 
                        budget.category === item.name 
                          ? { ...budget, budgetAmount: amount }
                          : budget
                      )
                    );
                  }
                  setEditingCategory(null);
                }}
              >
                <MaterialCommunityIcons name="check" size={20} color="#006a4d" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                const currentBudget = categoryBudgets.find(b => b.category === item.name);
                setTempBudgetAmount(currentBudget ? currentBudget.budgetAmount.toString() : "");
                setEditingCategory(item.name);
              }}
            >
              <Text style={styles.budgetText}>
                {budgetAmount > 0 
                  ? `Budget: ${formatCurrency(budgetAmount)}` 
                  : "Set budget"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {budgetAmount > 0 && (
          <>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${progress * 100}%` },
                  isOverBudget && styles.overBudgetBar
                ]} 
              />
            </View>
            <Text style={[
              styles.budgetStatus,
              isOverBudget && styles.overBudgetText
            ]}>
              {isOverBudget 
                ? `${formatCurrency(item.amount - budgetAmount)} over budget` 
                : `${Math.round(progress * 100)}% of budget`}
            </Text>
          </>
        )}
        
        <View style={styles.categoryPercentContainer}>
          <Text style={styles.categoryPercent}>
            {((item.amount / spendingByCategory.reduce((sum, cat) => sum + cat.amount, 0)) * 100).toFixed(1)}%
          </Text>
          <Text style={styles.categoryLabel}>of total</Text>
        </View>
      </View>
    );
  };

  // Add these functions
  const saveCategoryBudgets = async () => {
    try {
      await AsyncStorage.setItem('categoryBudgets', JSON.stringify(categoryBudgets));
    } catch (error) {
      console.error('Failed to save category budgets:', error);
    }
  };

  const loadCategoryBudgets = async () => {
    try {
      const savedBudgets = await AsyncStorage.getItem('categoryBudgets');
      if (savedBudgets) {
        setCategoryBudgets(JSON.parse(savedBudgets));
      }
    } catch (error) {
      console.error('Failed to load category budgets:', error);
    }
  };

  // Add this useEffect to load budgets when component mounts
  useEffect(() => {
    loadCategoryBudgets();
  }, []);

  // Add this useEffect to save budgets when they change
  useEffect(() => {
    saveCategoryBudgets();
  }, [categoryBudgets]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with conditional shadow */}
      <View style={[
        styles.headerContainer, 
        hasScrolled && styles.headerWithShadow
      ]}>
        <Text style={styles.title}>Budget Tracker</Text>
        <Text style={styles.subtitle}>
          {selectedMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </Text>
      </View>

      {/* Main Content */}
      {loading || userDataLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006A4D" />
          <Text style={styles.loadingText}>Loading your budget data...</Text>
        </View>
      ) : (
        <>
          {/* Budget Summary Card */}
          <View style={styles.summaryCardContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Text style={styles.summaryCardTitle}>Monthly Overview</Text>
              </View>
              
              <View style={styles.summaryStats}>
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatLabel}>Income</Text>
                  <Text style={[styles.summaryStatValue, { color: "#4CAF50" }]}>
                    {formatCurrency(incomeVsExpenses.totalIncome)}
                  </Text>
                </View>
                
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatLabel}>Expenses</Text>
                  <Text style={[styles.summaryStatValue, { color: "#FF5252" }]}>
                    {formatCurrency(incomeVsExpenses.totalExpenses)}
                  </Text>
                </View>
                
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatLabel}>Balance</Text>
                  <Text style={[
                    styles.summaryStatValue, 
                    { color: incomeVsExpenses.totalIncome - incomeVsExpenses.totalExpenses >= 0 ? "#4CAF50" : "#FF5252" }
                  ]}>
                    {formatCurrency(incomeVsExpenses.totalIncome - incomeVsExpenses.totalExpenses)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.summaryCardContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Text style={styles.summaryCardTitle}>Financial Summary</Text>
              </View>
              
              <View style={styles.summaryStats}>
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatLabel}>Account Balance</Text>
                  <Text style={[styles.summaryStatValue, { color: "#4CAF50" }]}>
                    {formatCurrency(accounts.reduce((sum, account) => sum + (account.starting_balance || 0), 0))}
                  </Text>
                </View>
                
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatLabel}>Monthly Income</Text>
                  <Text style={[styles.summaryStatValue, { color: "#4CAF50" }]}>
                    {formatCurrency(customerData?.monthly_income || 0)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Enhanced Tab Navigation */}
          <View style={styles.enhancedTabContainer}>
            <TouchableOpacity
              style={[styles.enhancedTab, activeTab === "overview" && styles.enhancedActiveTab]}
              onPress={() => setActiveTab("overview")}
            >
              <View style={styles.tabIconTextContainer}>
                <MaterialCommunityIcons 
                  name="chart-pie" 
                  size={20} 
                  color={activeTab === "overview" ? "#006a4d" : "#777"} 
                />
                <Text style={[
                  styles.enhancedTabText, 
                  activeTab === "overview" && styles.enhancedActiveTabText
                ]}>
                  Overview
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.enhancedTab, activeTab === "transactions" && styles.enhancedActiveTab]}
              onPress={() => setActiveTab("transactions")}
            >
              <View style={styles.tabIconTextContainer}>
                <MaterialCommunityIcons 
                  name="bank-transfer" 
                  size={20} 
                  color={activeTab === "transactions" ? "#006a4d" : "#777"} 
                />
                <Text style={[
                  styles.enhancedTabText, 
                  activeTab === "transactions" && styles.enhancedActiveTabText
                ]}>
                  Transactions
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.enhancedTab, activeTab === "categories" && styles.enhancedActiveTab]}
              onPress={() => setActiveTab("categories")}
            >
              <View style={styles.tabIconTextContainer}>
                <MaterialCommunityIcons 
                  name="tag-multiple" 
                  size={20} 
                  color={activeTab === "categories" ? "#006a4d" : "#777"} 
                />
                <Text style={[
                  styles.enhancedTabText, 
                  activeTab === "categories" && styles.enhancedActiveTabText
                ]}>
                  Categories
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <FlatList
            data={activeTab === "transactions" ? filteredTransactions : 
                 activeTab === "categories" ? spendingByCategory : []}
            renderItem={({item}) => {
              if (activeTab === "transactions") {
                return renderTransactionItem({item: item as Transaction});
              } else if (activeTab === "categories") {
                return renderCategoryItem({item});
              }
              return null;
            }}
            keyExtractor={(item: any) => activeTab === "transactions" ? (item as Transaction).transaction_id : (item as {name: string}).name}
            contentContainerStyle={styles.contentContainer}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  {activeTab === "transactions" ? "No transactions found" :
                   activeTab === "categories" ? "No category data found" :
                   "No data available"}
                </Text>
              </View>
            }
            ListHeaderComponent={
              activeTab === "overview" ? (
                <View style={styles.overviewContainer}>
                  {/* Spending by Category Chart */}
                  <View style={styles.chartSectionContainer}>
                    <Text style={styles.sectionTitle}>Spending by Category</Text>
                    {spendingByCategory.length > 0 ? (
                      <View style={styles.chartContainer}>
                        <PieChart
                          data={spendingByCategory}
                          width={width - 40}
                          height={220}
                          chartConfig={chartConfig}
                          accessor="amount"
                          backgroundColor="transparent"
                          paddingLeft="15"
                          absolute
                        />
                      </View>
                    ) : (
                      <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>No spending data available</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Daily Spending Chart */}
                  <View style={styles.chartSectionContainer}>
                    <Text style={styles.sectionTitle}>Daily Spending</Text>
                    {transactions.length > 0 ? (
                      <View style={styles.chartContainer}>
                        <LineChart
                          data={dailySpending}
                          width={width - 40}
                          height={220}
                          chartConfig={chartConfig}
                          bezier
                          style={styles.chart}
                        />
                      </View>
                    ) : (
                      <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>No daily data available</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Budget Goals Progress */}
                  <View style={styles.chartSectionContainer}>
                    <Text style={styles.sectionTitle}>Budget Goals Progress</Text>
                    {categoryBudgets.filter(budget => budget.budgetAmount > 0).length > 0 ? (
                      <View>
                        {categoryBudgets.filter(budget => budget.budgetAmount > 0).map(budget => {
                          const category = spendingByCategory.find(cat => cat.name === budget.category);
                          const spent = category ? category.amount : 0;
                          const progress = Math.min(spent / budget.budgetAmount, 1);
                          const isOverBudget = spent > budget.budgetAmount;
                          
                          return (
                            <View key={budget.category} style={styles.budgetGoalItem}>
                              <View style={styles.budgetGoalHeader}>
                                <Text style={styles.budgetGoalCategory}>{budget.category}</Text>
                                <Text style={styles.budgetGoalAmount}>
                                  {formatCurrency(spent)} / {formatCurrency(budget.budgetAmount)}
                                </Text>
                              </View>
                              <View style={styles.progressBarContainer}>
                                <View 
                                  style={[
                                    styles.progressBar, 
                                    { width: `${progress * 100}%` },
                                    isOverBudget && styles.overBudgetBar
                                  ]} 
                                />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>No budget goals set</Text>
                        <TouchableOpacity
                          onPress={() => setActiveTab("categories")}
                          style={styles.setGoalsButton}
                        >
                          <Text style={styles.setGoalsText}>Set Budget Goals</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Recent Transactions */}
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>
                    {filteredTransactions.slice(0, 5).map((transaction) => (
                      <React.Fragment key={transaction.transaction_id}>
                        {renderTransactionItem({ item: transaction })}
                      </React.Fragment>
                    ))}
                    {filteredTransactions.length > 5 && (
                      <TouchableOpacity 
                        style={styles.viewAllButton}
                        onPress={() => setActiveTab("transactions")}
                      >
                        <Text style={styles.viewAllText}>View All Transactions</Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color="#006a4d" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : activeTab === "transactions" ? (
                <View style={styles.filtersContainer}>
                  {/* Filters */}
                  <View style={styles.filterButtons}>
                    <TouchableOpacity
                      style={[styles.filterButton, filterType === "all" && styles.activeFilterButton]}
                      onPress={() => setFilterType("all")}
                    >
                      <Text style={[styles.filterButtonText, filterType === "all" && styles.activeFilterText]}>
                        All
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterButton, filterType === "income" && styles.activeFilterButton]}
                      onPress={() => setFilterType("income")}
                    >
                      <Text style={[styles.filterButtonText, filterType === "income" && styles.activeFilterText]}>
                        Income
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterButton, filterType === "expense" && styles.activeFilterButton]}
                      onPress={() => setFilterType("expense")}
                    >
                      <Text style={[styles.filterButtonText, filterType === "expense" && styles.activeFilterText]}>
                        Expenses
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Search */}
                  <TouchableOpacity 
                    style={styles.searchButton}
                    onPress={() => setShowSearch(!showSearch)}
                  >
                    <MaterialCommunityIcons name="magnify" size={20} color="#006a4d" />
                  </TouchableOpacity>
                </View>
              ) : null
            }
            ListFooterComponent={
              activeTab === "transactions" && showSearch ? (
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <MaterialCommunityIcons name="close" size={20} color="#6C757D" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null
            }
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                colors={["#006A4D"]}
              />
            }
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
  headerWithShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  summaryCardContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  summaryCard: {
    backgroundColor: "#f3fee8",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  summaryCardHeader: {
    marginBottom: 12,
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryStatItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryStatLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  enhancedTabContainer: {
    flexDirection: "row",
    backgroundColor: "#F9F9F9",
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  enhancedTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  enhancedActiveTab: {
    backgroundColor: "#F0FAF5",
    borderBottomWidth: 3,
    borderBottomColor: "#006a4d",
  },
  tabIconTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  enhancedTabText: {
    fontSize: 14,
    color: "#777",
    marginLeft: 6,
    fontWeight: "500",
  },
  enhancedActiveTabText: {
    color: "#006a4d",
    fontWeight: "600",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  overviewContainer: {
    marginBottom: 16,
  },
  chartSectionContainer: {
    backgroundColor: "#f3fee8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
  },
  noDataText: {
    fontSize: 14,
    color: "#888",
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3fee8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionIconContainer: {
    backgroundColor: "rgba(0, 106, 77, 0.1)",
    borderRadius: 10,
    padding: 8,
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  transactionCategory: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  transactionAmounts: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "600",
  },
  categoryCard: {
    backgroundColor: "#f3fee8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryIconContainer: {
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  categoryPercentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryPercent: {
    fontSize: 14,
    fontWeight: "600",
    color: "#006a4d",
    marginRight: 4,
  },
  categoryLabel: {
    fontSize: 14,
    color: "#666",
  },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: "row",
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: "#006a4d",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#555",
  },
  activeFilterText: {
    color: "#fff",
    fontWeight: "500",
  },
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f7",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 10,
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#006a4d",
    marginRight: 4,
  },
  categoryBudgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  budgetText: {
    fontSize: 14,
    color: "#006a4d",
    fontWeight: "500",
  },
  budgetEditContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#006a4d",
    padding: 4,
    width: 100,
    textAlign: "right",
    marginRight: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    marginBottom: 6,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#006a4d",
    borderRadius: 3,
  },
  overBudgetBar: {
    backgroundColor: "#FF5252",
  },
  budgetStatus: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  overBudgetText: {
    color: "#FF5252",
    fontWeight: "500",
  },
  budgetGoalItem: {
    marginBottom: 14,
  },
  budgetGoalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  budgetGoalCategory: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  budgetGoalAmount: {
    fontSize: 14,
    color: "#555",
  },
  setGoalsButton: {
    backgroundColor: "#006a4d",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
  },
  setGoalsText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
});

export default BudgetScreen;