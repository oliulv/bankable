"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
  SafeAreaView,
  RefreshControl, // Import RefreshControl
} from "react-native"
import { LineChart, PieChart } from "react-native-chart-kit"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Swipeable } from "react-native-gesture-handler"
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  TrendingUp,
  PieChart as PieChartIcon,
  Calendar,
  BarChart2,
  Wallet,
} from "lucide-react-native"

const { width } = Dimensions.get("window")

// Types
interface Transaction {
  id: string
  amount: number
  description: string
  category: string
  date: string // ISO string
  type: "income" | "expense"
}

interface Category {
  id: string
  name: string
  color: string
  budget: number
  icon: string
}

// Default categories with colors and icons
const defaultCategories: Category[] = [
  { id: "1", name: "Housing", color: "#006A4D", budget: 1200, icon: "🏠" },
  { id: "2", name: "Food", color: "#FF6B6B", budget: 500, icon: "🍔" },
  { id: "3", name: "Transportation", color: "#4ECDC4", budget: 300, icon: "🚗" },
  { id: "4", name: "Entertainment", color: "#FFD166", budget: 200, icon: "🎬" },
  { id: "5", name: "Shopping", color: "#C38D9E", budget: 300, icon: "🛍️" },
  { id: "6", name: "Utilities", color: "#E76F51", budget: 150, icon: "💡" },
  { id: "7", name: "Healthcare", color: "#1D3557", budget: 100, icon: "🏥" },
  { id: "8", name: "Personal", color: "#06D6A0", budget: 150, icon: "👤" },
  { id: "9", name: "Salary", color: "#52B788", budget: 0, icon: "💰" },
  { id: "10", name: "Investments", color: "#118AB2", budget: 0, icon: "📈" },
  { id: "11", name: "Gifts", color: "#9C6644", budget: 0, icon: "🎁" },
  { id: "12", name: "Other", color: "#6C757D", budget: 200, icon: "📝" },
]

// Sample transactions for demo
const sampleTransactions: Transaction[] = [
  {
    id: "1",
    amount: 2500,
    description: "Monthly Salary",
    category: "Salary",
    date: new Date(2025, 3, 1).toISOString(),
    type: "income",
  },
  {
    id: "2",
    amount: 1000,
    description: "Rent Payment",
    category: "Housing",
    date: new Date(2025, 3, 5).toISOString(),
    type: "expense",
  },
  {
    id: "3",
    amount: 85.75,
    description: "Grocery Shopping",
    category: "Food",
    date: new Date(2025, 3, 7).toISOString(),
    type: "expense",
  },
  {
    id: "4",
    amount: 45.5,
    description: "Gas Station",
    category: "Transportation",
    date: new Date(2025, 3, 10).toISOString(),
    type: "expense",
  },
  {
    id: "5",
    amount: 120,
    description: "Electricity Bill",
    category: "Utilities",
    date: new Date(2025, 3, 15).toISOString(),
    type: "expense",
  },
  {
    id: "6",
    amount: 65.99,
    description: "Dinner with Friends",
    category: "Food",
    date: new Date(2025, 3, 18).toISOString(),
    type: "expense",
  },
]

// Chart configuration
const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
  propsForDots: { r: "0" },
  propsForBackgroundLines: {
    strokeWidth: 0.5,
    stroke: "rgba(0,0,0,0.08)",
    strokeDasharray: "",
  },
}

const BudgetScreen = () => {
  // State variables
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions)
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString())
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [showAddTransaction, setShowAddTransaction] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "budget">("overview")
  const [loading, setLoading] = useState<boolean>(true)
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    amount: 0,
    description: "",
    category: "",
    type: "expense",
    date: new Date().toISOString(),
  })
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("monthly")
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    overview: true,
    recent: true,
    categories: true,
    budgets: true,
  })
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [editingCategory, setEditingCategory] = useState<Partial<Category>>({})

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [180, 100],
    extrapolate: "clamp",
  })

  // Load data from storage on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedTransactions = await AsyncStorage.getItem("transactions")
        const storedCategories = await AsyncStorage.getItem("categories")

        if (storedTransactions) {
          setTransactions(JSON.parse(storedTransactions))
        }
        if (storedCategories) {
          setCategories(JSON.parse(storedCategories))
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Save data to storage whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("transactions", JSON.stringify(transactions))
        await AsyncStorage.setItem("categories", JSON.stringify(categories))
      } catch (error) {
        console.error("Error saving data:", error)
      }
    }

    if (!loading) {
      saveData()
    }
  }, [transactions, categories, loading])

  // Calculate budget summary
  const calculateBudgetSummary = (month: Date) => {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)

    const monthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date)
      return transactionDate >= startOfMonth && transactionDate <= endOfMonth
    })

    const totalIncome = monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    const totalBudget = categories.filter((c) => c.budget > 0).reduce((sum, c) => sum + c.budget, 0)

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    return {
      totalIncome,
      totalExpenses,
      savingsRate,
      remainingBudget: totalBudget - totalExpenses,
      totalBudget,
      netSavings: totalIncome - totalExpenses,
    }
  }

  // Get transactions for selected date
  const getTransactionsForDate = (date: string) => {
    const selectedDateObj = new Date(date)
    return transactions.filter((t) => {
      const transactionDate = new Date(t.date)
      return (
        transactionDate.getDate() === selectedDateObj.getDate() &&
        transactionDate.getMonth() === selectedDateObj.getMonth() &&
        transactionDate.getFullYear() === selectedDateObj.getFullYear()
      )
    })
  }

  // Get transactions for selected month
  const getTransactionsForMonth = (month: Date) => {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)

    return transactions.filter((t) => {
      const transactionDate = new Date(t.date)
      return transactionDate >= startOfMonth && transactionDate <= endOfMonth
    })
  }

  // Filter transactions based on search and filter type
  const filteredTransactions = useMemo(() => {
    let filtered = transactions

    // Apply date filter
    if (viewMode === "daily") {
      filtered = getTransactionsForDate(selectedDate)
    } else {
      filtered = getTransactionsForMonth(selectedMonth)
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) => t.description.toLowerCase().includes(query) || t.category.toLowerCase().includes(query),
      )
    }

    // Sort by date (newest first)
    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, selectedDate, selectedMonth, viewMode, filterType, searchQuery])

  // Calculate spending by category for the selected month
  const spendingByCategory = useMemo(() => {
    const monthTransactions = getTransactionsForMonth(selectedMonth).filter((t) => t.type === "expense")

    const categorySpending: { [key: string]: number } = {}
    monthTransactions.forEach((t) => {
      if (categorySpending[t.category]) {
        categorySpending[t.category] += t.amount
      } else {
        categorySpending[t.category] = t.amount
      }
    })

    return Object.entries(categorySpending).map(([category, amount]) => {
      const categoryObj = categories.find((c) => c.name === category)
      return {
        name: category,
        amount,
        color: categoryObj?.color || "#6C757D",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      }
    })
  }, [transactions, selectedMonth, categories])

  // Calculate daily spending for the selected month
  const dailySpending = useMemo(() => {
    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
    const daysInMonth = endOfMonth.getDate()

    const dailyData: number[] = Array(daysInMonth).fill(0)
    const labels: string[] = []

    for (let i = 1; i <= daysInMonth; i++) {
      labels.push(i.toString())
      const dayTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date)
        return (
          transactionDate.getDate() === i &&
          transactionDate.getMonth() === selectedMonth.getMonth() &&
          transactionDate.getFullYear() === selectedMonth.getFullYear() &&
          t.type === "expense"
        )
      })

      dailyData[i - 1] = dayTransactions.reduce((sum, t) => sum + t.amount, 0)
    }

    return {
      labels,
      datasets: [
        {
          data: dailyData,
          color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    }
  }, [transactions, selectedMonth])

  // Calculate income vs expenses for the selected month
  const incomeVsExpenses = useMemo(() => {
    const last6Months = Array(6)
      .fill(0)
      .map((_, i) => {
        const date = new Date(selectedMonth)
        date.setMonth(date.getMonth() - i)
        return date
      })
      .reverse()

    const labels = last6Months.map((date) => date.toLocaleDateString("en-US", { month: "short" }))
    const incomeData: number[] = []
    const expenseData: number[] = []

    last6Months.forEach((month) => {
      const monthTransactions = getTransactionsForMonth(month)
      const income = monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
      const expense = monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

      incomeData.push(income)
      expenseData.push(expense)
    })

    return {
      labels,
      datasets: [
        {
          data: incomeData,
          color: (opacity = 1) => `rgba(82, 183, 136, ${opacity})`,
          strokeWidth: 2,
          withDots: false,
        },
        {
          data: expenseData,
          color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
          strokeWidth: 2,
          withDots: false,
        },
      ],
    }
  }, [transactions, selectedMonth])

  // Calculate budget progress for each category
  const categoryBudgetProgress = useMemo(() => {
    const monthTransactions = getTransactionsForMonth(selectedMonth).filter((t) => t.type === "expense")

    const categorySpending: { [key: string]: number } = {}
    monthTransactions.forEach((t) => {
      if (categorySpending[t.category]) {
        categorySpending[t.category] += t.amount
      } else {
        categorySpending[t.category] = t.amount
      }
    })

    return categories
      .filter((c) => c.budget > 0)
      .map((category) => {
        const spent = categorySpending[category.name] || 0
        const progress = category.budget > 0 ? spent / category.budget : 0
        return {
          ...category,
          spent,
          progress: Math.min(progress, 1), // Cap at 100%
          remaining: Math.max(category.budget - spent, 0),
          overBudget: spent > category.budget,
        }
      })
      .sort((a, b) => b.progress - a.progress) // Sort by progress (highest first)
  }, [transactions, selectedMonth, categories])

  // Handle adding a new transaction
  const handleAddTransaction = () => {
    if (
      !newTransaction.description ||
      !newTransaction.category ||
      !newTransaction.amount ||
      newTransaction.amount <= 0
    ) {
      Alert.alert("Error", "Please fill in all fields with valid values.")
      return
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      amount: Number(newTransaction.amount),
      description: newTransaction.description,
      category: newTransaction.category,
      date: newTransaction.date || new Date().toISOString(),
      type: newTransaction.type || "expense",
    }

    setTransactions([...transactions, transaction])
    setNewTransaction({
      amount: 0,
      description: "",
      category: "",
      type: "expense",
      date: new Date().toISOString(),
    })
    setShowAddTransaction(false)
  }

  // Handle editing a transaction
  const handleEditTransaction = () => {
    if (!selectedTransaction) return

    const updatedTransactions = transactions.map((t) => (t.id === selectedTransaction.id ? selectedTransaction : t))

    setTransactions(updatedTransactions)
    setSelectedTransaction(null)
    setShowTransactionModal(false)
  }

  // Handle deleting a transaction
  const handleDeleteTransaction = (id: string) => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updatedTransactions = transactions.filter((t) => t.id !== id)
          setTransactions(updatedTransactions)
        },
      },
    ])
  }

  // Handle month change
  const handleMonthChange = (direction: "prev" | "next") => {
    const newMonth = new Date(selectedMonth)
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setSelectedMonth(newMonth)
  }

  // Handle adding/editing a category
  const handleSaveCategory = () => {
    if (!editingCategory.name || !editingCategory.color || !editingCategory.icon) {
      Alert.alert("Error", "Please fill in all fields.")
      return
    }

    if (selectedCategory) {
      // Editing existing category
      const updatedCategories = categories.map((c) =>
        c.id === selectedCategory.id ? ({ ...editingCategory, id: selectedCategory.id } as Category) : c,
      )
      setCategories(updatedCategories)
    } else {
      // Adding new category
      const newCategory: Category = {
        id: Date.now().toString(),
        name: editingCategory.name || "",
        color: editingCategory.color || "#006A4D",
        budget: editingCategory.budget || 0,
        icon: editingCategory.icon || "📝",
      }
      setCategories([...categories, newCategory])
    }

    setEditingCategory({})
    setSelectedCategory(null)
    setShowCategoryModal(false)
  }

  // Handle deleting a category
  const handleDeleteCategory = (id: string) => {
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category? All transactions in this category will be moved to 'Other'.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const categoryToDelete = categories.find((c) => c.id === id)
            if (!categoryToDelete) return

            // Move transactions to "Other" category
            const updatedTransactions = transactions.map((t) =>
              t.category === categoryToDelete.name ? { ...t, category: "Other" } : t,
            )

            // Remove the category
            const updatedCategories = categories.filter((c) => c.id !== id)

            setTransactions(updatedTransactions)
            setCategories(updatedCategories)
            setShowCategoryModal(false)
          },
        },
      ],
    )
  }

  // Format date for display
  const formatDate = (dateString: string, format: "short" | "long" = "short") => {
    const date = new Date(dateString)
    if (format === "short") {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    })
  }

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate a refresh delay
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  // Render transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const category = categories.find((c) => c.name === item.category)

    return (
      <Swipeable
        renderRightActions={() => (
          <View style={styles.swipeActions}>
            <TouchableOpacity
              style={[styles.swipeAction, { backgroundColor: "#006A4D" }]}
              onPress={() => {
                setSelectedTransaction(item)
                setShowTransactionModal(true)
              }}
            >
              <Edit2 color="#fff" size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.swipeAction, { backgroundColor: "#FF5252" }]}
              onPress={() => handleDeleteTransaction(item.id)}
            >
              <Trash2 color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        )}
      >
        <TouchableOpacity
          style={styles.transactionItem}
          onPress={() => {
            setSelectedTransaction(item)
            setShowTransactionModal(true)
          }}
        >
          <View style={[styles.categoryIcon, { backgroundColor: category?.color || "#6C757D" }]}>
            <Text style={styles.categoryIconText}>{category?.icon || "📝"}</Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDescription}>{item.description}</Text>
            <Text style={styles.transactionCategory}>{item.category}</Text>
          </View>
          <View style={styles.transactionAmount}>
            <Text style={[styles.amountText, { color: item.type === "income" ? "#4CAF50" : "#FF5252" }]}>
              {item.type === "income" ? "+" : "-"}
              {formatCurrency(item.amount)}
            </Text>
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    )
  }

  // Render category budget item
  const renderCategoryBudgetItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.budgetItem}
        onPress={() => {
          setSelectedCategory(item)
          setEditingCategory(item)
          setShowCategoryModal(true)
        }}
      >
        <View style={styles.budgetItemHeader}>
          <View style={styles.categoryIconContainer}>
            <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
              <Text style={styles.categoryIconText}>{item.icon}</Text>
            </View>
            <View style={styles.categoryNameContainer}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.budgetAmount}>
                {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
              </Text>
            </View>
          </View>
          <Text style={[styles.budgetPercentage, { color: item.overBudget ? "#FF5252" : "#006A4D" }]}>
            {Math.round(item.progress * 100)}%
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(item.progress * 100, 100)}%`,
                backgroundColor: item.overBudget ? "#FF5252" : "#006A4D",
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    )
  }

  // Budget summary for the current month
  const budgetSummary = calculateBudgetSummary(selectedMonth)

  // Render main content
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Budget Tracker</Text>
          <Text style={styles.headerSubtitle}>
            {selectedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={styles.summaryValue}>{formatCurrency(budgetSummary.totalIncome)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={styles.summaryValue}>{formatCurrency(budgetSummary.totalExpenses)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Net</Text>
              <Text style={[styles.summaryValue, { color: budgetSummary.netSavings >= 0 ? "#4CAF50" : "#FF5252" }]}>
                {formatCurrency(budgetSummary.netSavings)}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "overview" && styles.activeTab]}
          onPress={() => setActiveTab("overview")}
        >
          <PieChartIcon size={20} color={activeTab === "overview" ? "#006A4D" : "#6C757D"} />
          <Text style={[styles.tabText, activeTab === "overview" && styles.activeTabText]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "transactions" && styles.activeTab]}
          onPress={() => setActiveTab("transactions")}
        >
          <DollarSign size={20} color={activeTab === "transactions" ? "#006A4D" : "#6C757D"} />
          <Text style={[styles.tabText, activeTab === "transactions" && styles.activeTabText]}>Transactions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "budget" && styles.activeTab]}
          onPress={() => setActiveTab("budget")}
        >
          <TrendingUp size={20} color={activeTab === "budget" ? "#006A4D" : "#6C757D"} />
          <Text style={[styles.tabText, activeTab === "budget" && styles.activeTabText]}>Budget</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006A4D" />
          <Text style={styles.loadingText}>Loading your budget data...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === "transactions" ? filteredTransactions : []}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contentContainer}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
          ListEmptyComponent={
            activeTab === "transactions" && filteredTransactions.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No transactions found</Text>
                <Text style={styles.emptyStateSubtext}>Try adjusting your filters or add a new transaction</Text>
              </View>
            ) : null
          }
          ListHeaderComponent={
            <>
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <View style={styles.tabContent}>
                  {/* Monthly Summary */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Monthly Summary</Text>
                    <View style={styles.monthSelector}>
                      <TouchableOpacity onPress={() => handleMonthChange("prev")}>
                        <ChevronLeft size={24} color="#006A4D" />
                      </TouchableOpacity>
                      <Text style={styles.monthText}>
                        {selectedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </Text>
                      <TouchableOpacity onPress={() => handleMonthChange("next")}>
                        <ChevronRight size={24} color="#006A4D" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.overviewCards}>
                    <View style={styles.overviewCard}>
                      <View style={styles.overviewCardHeader}>
                        <Text style={styles.overviewCardTitle}>Income</Text>
                        <ArrowUpRight size={20} color="#4CAF50" />
                      </View>
                      <Text style={[styles.overviewCardValue, { color: "#4CAF50" }]}>
                        {formatCurrency(budgetSummary.totalIncome)}
                      </Text>
                    </View>

                    <View style={styles.overviewCard}>
                      <View style={styles.overviewCardHeader}>
                        <Text style={styles.overviewCardTitle}>Expenses</Text>
                        <ArrowDownRight size={20} color="#FF5252" />
                      </View>
                      <Text style={[styles.overviewCardValue, { color: "#FF5252" }]}>
                        {formatCurrency(budgetSummary.totalExpenses)}
                      </Text>
                    </View>

                    <View style={styles.overviewCard}>
                      <View style={styles.overviewCardHeader}>
                        <Text style={styles.overviewCardTitle}>Savings</Text>
                        <Wallet size={20} color={budgetSummary.netSavings >= 0 ? "#4CAF50" : "#FF5252"} />
                      </View>
                      <Text
                        style={[
                          styles.overviewCardValue,
                          {
                            color: budgetSummary.netSavings >= 0 ? "#4CAF50" : "#FF5252",
                          },
                        ]}
                      >
                        {formatCurrency(budgetSummary.netSavings)}
                      </Text>
                    </View>
                  </View>

                  {/* Income vs Expenses Chart */}
                  <View style={styles.section}>
                    <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("overview")}>
                      <Text style={styles.sectionTitle}>Income vs Expenses</Text>
                      {expandedSections.overview ? (
                        <ChevronUp size={24} color="#006A4D" />
                      ) : (
                        <ChevronDown size={24} color="#006A4D" />
                      )}
                    </TouchableOpacity>

                    {expandedSections.overview && (
                      <View style={styles.chartContainer}>
                        {incomeVsExpenses.datasets[0].data.some((value) => value > 0) ||
                        incomeVsExpenses.datasets[1].data.some((value) => value > 0) ? (
                          <>
                            <LineChart
                              data={incomeVsExpenses}
                              width={width - 40}
                              height={220}
                              chartConfig={chartConfig}
                              bezier
                              withInnerLines={false}
                            />
                            <View style={styles.chartLegend}>
                              <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: "#52B788" }]} />
                                <Text style={styles.legendText}>Income</Text>
                              </View>
                              <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: "#FF6B6B" }]} />
                                <Text style={styles.legendText}>Expenses</Text>
                              </View>
                            </View>
                          </>
                        ) : (
                          <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>No data for this period</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Spending Trends */}
                  <View style={styles.section}>
                    <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("categories")}>
                      <Text style={styles.sectionTitle}>Spending by Category</Text>
                      {expandedSections.categories ? (
                        <ChevronUp size={24} color="#006A4D" />
                      ) : (
                        <ChevronDown size={24} color="#006A4D" />
                      )}
                    </TouchableOpacity>

                    {expandedSections.categories && (
                      <View style={styles.chartContainer}>
                        {spendingByCategory.length > 0 ? (
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
                        ) : (
                          <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>No spending data for this month</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Recent Transactions */}
                  <View style={styles.section}>
                    <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("recent")}>
                      <Text style={styles.sectionTitle}>Recent Transactions</Text>
                      {expandedSections.recent ? (
                        <ChevronUp size={24} color="#006A4D" />
                      ) : (
                        <ChevronDown size={24} color="#006A4D" />
                      )}
                    </TouchableOpacity>

                    {expandedSections.recent && (
                      <View>
                        {filteredTransactions.slice(0, 5).map((transaction) => (
                          <View key={transaction.id}>{renderTransactionItem({ item: transaction })}</View>
                        ))}
                        {filteredTransactions.length > 5 && (
                          <TouchableOpacity style={styles.viewAllButton} onPress={() => setActiveTab("transactions")}>
                            <Text style={styles.viewAllText}>View All Transactions</Text>
                            <ArrowRight size={16} color="#006A4D" />
                          </TouchableOpacity>
                        )}
                        {filteredTransactions.length === 0 && (
                          <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>No transactions for this month</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Budget Progress */}
                  <View style={styles.section}>
                    <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("budgets")}>
                      <Text style={styles.sectionTitle}>Budget Progress</Text>
                      {expandedSections.budgets ? (
                        <ChevronUp size={24} color="#006A4D" />
                      ) : (
                        <ChevronDown size={24} color="#006A4D" />
                      )}
                    </TouchableOpacity>

                    {expandedSections.budgets && (
                      <View>
                        {categoryBudgetProgress.slice(0, 3).map((category) => (
                          <View key={category.id}>{renderCategoryBudgetItem({ item: category })}</View>
                        ))}
                        {categoryBudgetProgress.length > 3 && (
                          <TouchableOpacity style={styles.viewAllButton} onPress={() => setActiveTab("budget")}>
                            <Text style={styles.viewAllText}>View All Categories</Text>
                            <ArrowRight size={16} color="#006A4D" />
                          </TouchableOpacity>
                        )}
                        {categoryBudgetProgress.length === 0 && (
                          <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>No budget categories set</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Transactions Tab Header */}
              {activeTab === "transactions" && (
                <View style={styles.tabContent}>
                  {/* Filters */}
                  <View style={styles.filtersRow}>
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

                    <TouchableOpacity style={styles.searchButton} onPress={() => setShowSearch(!showSearch)}>
                      <Search size={20} color="#006A4D" />
                    </TouchableOpacity>
                  </View>

                  {/* Search Bar */}
                  {showSearch && (
                    <View style={styles.searchContainer}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                      {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                          <X size={20} color="#6C757D" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )}

                  {/* View Mode Toggle */}
                  <View style={styles.viewModeContainer}>
                    <TouchableOpacity
                      style={[styles.viewModeButton, viewMode === "daily" && styles.activeViewMode]}
                      onPress={() => setViewMode("daily")}
                    >
                      <Calendar size={16} color={viewMode === "daily" ? "#006A4D" : "#6C757D"} />
                      <Text style={[styles.viewModeText, viewMode === "daily" && styles.activeViewModeText]}>
                        Daily
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.viewModeButton, viewMode === "monthly" && styles.activeViewMode]}
                      onPress={() => setViewMode("monthly")}
                    >
                      <BarChart2 size={16} color={viewMode === "monthly" ? "#006A4D" : "#6C757D"} />
                      <Text style={[styles.viewModeText, viewMode === "monthly" && styles.activeViewModeText]}>
                        Monthly
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Budget Tab */}
              {activeTab === "budget" && (
                <View style={styles.tabContent}>
                  {/* Monthly Budget Summary */}
                  <View style={styles.budgetSummaryCard}>
                    <Text style={styles.budgetSummaryTitle}>Monthly Budget</Text>
                    <View style={styles.budgetSummaryRow}>
                      <Text style={styles.budgetSummaryLabel}>Total Budget:</Text>
                      <Text style={styles.budgetSummaryValue}>{formatCurrency(budgetSummary.totalBudget)}</Text>
                    </View>
                    <View style={styles.budgetSummaryRow}>
                      <Text style={styles.budgetSummaryLabel}>Spent:</Text>
                      <Text style={styles.budgetSummaryValue}>{formatCurrency(budgetSummary.totalExpenses)}</Text>
                    </View>
                    <View style={styles.budgetSummaryRow}>
                      <Text style={styles.budgetSummaryLabel}>Remaining:</Text>
                      <Text
                        style={[
                          styles.budgetSummaryValue,
                          {
                            color: budgetSummary.remainingBudget >= 0 ? "#4CAF50" : "#FF5252",
                          },
                        ]}
                      >
                        {formatCurrency(budgetSummary.remainingBudget)}
                      </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${Math.min((budgetSummary.totalExpenses / budgetSummary.totalBudget) * 100, 100)}%`,
                            backgroundColor:
                              budgetSummary.totalExpenses <= budgetSummary.totalBudget ? "#006A4D" : "#FF5252",
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Category Budgets */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Category Budgets</Text>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => {
                        setSelectedCategory(null)
                        setEditingCategory({})
                        setShowCategoryModal(true)
                      }}
                    >
                      <Plus size={20} color="#006A4D" />
                    </TouchableOpacity>
                  </View>

                  {categoryBudgetProgress.length > 0 ? (
                    categoryBudgetProgress.map((category) => (
                      <View key={category.id}>{renderCategoryBudgetItem({ item: category })}</View>
                    ))
                  ) : (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>No budget categories set</Text>
                      <TouchableOpacity
                        style={styles.addCategoryButton}
                        onPress={() => {
                          setSelectedCategory(null)
                          setEditingCategory({})
                          setShowCategoryModal(true)
                        }}
                      >
                        <Text style={styles.addCategoryButtonText}>Add Category</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#006A4D"]} />}
        />
      )}

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            setNewTransaction({
              amount: 0,
              description: "",
              category: "",
              type: "expense",
              date: new Date().toISOString(),
            })
            setShowAddTransaction(true)
          }}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Add Transaction Modal */}
      <Modal visible={showAddTransaction} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Transaction</Text>
                <TouchableOpacity onPress={() => setShowAddTransaction(false)}>
                  <X size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent}>
                {/* Transaction Type */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Transaction Type</Text>
                  <View style={styles.segmentedControl}>
                    <TouchableOpacity
                      style={[styles.segmentedButton, newTransaction.type === "income" && styles.activeSegmentedButton]}
                      onPress={() => setNewTransaction({ ...newTransaction, type: "income" })}
                    >
                      <Text
                        style={[
                          styles.segmentedButtonText,
                          newTransaction.type === "income" && styles.activeSegmentedButtonText,
                        ]}
                      >
                        Income
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.segmentedButton,
                        newTransaction.type === "expense" && styles.activeSegmentedButton,
                      ]}
                      onPress={() => setNewTransaction({ ...newTransaction, type: "expense" })}
                    >
                      <Text
                        style={[
                          styles.segmentedButtonText,
                          newTransaction.type === "expense" && styles.activeSegmentedButtonText,
                        ]}
                      >
                        Expense
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Amount */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Amount</Text>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.amountInput}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      value={newTransaction.amount ? newTransaction.amount.toString() : ""}
                      onChangeText={(text) => {
                        const amount = Number.parseFloat(text) || 0
                        setNewTransaction({ ...newTransaction, amount })
                      }}
                    />
                  </View>
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter description"
                    value={newTransaction.description}
                    onChangeText={(text) => setNewTransaction({ ...newTransaction, description: text })}
                  />
                </View>

                {/* Date */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => {
                      // In a real app, you would show a date picker here
                      // For this example, we'll just use the current date
                      setNewTransaction({ ...newTransaction, date: new Date().toISOString() })
                    }}
                  >
                    <Text style={styles.datePickerText}>
                      {formatDate(newTransaction.date || new Date().toISOString(), "long")}
                    </Text>
                    <Calendar size={20} color="#006A4D" />
                  </TouchableOpacity>
                </View>

                {/* Category */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Category</Text>
                  <View style={styles.categorySelector}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {categories
                        .filter((c) => {
                          // For income, only show income categories
                          if (newTransaction.type === "income") {
                            return ["Salary", "Investments", "Gifts", "Other"].includes(c.name)
                          }
                          // For expenses, don't show income categories
                          return !["Salary", "Investments", "Gifts"].includes(c.name)
                        })
                        .map((category) => (
                          <TouchableOpacity
                            key={category.id}
                            style={[
                              styles.categoryOption,
                              {
                                backgroundColor:
                                  newTransaction.category === category.name ? category.color : "transparent",
                                borderColor: category.color,
                              },
                            ]}
                            onPress={() => setNewTransaction({ ...newTransaction, category: category.name })}
                          >
                            <Text
                              style={[
                                styles.categoryOptionText,
                                {
                                  color: newTransaction.category === category.name ? "#fff" : category.color,
                                },
                              ]}
                            >
                              {category.icon} {category.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity style={styles.submitButton} onPress={handleAddTransaction}>
                  <Text style={styles.submitButtonText}>Add Transaction</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal visible={showTransactionModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Transaction</Text>
                <TouchableOpacity onPress={() => setShowTransactionModal(false)}>
                  <X size={24} color="#333" />
                </TouchableOpacity>
              </View>
              {selectedTransaction && (
                <ScrollView style={styles.modalContent}>
                  {/* Transaction Type */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Transaction Type</Text>
                    <View style={styles.segmentedControl}>
                      <TouchableOpacity
                        style={[
                          styles.segmentedButton,
                          selectedTransaction.type === "income" && styles.activeSegmentedButton,
                        ]}
                        onPress={() => setSelectedTransaction({ ...selectedTransaction, type: "income" })}
                      >
                        <Text
                          style={[
                            styles.segmentedButtonText,
                            selectedTransaction.type === "income" && styles.activeSegmentedButtonText,
                          ]}
                        >
                          Income
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.segmentedButton,
                          selectedTransaction.type === "expense" && styles.activeSegmentedButton,
                        ]}
                        onPress={() => setSelectedTransaction({ ...selectedTransaction, type: "expense" })}
                      >
                        <Text
                          style={[
                            styles.segmentedButtonText,
                            selectedTransaction.type === "expense" && styles.activeSegmentedButtonText,
                          ]}
                        >
                          Expense
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Amount */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Amount</Text>
                    <View style={styles.amountInputContainer}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.amountInput}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        value={selectedTransaction.amount.toString()}
                        onChangeText={(text) => {
                          const amount = Number.parseFloat(text) || 0
                          setSelectedTransaction({ ...selectedTransaction, amount })
                        }}
                      />
                    </View>
                  </View>

                  {/* Description */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Description</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter description"
                      value={selectedTransaction.description}
                      onChangeText={(text) => setSelectedTransaction({ ...selectedTransaction, description: text })}
                    />
                  </View>

                  {/* Date */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Date</Text>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => {
                        // In a real app, you would show a date picker here
                      }}
                    >
                      <Text style={styles.datePickerText}>{formatDate(selectedTransaction.date, "long")}</Text>
                      <Calendar size={20} color="#006A4D" />
                    </TouchableOpacity>
                  </View>

                  {/* Category */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Category</Text>
                    <View style={styles.categorySelector}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {categories
                          .filter((c) => {
                            // For income, only show income categories
                            if (selectedTransaction.type === "income") {
                              return ["Salary", "Investments", "Gifts", "Other"].includes(c.name)
                            }
                            // For expenses, don't show income categories
                            return !["Salary", "Investments", "Gifts"].includes(c.name)
                          })
                          .map((category) => (
                            <TouchableOpacity
                              key={category.id}
                              style={[
                                styles.categoryOption,
                                {
                                  backgroundColor:
                                    selectedTransaction.category === category.name ? category.color : "transparent",
                                  borderColor: category.color,
                                },
                              ]}
                              onPress={() =>
                                setSelectedTransaction({ ...selectedTransaction, category: category.name })
                              }
                            >
                              <Text
                                style={[
                                  styles.categoryOptionText,
                                  {
                                    color: selectedTransaction.category === category.name ? "#fff" : category.color,
                                  },
                                ]}
                              >
                                {category.icon} {category.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </ScrollView>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleEditTransaction}>
                      <Text style={styles.actionButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => {
                        setShowTransactionModal(false)
                        setTimeout(() => {
                          handleDeleteTransaction(selectedTransaction.id)
                        }, 300)
                      }}
                    >
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedCategory ? "Edit Category" : "Add Category"}</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <X size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent}>
                {/* Category Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Category Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter category name"
                    value={editingCategory.name}
                    onChangeText={(text) => setEditingCategory({ ...editingCategory, name: text })}
                  />
                </View>

                {/* Category Icon */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Icon</Text>
                  <View style={styles.iconSelector}>
                    {["🏠", "🍔", "🚗", "🎬", "🛍️", "💡", "🏥", "👤", "💰", "📈", "🎁", "📝"].map((icon) => (
                      <TouchableOpacity
                        key={icon}
                        style={[styles.iconOption, editingCategory.icon === icon && styles.selectedIconOption]}
                        onPress={() => setEditingCategory({ ...editingCategory, icon })}
                      >
                        <Text style={styles.iconText}>{icon}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Category Color */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Color</Text>
                  <View style={styles.colorSelector}>
                    {[
                      "#006A4D",
                      "#FF6B6B",
                      "#4ECDC4",
                      "#FFD166",
                      "#C38D9E",
                      "#E76F51",
                      "#1D3557",
                      "#06D6A0",
                      "#52B788",
                      "#118AB2",
                      "#9C6644",
                      "#6C757D",
                    ].map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          editingCategory.color === color && styles.selectedColorOption,
                        ]}
                        onPress={() => setEditingCategory({ ...editingCategory, color })}
                      />
                    ))}
                  </View>
                </View>

                {/* Budget Amount */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Monthly Budget</Text>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.amountInput}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      value={editingCategory.budget ? editingCategory.budget.toString() : ""}
                      onChangeText={(text) => {
                        const budget = Number.parseFloat(text) || 0
                        setEditingCategory({ ...editingCategory, budget })
                      }}
                    />
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSaveCategory}>
                    <Text style={styles.actionButtonText}>{selectedCategory ? "Save Changes" : "Add Category"}</Text>
                  </TouchableOpacity>
                  {selectedCategory && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteCategory(selectedCategory.id)}
                    >
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  header: {
    backgroundColor: "#006A4D",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  headerContent: {
    flex: 1,
    justifyContent: "flex-end",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#006A4D",
  },
  tabText: {
    fontSize: 12,
    color: "#6C757D",
    marginLeft: 4,
  },
  activeTabText: {
    color: "#006A4D",
    fontWeight: "600",
  },
  contentContainer: {
    paddingBottom: 80, // Space for FAB
  },
  tabContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6C757D",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#006A4D",
    marginHorizontal: 8,
  },
  overviewCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  overviewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  overviewCardTitle: {
    fontSize: 14,
    color: "#6C757D",
  },
  overviewCardValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  chart: {
    borderRadius: 8,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#6C757D",
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
  },
  noDataText: {
    color: "#6C757D",
    fontSize: 16,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  transactionCategory: {
    fontSize: 14,
    color: "#6C757D",
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginTop: 8,
  },
  viewAllText: {
    color: "#006A4D",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  budgetItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  budgetItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryNameContainer: {
    marginLeft: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  budgetAmount: {
    fontSize: 14,
    color: "#6C757D",
  },
  budgetPercentage: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "#E9ECEF",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6C757D",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  datePickerText: {
    fontSize: 16,
    color: "#333",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  saveButton: {
    backgroundColor: "#006A4D",
  },
  deleteButton: {
    backgroundColor: "#FF5252",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  iconSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  iconOption: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CED4DA",
    margin: 4,
  },
  selectedIconOption: {
    borderColor: "#006A4D",
    backgroundColor: "rgba(0, 106, 77, 0.1)",
  },
  iconText: {
    fontSize: 24,
  },
  colorSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: "#CED4DA",
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: "#333",
  },
  addButton: {
    padding: 8,
  },
  addCategoryButton: {
    backgroundColor: "#006A4D",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  addCategoryButtonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  filtersRow: {
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CED4DA",
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: "#006A4D",
    borderColor: "#006A4D",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#6C757D",
  },
  activeFilterText: {
    color: "#fff",
  },
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 10,
  },
  viewModeContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
  viewModeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CED4DA",
    marginRight: 8,
  },
  activeViewMode: {
    backgroundColor: "#E6F2ED",
    borderColor: "#006A4D",
  },
  viewModeText: {
    fontSize: 14,
    color: "#6C757D",
    marginLeft: 4,
  },
  activeViewModeText: {
    color: "#006A4D",
  },
  budgetSummaryCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  budgetSummaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  budgetSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  budgetSummaryLabel: {
    fontSize: 14,
    color: "#6C757D",
  },
  budgetSummaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  fabContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  fab: {
    backgroundColor: "#006A4D",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  modalContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CED4DA",
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  activeSegmentedButton: {
    backgroundColor: "#006A4D",
  },
  segmentedButtonText: {
    fontSize: 16,
    color: "#6C757D",
  },
  activeSegmentedButtonText: {
    color: "#fff",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: "#333",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 12,
  },
  categorySelector: {
    marginBottom: 8,
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryOptionText: {
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#006A4D",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  swipeActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "transparent",
    marginVertical: 4,
    marginRight: 8,
  },
  swipeAction: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
})

export default BudgetScreen
