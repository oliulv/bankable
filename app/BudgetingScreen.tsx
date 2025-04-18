"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
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
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  Dimensions,
  Alert,
  Modal,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext"
import { getAccountTransactions } from "../api/userData"
import { LineChart } from "react-native-chart-kit"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width } = Dimensions.get("window")

// Transaction interface that matches our database structure
interface Transaction {
  transaction_id: string
  account_id: string
  transaction_date: string
  description: string
  amount: number
  transaction_type: string
  merchant_name?: string
  category?: string
}

// Only include expense categories for the pie chart
const EXPENSE_CATEGORIES = ["Food", "Utility", "Saving", "Health", "Leisure", "Shopping", "Withdrawal", "Interest"]

// Category colors for visualization - using shades of green for the pie chart
const CATEGORY_COLORS = {
  Food: "#015F45", // Dark green
  Utility: "#52B788", // Medium green
  Saving: "#81C995", // Light green
  Health: "#2D6A4F", // Forest green
  Leisure: "#40916C", // Teal green
  Shopping: "#6C757D", // Gray (switched from green)
  Withdrawal: "#74C69D", // Mint green
  Interest: "#B7E4C7", // Very light green
  // Keep other categories for transactions
  Mortgage: "#006A4D",
  Transfer: "#95D5B2", // Pale green (switched from gray)
  Gambling: "#E76F51",
  "Life Event": "#FFD166",
  "Monthly fees": "#9C6644",
  "Monthly income": "#52B788",
}

// Category budget interface
interface CategoryBudget {
  category: string
  budgetAmount: number
}

const DynamicBudgetCalendarScreen = () => {
  // Context and state
  const { customerData, accounts, isLoading: userDataLoading } = useUser()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [hasScrolled, setHasScrolled] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "settings">("overview")
  const [showBudgetModal, setShowBudgetModal] = useState<boolean>(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [budgetAmount, setBudgetAmount] = useState<string>("")
  const [tooltipData, setTooltipData] = useState<{ visible: boolean; value: number; date: string }>({
    visible: false,
    value: 0,
    date: "",
  })

  // Default to November 2024
  const defaultMonth = new Date(2024, 10, 1) // November 2024 (month is 0-indexed)
  const [selectedMonth, setSelectedMonth] = useState<Date>(defaultMonth)

  // Add state for month picker modal
  const [showMonthPicker, setShowMonthPicker] = useState<boolean>(false)

  // Category budgets state
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([])

  // Create a ref for the FlatList
  const flatListRef = useRef<FlatList>(null)

  // Initialize default budgets if none are stored
  useEffect(() => {
    const initializeBudgets = async () => {
      try {
        const savedBudgets = await AsyncStorage.getItem("categoryBudgets")
        if (savedBudgets) {
          setCategoryBudgets(JSON.parse(savedBudgets))
        } else {
          // Set default budgets if none exist
          const defaultBudgets = EXPENSE_CATEGORIES.map((category) => {
            let defaultAmount = 0
            if (category === "Shopping") defaultAmount = 250
            if (category === "Leisure") defaultAmount = 200
            return {
              category,
              budgetAmount: defaultAmount,
            }
          })
          setCategoryBudgets(defaultBudgets)
          await AsyncStorage.setItem("categoryBudgets", JSON.stringify(defaultBudgets))
        }
      } catch (error) {
        console.error("Failed to initialize category budgets:", error)
      }
    }

    initializeBudgets()
  }, [])

  // Load transactions from user accounts
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true)

        if (accounts && accounts.length > 0) {
          let allTransactions: Transaction[] = []

          for (const account of accounts) {
            const accountTransactions = await getAccountTransactions(account.account_id)
            // Map the API response to our Transaction interface
            const mappedTransactions = accountTransactions.map((tx: any) => ({
              transaction_id: tx.transaction_id,
              account_id: tx.account_id,
              transaction_date: tx.transaction_date,
              description: tx.transaction_reference || "Transaction",
              amount: tx.transaction_amount,
              transaction_type: tx.transaction_amount >= 0 ? "income" : "expense",
              merchant_name: tx.merchant_name || tx.transaction_reference,
              category: tx.transaction_category || "Other",
            }))
            allTransactions = [...allTransactions, ...mappedTransactions]
          }

          // Filter transactions for the selected month
          const filteredTransactions = allTransactions.filter((transaction) => {
            const transactionDate = new Date(transaction.transaction_date)
            return (
              transactionDate.getMonth() === selectedMonth.getMonth() &&
              transactionDate.getFullYear() === selectedMonth.getFullYear()
            )
          })

          setTransactions(filteredTransactions)
        } else {
          setTransactions([])
        }
      } catch (error) {
        console.error("Failed to load transactions:", error)
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [accounts, selectedMonth])

  // Save category budgets when they change
  useEffect(() => {
    const saveBudgets = async () => {
      try {
        await AsyncStorage.setItem("categoryBudgets", JSON.stringify(categoryBudgets))
      } catch (error) {
        console.error("Failed to save category budgets:", error)
      }
    }

    if (categoryBudgets.length > 0) {
      saveBudgets()
    }
  }, [categoryBudgets])

  // Handle scroll for header shadow effect
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y
    setHasScrolled(scrollY > 5)
  }

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true)

    try {
      if (accounts && accounts.length > 0) {
        let allTransactions: Transaction[] = []

        for (const account of accounts) {
          const accountTransactions = await getAccountTransactions(account.account_id)
          // Map the API response to our Transaction interface
          const mappedTransactions = accountTransactions.map((tx: any) => ({
            transaction_id: tx.transaction_id,
            account_id: tx.account_id,
            transaction_date: tx.transaction_date,
            description: tx.transaction_reference || "Transaction",
            amount: tx.transaction_amount,
            transaction_type: tx.transaction_amount >= 0 ? "income" : "expense",
            merchant_name: tx.merchant_name || tx.transaction_reference,
            category: tx.transaction_category || "Other",
          }))
          allTransactions = [...allTransactions, ...mappedTransactions]
        }

        // Filter for selected month
        const filteredTransactions = allTransactions.filter((transaction) => {
          const transactionDate = new Date(transaction.transaction_date)
          return (
            transactionDate.getMonth() === selectedMonth.getMonth() &&
            transactionDate.getFullYear() === selectedMonth.getFullYear()
          )
        })

        setTransactions(filteredTransactions)
      }
    } catch (error) {
      console.error("Failed to refresh transactions:", error)
      Alert.alert("Error", "Failed to refresh data. Please try again.")
    } finally {
      setRefreshing(false)
    }
  }

  // Filter transactions based on search and filter type
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Apply type filter
    if (filterType === "income") {
      filtered = filtered.filter((t) => t.amount > 0)
    } else if (filterType === "expense") {
      filtered = filtered.filter((t) => t.amount < 0)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.description?.toLowerCase().includes(query) ||
          t.merchant_name?.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query),
      )
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
  }, [transactions, filterType, searchQuery])

  // Calculate spending by category - only for expense categories
  const spendingByCategory = useMemo(() => {
    const categorySpending: Record<string, number> = {}

    // Only include expenses (negative amounts) for spending analysis
    transactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const category = t.category || "Other"
        // Only include expense categories and explicitly exclude Transfer
        if (EXPENSE_CATEGORIES.includes(category) && category !== "Transfer") {
          if (categorySpending[category]) {
            categorySpending[category] += Math.abs(t.amount)
          } else {
            categorySpending[category] = Math.abs(t.amount)
          }
        }
      })

    // Calculate total spending for percentages
    const totalSpending = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0)

    return Object.entries(categorySpending)
      .map(([category, amount]) => {
        // Calculate percentage for the label
        const percentage = totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0

        return {
          name: category,
          amount,
          percentage,
          color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "#6C757D",
          legendFontColor: "#333333",
          legendFontSize: 12,
        }
      })
      .sort((a, b) => b.amount - a.amount)
      .filter(item => item.name !== "Transfer"); // Additional filter to ensure Transfer is removed
  }, [transactions])

  // Calculate daily spending for the selected month
  const dailySpending = useMemo(() => {
    const dailyData: number[] = []
    const labels: string[] = []

    // Get days in the selected month
    const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
    const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
    const daysInMonth = endDate.getDate()

    // Initialize data for each day
    for (let i = 1; i <= daysInMonth; i++) {
      // Only add every 5th day label to avoid crowding
      labels.push(i % 5 === 0 ? i.toString() : "")

      // Sum expenses for this day
      const dayExpenses = transactions
        .filter((t) => {
          const transactionDate = new Date(t.transaction_date)
          return transactionDate.getDate() === i && t.amount < 0
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      dailyData.push(dayExpenses)
    }

    return {
      labels,
      datasets: [
        {
          data: dailyData,
          color: (opacity = 1) => `rgba(1, 95, 69, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    }
  }, [transactions, selectedMonth])

  // Calculate income vs. expenses
  const incomeVsExpenses = useMemo(() => {
    const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
    return { totalIncome, totalExpenses }
  }, [transactions])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    })
  }

  // Get icon for category
  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      food: "fast-food-outline",
      shopping: "cart-outline",
      monthly_income: "trending-up-outline",
      leisure: "videocam-outline",
      saving: "wallet-outline",
      utility: "flash-outline",
      withdrawal: "cash-outline",
      interest: "trending-up-outline",
      health: "fitness-outline",
      transfer: "swap-horizontal-outline",
      clothing: "shirt-outline",
      mortgage: "home-outline",
      gambling: "game-controller-outline",
    }

    // Normalize category to lowercase for case-insensitive matching
    const normalizedCategory = category?.toLowerCase()?.trim() || ""

    // Try direct match
    if (iconMap[normalizedCategory]) {
      return iconMap[normalizedCategory]
    }

    // Try to find partial matches
    for (const [key, icon] of Object.entries(iconMap)) {
      if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
        return icon
      }
    }

    // Default fallback
    return "card-outline"
  }

  // Find account name by ID
  const getAccountNameById = (accountId: string): string => {
    const account = accounts.find((acc) => acc.account_id === accountId)
    return account ? account.product.product_name : "Unknown Account"
  }

  // Chart configuration for line chart
  const lineChartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(1, 95, 69, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.7})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      stroke: "#e0f2e3",
      strokeWidth: 1,
    },
    propsForDots: {
      r: "0",
    },
    propsForLabels: {
      fontSize: 10,
    },
  }

  // Update budget amount handler
  const handleUpdateBudget = () => {
    const numericAmount = Number.parseFloat(budgetAmount)

    if (isNaN(numericAmount) || numericAmount < 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive number for your budget.")
      return
    }

    setCategoryBudgets((current) => {
      const existingBudget = current.find((b) => b.category === selectedCategory)

      if (existingBudget) {
        // Update existing budget
        return current.map((budget) =>
          budget.category === selectedCategory ? { ...budget, budgetAmount: numericAmount } : budget,
        )
      } else {
        // Add new budget
        return [...current, { category: selectedCategory, budgetAmount: numericAmount }]
      }
    })

    setShowBudgetModal(false)
    setBudgetAmount("")
    setSelectedCategory("")
  }

  // Open budget modal
  const openBudgetModal = (category: string) => {
    setSelectedCategory(category)
    const existingBudget = categoryBudgets.find((b) => b.category === category)
    setBudgetAmount(existingBudget ? existingBudget.budgetAmount.toString() : "")
    setShowBudgetModal(true)
  }

  // Render transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.amount > 0
    const accountName = getAccountNameById(item.account_id)

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionIconContainer}>
          <Ionicons name={getCategoryIcon(item.category || "Other")} size={24} color="#015F45" />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionMerchant}>{item.merchant_name || item.description}</Text>
          <Text style={styles.transactionCategory}>
            {item.category || "Other"} • {formatDate(item.transaction_date)}
          </Text>
          <Text style={styles.transactionAccount}>{accountName}</Text>
        </View>
        <View style={styles.transactionAmounts}>
          <Text style={[styles.transactionAmount, { color: isIncome ? "#015F45" : "#000000" }]}>
            {isIncome ? "+" : ""}
            {formatCurrency(item.amount)}
          </Text>
        </View>
      </View>
    )
  }

  // Custom pie chart component
  const CustomPieChart = () => {
    // Get all expense categories from transactions
    const allCategories = useMemo(() => {
      const categorySpending: Record<string, number> = {}

      // Include all expense categories from transactions
      transactions
        .filter((t) => t.amount < 0)
        .forEach((t) => {
          const category = t.category || "Other"
          // Explicitly exclude Transfer category
          if (category !== "Transfer") {
            if (categorySpending[category]) {
              categorySpending[category] += Math.abs(t.amount)
            } else {
              categorySpending[category] = Math.abs(t.amount)
            }
          }
        })

      // Calculate total spending for percentages
      const totalSpending = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0)

      return Object.entries(categorySpending)
        .map(([category, amount]) => {
          // Calculate percentage for the label
          const percentage = totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0

          // Assign a color from our palette or generate one
          const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "#6C757D"

          return {
            name: category,
            amount,
            percentage,
            color,
            legendFontColor: "#333333",
            legendFontSize: 12,
          }
        })
        .sort((a, b) => b.amount - a.amount)
        .filter(item => item.name !== "Transfer"); // Extra safety filter
    }, [transactions])
  
    if (allCategories.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No spending data available</Text>
        </View>
      )
    }

    return (
      <View style={styles.pieChartContainer}>
        {/* Larger visualization area */}
        <View style={styles.pieChartVisualContainer}>
          {allCategories.map((category, index) => (
            <View
              key={index}
              style={[
                styles.pieChartSegment,
                {
                  backgroundColor: category.color,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  position: "absolute",
                  top: 80 + Math.sin(index * (Math.PI / 4)) * 80, // Changed from Math.PI/6 to Math.PI/4 and increased radius from 60 to 80
                  left: 150 + Math.cos(index * (Math.PI / 4)) * 80, // Changed from Math.PI/6 to Math.PI/4 and increased radius from 60 to 80
                  zIndex: 5 - (index % 5),
                  transform: [{ scale: category.percentage / 15 }],
                },
              ]}
            />
          ))}
          <Text style={styles.pieChartCenterText}>{selectedMonth.toLocaleDateString("en-GB", { month: "short" })}</Text>
        </View>

        {/* Categories list underneath */}
        <View style={styles.pieChartLegendContainer}>
          {allCategories.map((category, index) => (
            <View key={index} style={styles.pieChartLegendItem}>
              <View style={[styles.legendColorDot, { backgroundColor: category.color }]} />
              <Text style={styles.pieChartLegendText}>
                {category.name} ({category.percentage}%)
              </Text>
              <Text style={styles.pieChartLegendAmount}>{formatCurrency(category.amount)}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const pillTabContainerWithShadow = StyleSheet.flatten([
    styles.pillTabContainer,
    {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
  ])

  // Update the handleScroll function to reset scroll position when switching tabs
  // Add this function to handle tab switching with scroll reset
  const switchTab = (tab: "overview" | "transactions" | "settings") => {
    setActiveTab(tab)
    // Reset scroll position when switching tabs
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true })
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with no shadow */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Budget Tracker</Text>
        <Text style={styles.subtitle}>
          {selectedMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </Text>

        {/* Month Selector */}
        <View style={styles.monthSelectorContainer}>
          <TouchableOpacity
            style={styles.monthArrowButton}
            onPress={() => {
              const newMonth = new Date(selectedMonth)
              newMonth.setMonth(newMonth.getMonth() - 1)
              if (newMonth.getFullYear() === 2024 && newMonth.getMonth() >= 0) {
                setSelectedMonth(newMonth)
              }
            }}
          >
            <Ionicons name="chevron-back" size={24} color="#015F45" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.monthButton} onPress={() => setShowMonthPicker(true)}>
            <Text style={styles.monthButtonText}>{selectedMonth.toLocaleDateString("en-GB", { month: "long" })}</Text>
            <Ionicons name="calendar-outline" size={18} color="#015F45" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.monthArrowButton}
            onPress={() => {
              const newMonth = new Date(selectedMonth)
              newMonth.setMonth(newMonth.getMonth() + 1)
              if (newMonth.getFullYear() === 2024 && newMonth.getMonth() <= 11) {
                setSelectedMonth(newMonth)
              }
            }}
          >
            <Ionicons name="chevron-forward" size={24} color="#015F45" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {loading || userDataLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#015F45" />
          <Text style={styles.loadingText}>Loading your budget data...</Text>
        </View>
      ) : (
        <>
          {/* Enhanced Tab Navigation with conditional shadow */}
          <View style={[styles.pillTabContainer, hasScrolled && styles.pillTabContainerWithShadow]}>
            <View style={styles.pillTabWrapper}>
              {/* Update the tab buttons to use the new switchTab function */}
              <TouchableOpacity
                style={[styles.pillTab, activeTab === "overview" && styles.activePillTab]}
                onPress={() => switchTab("overview")}
              >
                <View style={styles.tabIconTextContainer}>
                  <Ionicons
                    name="pie-chart-outline"
                    size={20}
                    color={activeTab === "overview" ? "#f3fee8" : "#015F45"}
                  />
                  <Text style={[styles.pillTabText, activeTab === "overview" && styles.activePillTabText]}>
                    Overview
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pillTab, activeTab === "transactions" && styles.activePillTab]}
                onPress={() => switchTab("transactions")}
              >
                <View style={styles.tabIconTextContainer}>
                  <Ionicons
                    name="list-outline"
                    size={20}
                    color={activeTab === "transactions" ? "#f3fee8" : "#015F45"}
                  />
                  <Text style={[styles.pillTabText, activeTab === "transactions" && styles.activePillTabText]}>
                    Transactions
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pillTab, activeTab === "settings" && styles.activePillTab]}
                onPress={() => switchTab("settings")}
              >
                <View style={styles.tabIconTextContainer}>
                  <Ionicons
                    name="settings-outline"
                    size={20}
                    color={activeTab === "settings" ? "#f3fee8" : "#015F45"}
                  />
                  <Text style={[styles.pillTabText, activeTab === "settings" && styles.activePillTabText]}>
                    Settings
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Content */}
          {activeTab === "overview" ? (
            <ScrollView
              contentContainerStyle={styles.contentContainer}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#015F45"]} />}
            >
              {/* Monthly Overview Card - Now inside the Overview tab */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>Monthly Overview</Text>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatLabel}>Income</Text>
                    <Text style={[styles.summaryStatValue, { color: "#015F45" }]}>
                      {formatCurrency(incomeVsExpenses.totalIncome)}
                    </Text>
                  </View>

                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatLabel}>Expenses</Text>
                    <Text style={[styles.summaryStatValue, { color: "#000000" }]}>
                      {formatCurrency(incomeVsExpenses.totalExpenses)}
                    </Text>
                  </View>

                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatLabel}>Net</Text>
                    <Text
                      style={[
                        styles.summaryStatValue,
                        {
                          color:
                            incomeVsExpenses.totalIncome - incomeVsExpenses.totalExpenses >= 0 ? "#015F45" : "#000000",
                        },
                      ]}
                    >
                      {formatCurrency(incomeVsExpenses.totalIncome - incomeVsExpenses.totalExpenses)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Redesigned Spending by Category Chart */}
              <View style={styles.chartSectionContainer}>
                <Text style={styles.sectionTitle}>Spending by Category</Text>
                <CustomPieChart />
              </View>

              {/* Cleaner Budget Goals Progress */}
              <View style={styles.budgetGoalsContainer}>
                <View style={styles.budgetGoalsHeader}>
                  <Text style={styles.sectionTitle}>Budget Goals</Text>
                  <TouchableOpacity style={styles.setBudgetButton} onPress={() => setActiveTab("settings")}>
                    <Ionicons name="settings-outline" size={18} color="#015F45" />
                  </TouchableOpacity>
                </View>

                {categoryBudgets.filter((budget) => budget.budgetAmount > 0).length > 0 ? (
                  <View style={styles.budgetGoalsList}>
                    {categoryBudgets
                      .filter((budget) => budget.budgetAmount > 0)
                      .map((budget) => {
                        const category = spendingByCategory.find((cat) => cat.name === budget.category)
                        const spent = category ? category.amount : 0
                        const progress = Math.min(spent / budget.budgetAmount, 1)
                        const isOverBudget = spent > budget.budgetAmount
                        const remaining = budget.budgetAmount - spent

                        return (
                          <View key={budget.category} style={styles.budgetGoalItem}>
                            <View style={styles.budgetGoalHeader}>
                              <View style={styles.budgetCategoryInfo}>
                                <Ionicons
                                  name={getCategoryIcon(budget.category)}
                                  size={20}
                                  color="#015F45"
                                  style={styles.budgetCategoryIcon}
                                />
                                <Text style={styles.budgetGoalCategory}>{budget.category}</Text>
                              </View>
                              <Text style={styles.budgetGoalAmount}>{formatCurrency(budget.budgetAmount)}</Text>
                            </View>

                            <View style={styles.budgetProgressRow}>
                              <View style={styles.progressBarContainer}>
                                <View
                                  style={[
                                    styles.progressBar,
                                    { width: `${progress * 100}%` },
                                    isOverBudget && styles.overBudgetBar,
                                  ]}
                                />
                              </View>
                              <Text style={styles.remainingBudget}>
                                {isOverBudget
                                  ? `Over by ${formatCurrency(Math.abs(remaining))}`
                                  : `Left ${formatCurrency(remaining)}`}
                              </Text>
                            </View>
                          </View>
                        )
                      })}
                  </View>
                ) : (
                  <View style={styles.noBudgetsContainer}>
                    <Text style={styles.noBudgetsText}>No budget goals set</Text>
                    <TouchableOpacity onPress={() => setActiveTab("settings")} style={styles.setGoalsButton}>
                      <Text style={styles.setGoalsText}>Set Budget Goals</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Improved Daily Spending Chart */}
              <View style={styles.chartSectionContainer}>
                <Text style={styles.sectionTitle}>Daily Spending</Text>
                {transactions.length > 0 ? (
                  <View style={styles.lineChartContainer}>
                    <LineChart
                      data={dailySpending}
                      width={width - 40}
                      height={220}
                      chartConfig={lineChartConfig}
                      bezier
                      style={styles.lineChart}
                      fromZero
                      withInnerLines={false}
                      withOuterLines={true}
                      withHorizontalLabels={true}
                      withVerticalLabels={true}
                      withDots={true}
                      yAxisLabel="£"
                      yAxisInterval={5}
                      onDataPointClick={({ value, dataset, getColor, index }) => {
                        // Get the date for this index
                        const day = index + 1
                        const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
                        const formattedDate = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })

                        setTooltipData({
                          visible: true,
                          value,
                          date: formattedDate,
                        })

                        // Hide tooltip after 3 seconds
                        setTimeout(() => {
                          setTooltipData((prev) => ({ ...prev, visible: false }))
                        }, 3000)
                      }}
                      decorator={() => {
                        if (!tooltipData.visible) return null

                        return (
                          <View style={styles.tooltipContainer}>
                            <View style={styles.tooltip}>
                              <Text style={styles.tooltipAmount}>{formatCurrency(tooltipData.value)}</Text>
                              <Text style={styles.tooltipDate}>{tooltipData.date}</Text>
                            </View>
                          </View>
                        )
                      }}
                    />
                    <Text style={styles.chartXAxisLabel}>
                      {selectedMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No daily spending data available</Text>
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
                  <TouchableOpacity style={styles.viewAllButton} onPress={() => setActiveTab("transactions")}>
                    <Text style={styles.viewAllText}>
                      View All Transactions for{" "}
                      {selectedMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#015F45" />
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          ) : activeTab === "transactions" ? (
            <FlatList
              ref={flatListRef}
              data={filteredTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.transaction_id}
              contentContainerStyle={styles.contentContainer}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              ListEmptyComponent={
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>No transactions found</Text>
                </View>
              }
              ListHeaderComponent={
                <View style={styles.filtersContainer}>
                  {/* Filters */}
                  <View style={styles.filterButtons}>
                    <TouchableOpacity
                      style={[styles.categoryFilterButton, filterType === "all" && styles.categoryFilterButtonActive]}
                      onPress={() => setFilterType("all")}
                    >
                      <Text
                        style={[styles.categoryFilterText, filterType === "all" && styles.categoryFilterTextActive]}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.categoryFilterButton,
                        filterType === "income" && styles.categoryFilterButtonActive,
                      ]}
                      onPress={() => setFilterType("income")}
                    >
                      <Text
                        style={[styles.categoryFilterText, filterType === "income" && styles.categoryFilterTextActive]}
                      >
                        Income
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.categoryFilterButton,
                        filterType === "expense" && styles.categoryFilterButtonActive,
                      ]}
                      onPress={() => setFilterType("expense")}
                    >
                      <Text
                        style={[styles.categoryFilterText, filterType === "expense" && styles.categoryFilterTextActive]}
                      >
                        Expenses
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              }
              ListFooterComponent={
                showSearch ? (
                  <View style={styles.searchContainer}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                      <TouchableOpacity onPress={() => setSearchQuery("")}>
                        <Ionicons name="close-circle" size={20} color="#6C757D" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null
              }
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#015F45"]} />}
            />
          ) : (
            <ScrollView
              contentContainerStyle={styles.contentContainer}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#015F45"]} />}
            >
              <View style={styles.settingsContainer}>
                <Text style={styles.settingsTitle}>Budget Settings</Text>
                <Text style={styles.settingsDescription}>
                  Set monthly spending limits for each category to help manage your finances.
                </Text>

                <View style={styles.budgetCategoriesList}>
                  {EXPENSE_CATEGORIES.map((category) => {
                    const budget = categoryBudgets.find((b) => b.category === category)
                    const budgetAmount = budget ? budget.budgetAmount : 0

                    return (
                      <TouchableOpacity
                        key={category}
                        style={styles.budgetCategoryItem}
                        onPress={() => openBudgetModal(category)}
                      >
                        <View style={styles.budgetCategoryLeft}>
                          <Ionicons
                            name={getCategoryIcon(category)}
                            size={24}
                            color="#015F45"
                            style={styles.budgetCategoryIcon}
                          />
                          <Text style={styles.budgetCategoryName}>{category}</Text>
                        </View>
                        <View style={styles.budgetCategoryRight}>
                          <Text style={styles.budgetCategoryAmount}>
                            {budgetAmount > 0 ? formatCurrency(budgetAmount) : "Set budget"}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color="#777" />
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            </ScrollView>
          )}
        </>
      )}

      {/* Budget Setting Modal */}
      <Modal
        visible={showBudgetModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Budget for {selectedCategory}</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowBudgetModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Monthly Budget Amount</Text>
              <View style={styles.chatInputContainer}>
                <Text style={styles.currencySymbol}>£</Text>
                <TextInput
                  style={styles.chatBudgetInput}
                  value={budgetAmount}
                  onChangeText={setBudgetAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelChatButton} onPress={() => setShowBudgetModal(false)}>
                <Text style={styles.cancelChatButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveChatButton} onPress={handleUpdateBudget}>
                <Text style={styles.saveChatButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.monthPickerContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowMonthPicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.monthGrid}>
              {Array.from({ length: 12 }, (_, i) => {
                const monthDate = new Date(2024, i, 1)
                const monthName = monthDate.toLocaleDateString("en-GB", { month: "short" })
                const isSelected = selectedMonth.getMonth() === i

                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.monthGridItem, isSelected && styles.selectedMonthGridItem]}
                    onPress={() => {
                      setSelectedMonth(new Date(2024, i, 1))
                      setShowMonthPicker(false)
                    }}
                  >
                    <Text style={[styles.monthGridText, isSelected && styles.selectedMonthGridText]}>{monthName}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
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
  pillTabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 8,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    zIndex: 10,
  },
  pillTabWrapper: {
    flexDirection: "row",
    backgroundColor: "#f3fee8",
    borderRadius: 20,
    overflow: "hidden",
  },
  pillTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activePillTab: {
    backgroundColor: "#015F45",
  },
  pillTabText: {
    fontSize: 14,
    color: "#015F45",
    marginLeft: 6,
  },
  activePillTabText: {
    color: "#f3fee8",
    fontWeight: "600",
  },
  enhancedTabContainer: {
    flexDirection: "row",
    backgroundColor: "#F9F9F9",
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  enhancedTabContainerShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    borderBottomColor: "#015F45",
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
    color: "#015F45",
    fontWeight: "600",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
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
  chartSectionContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  pieChartContainer: {
    paddingVertical: 10,
  },
  pieChartWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pieChartLeft: {
    flex: 1,
    paddingRight: 10,
  },
  pieChartRight: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  pieChartGraphic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  pieChartSegment: {
    position: "absolute",
  },
  pieChartCenterText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    zIndex: 10,
  },
  pieChartLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 4,
  },
  legendColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  pieChartLegendText: {
    flex: 1,
    fontSize: 12,
    color: "#333",
  },
  pieChartLegendAmount: {
    fontSize: 12,
    fontWeight: "500",
    color: "#015F45",
  },
  budgetGoalsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  budgetGoalsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  setBudgetButton: {
    padding: 8,
  },
  budgetGoalsList: {
    marginTop: 8,
  },
  budgetGoalItem: {
    marginBottom: 16,
  },
  budgetGoalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  budgetCategoryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetCategoryIcon: {
    marginRight: 8,
  },
  budgetGoalCategory: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  budgetGoalAmount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#015F45",
  },
  budgetProgressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: "#e0f2e3",
    borderRadius: 3,
    overflow: "hidden",
    marginRight: 10,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#015F45",
    borderRadius: 3,
  },
  overBudgetBar: {
    backgroundColor: "#000000",
  },
  remainingBudget: {
    fontSize: 12,
    color: "#666",
    width: 100,
    textAlign: "right",
  },
  noBudgetsContainer: {
    alignItems: "center",
    padding: 20,
  },
  noBudgetsText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  setGoalsButton: {
    backgroundColor: "#015F45",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  setGoalsText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  lineChartContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  lineChart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  chartXAxisLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  sectionContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
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
  transactionAccount: {
    fontSize: 12,
    color: "#015F45",
    marginTop: 2,
    fontWeight: "500",
  },
  transactionAmounts: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "600",
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
    backgroundColor: "#015F45",
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
    color: "#015F45",
    marginRight: 4,
  },
  settingsContainer: {
    padding: 16,
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  settingsDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  budgetCategoriesList: {
    marginTop: 10,
  },
  budgetCategoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f3fee8",
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  budgetCategoryLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetCategoryName: {
    fontSize: 16,
    color: "#333",
  },
  budgetCategoryRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetCategoryAmount: {
    fontSize: 14,
    color: "#015F45",
    marginRight: 8,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width - 40,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  currencyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    color: "#333",
    marginRight: 8,
  },
  budgetAmountInput: {
    flex: 1,
    fontSize: 18,
    color: "#333",
    paddingVertical: 12,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#015F45",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  tooltipContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  tooltip: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  tooltipAmount: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  tooltipDate: {
    color: "white",
    fontSize: 12,
  },
  categoryFilterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f3fee8",
  },
  categoryFilterButtonActive: {
    backgroundColor: "#015F45",
  },
  categoryFilterText: {
    fontSize: 14,
    color: "#015F45",
  },
  categoryFilterTextActive: {
    color: "#f3fee8",
    fontWeight: "600",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3fee8",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 0,
  },
  chatBudgetInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
  },
  cancelChatButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 24,
    backgroundColor: "#f5f5f5",
  },
  cancelChatButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  saveChatButton: {
    backgroundColor: "#015F45",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  saveChatButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  pillTabContainerWithShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  pieChartVisualContainer: {
    width: 300,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 20,
  },
  pieChartLegendContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  monthSelectorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  monthArrowButton: {
    padding: 10,
  },
  monthButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f3fee8",
  },
  monthButtonText: {
    fontSize: 16,
    color: "#015F45",
    fontWeight: "500",
  },
  monthPickerContent: {
    width: width - 40,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monthGridItem: {
    width: (width - 80) / 3,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedMonthGridItem: {
    backgroundColor: "#015F45",
  },
  monthGridText: {
    fontSize: 16,
    color: "#333",
  },
  selectedMonthGridText: {
    color: "#fff",
    fontWeight: "600",
  },
})

export default DynamicBudgetCalendarScreen
