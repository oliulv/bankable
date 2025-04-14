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
} from "react-native"
import { LineChart, PieChart } from "react-native-chart-kit"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Swipeable } from "react-native-gesture-handler"
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  DollarSign,
  Edit2,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  X,
} from "@expo/vector-icons/Feather"

const { width } = Dimensions.get("window")
const screenWidth = Dimensions.get("window").width

// Types
interface Transaction {
  id: string
  amount: number
  description: string
  category: string
  date: string // ISO string
  type: "income" | "expense"
  isRecurring?: boolean
  recurringFrequency?: "daily" | "weekly" | "monthly" | "yearly"
}

interface Budget {
  id: string
  category: string
  amount: number
  spent: number
  period: "weekly" | "monthly" | "yearly"
  color: string
}

interface FinancialGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: Date
  category: string
  color: string
}

interface BudgetSummary {
  totalBudget: number
  totalSpent: number
  remainingBudget: number
  savingsRate: number
  monthlyIncome: number
  monthlyExpenses: number
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
  { id: "1", name: "Housing", color: "#4A6FA5", budget: 1200, icon: "🏠" },
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
  color: (opacity = 1) => `rgba(74, 111, 165, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
}

// Custom PieChart icon component
const PieChartIcon = ({ size, color }: { size: number; color: string }) => {
  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <View
        style={{
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: size * 0.4,
          borderWidth: 2,
          borderColor: color,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: size * 0.4,
            height: size * 0.4,
            backgroundColor: color,
            transform: [{ translateX: -size * 0.1 }],
            borderTopRightRadius: size * 0.4,
            borderBottomRightRadius: size * 0.4,
          }}
        />
      </View>
    </View>
  )
}

// Initial data
const initialCategories = [
  { id: "1", name: "Housing", color: "#006A4D", icon: "home", budget: 0 },
  { id: "2", name: "Food", color: "#3498DB", icon: "food", budget: 0 },
  { id: "3", name: "Transportation", color: "#9B59B6", icon: "car", budget: 0 },
  { id: "4", name: "Entertainment", color: "#F1C40F", icon: "movie", budget: 0 },
  { id: "5", name: "Shopping", color: "#E74C3C", icon: "shopping", budget: 0 },
  { id: "6", name: "Utilities", color: "#16A085", icon: "flash", budget: 0 },
  { id: "7", name: "Healthcare", color: "#FF5733", icon: "medical", budget: 0 },
  { id: "8", name: "Education", color: "#8E44AD", icon: "school", budget: 0 },
  { id: "9", name: "Savings", color: "#2ECC71", icon: "piggy-bank", budget: 0 },
  { id: "10", name: "Other", color: "#7F8C8D", icon: "dots-horizontal", budget: 0 },
]

const initialBudgets: Budget[] = [
  { id: "1", category: "Housing", amount: 1200, spent: 1200, period: "monthly", color: "#006A4D" },
  { id: "2", category: "Food", amount: 500, spent: 420, period: "monthly", color: "#3498DB" },
  { id: "3", category: "Transportation", amount: 300, spent: 275, period: "monthly", color: "#9B59B6" },
  { id: "4", category: "Entertainment", amount: 200, spent: 180, period: "monthly", color: "#F1C40F" },
  { id: "5", category: "Shopping", amount: 300, spent: 350, period: "monthly", color: "#E74C3C" },
  { id: "6", category: "Utilities", amount: 250, spent: 230, period: "monthly", color: "#16A085" },
  { id: "7", category: "Healthcare", amount: 150, spent: 80, period: "monthly", color: "#FF5733" },
  { id: "8", category: "Education", amount: 100, spent: 100, period: "monthly", color: "#8E44AD" },
  { id: "9", category: "Savings", amount: 500, spent: 500, period: "monthly", color: "#2ECC71" },
  { id: "10", category: "Other", amount: 100, spent: 65, period: "monthly", color: "#7F8C8D" },
]

const initialGoals: FinancialGoal[] = [
  {
    id: "1",
    name: "Emergency Fund",
    targetAmount: 10000,
    currentAmount: 6500,
    deadline: new Date(2025, 11, 31),
    category: "Savings",
    color: "#2ECC71",
  },
  {
    id: "2",
    name: "New Car",
    targetAmount: 25000,
    currentAmount: 8750,
    deadline: new Date(2026, 5, 30),
    category: "Transportation",
    color: "#9B59B6",
  },
  {
    id: "3",
    name: "Home Down Payment",
    targetAmount: 50000,
    currentAmount: 12500,
    deadline: new Date(2027, 0, 1),
    category: "Housing",
    color: "#006A4D",
  },
  {
    id: "4",
    name: "Vacation Fund",
    targetAmount: 3000,
    currentAmount: 1200,
    deadline: new Date(2025, 6, 15),
    category: "Entertainment",
    color: "#F1C40F",
  },
]

// Generate realistic transactions for the past 30 days
const generateTransactions = (): Transaction[] => {
  const transactions: Transaction[] = []
  const now = new Date()
  const startDate = new Date()
  startDate.setDate(now.getDate() - 30)

  // Add income transactions
  transactions.push({
    id: "1",
    amount: 3500,
    category: "Salary",
    description: "Monthly salary",
    date: new Date(2025, 3, 28).toISOString(), // April 28, 2025
    type: "income",
  })

  transactions.push({
    id: "2",
    amount: 500,
    category: "Dividends",
    description: "Investment dividends",
    date: new Date(2025, 3, 15).toISOString(), // April 15, 2025
    type: "income",
  })

  // Add expense transactions
  const categories = [
    "Housing",
    "Food",
    "Transportation",
    "Entertainment",
    "Shopping",
    "Utilities",
    "Healthcare",
    "Education",
    "Other",
  ]
  const descriptions = {
    Housing: ["Rent", "Mortgage payment", "Property tax", "Home insurance", "Maintenance"],
    Food: ["Grocery shopping", "Restaurant", "Coffee shop", "Food delivery", "Lunch at work"],
    Transportation: ["Gas", "Car payment", "Public transport", "Uber ride", "Car insurance"],
    Entertainment: ["Movie tickets", "Concert", "Streaming subscription", "Books", "Video games"],
    Shopping: ["Clothing", "Electronics", "Home goods", "Gifts", "Online shopping"],
    Utilities: ["Electricity bill", "Water bill", "Internet", "Phone bill", "Gas bill"],
    Healthcare: ["Doctor visit", "Prescription", "Gym membership", "Health insurance", "Dental care"],
    Education: ["Tuition", "Books", "Online course", "School supplies", "Student loan payment"],
    Other: ["Miscellaneous", "Donation", "Subscription", "Pet expenses", "Banking fees"],
  }

  // Generate random transactions
  for (let i = 0; i < 50; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)]
    const descList = descriptions[category as keyof typeof descriptions]
    const description = descList[Math.floor(Math.random() * descList.length)]

    const date = new Date(startDate)
    date.setDate(startDate.getDate() + Math.floor(Math.random() * 30))

    let amount
    switch (category) {
      case "Housing":
        amount = Math.floor(Math.random() * 500) + 800
        break
      case "Food":
        amount = Math.floor(Math.random() * 80) + 20
        break
      case "Transportation":
        amount = Math.floor(Math.random() * 100) + 10
        break
      case "Entertainment":
        amount = Math.floor(Math.random() * 100) + 10
        break
      case "Shopping":
        amount = Math.floor(Math.random() * 200) + 20
        break
      case "Utilities":
        amount = Math.floor(Math.random() * 100) + 50
        break
      case "Healthcare":
        amount = Math.floor(Math.random() * 200) + 20
        break
      case "Education":
        amount = Math.floor(Math.random() * 100) + 10
        break
      default:
        amount = Math.floor(Math.random() * 100) + 10
    }

    transactions.push({
      id: `exp-${i + 3}`,
      amount: amount,
      category: category,
      description: description,
      date: date.toISOString(),
      type: "expense",
    })
  }

  // Sort by date (newest first)
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

const initialTransactions = generateTransactions()

const BudgetScreen = () => {
  // State variables
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions)
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString())
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [showAddTransaction, setShowAddTransaction] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "budget">("overview")
  const [loading, setLoading] = useState<boolean>(false)
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

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 100],
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
          color: (opacity = 1) => `rgba(74, 111, 165, ${opacity})`,
          strokeWidth: 2,
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

  // Render transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const category = categories.find((c) => c.name === item.category)

    return (
      <Swipeable
        renderRightActions={() => (
          <View style={styles.swipeActions}>
            <TouchableOpacity
              style={[styles.swipeAction, { backgroundColor: "#4A6FA5" }]}
              onPress={() => {
                // Edit transaction functionality would go here
                Alert.alert("Edit", "Edit transaction functionality would go here")
              }}
            >
              <Edit2 size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.swipeAction, { backgroundColor: "#FF5252" }]}
              onPress={() => {
                // Delete transaction functionality would go here
                Alert.alert("Delete", "Delete transaction functionality would go here")
              }}
            >
              <Trash2 size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      >
        <TouchableOpacity
          style={styles.transactionItem}
          onPress={() => {
            // View transaction details functionality would go here
            Alert.alert("Details", "Transaction details would show here")
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
          // View category details functionality would go here
          Alert.alert("Category Details", `Details for ${item.name} would show here`)
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
          <Text style={[styles.budgetPercentage, { color: item.overBudget ? "#FF5252" : "#4A6FA5" }]}>
            {Math.round(item.progress * 100)}%
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(item.progress * 100, 100)}%`,
                backgroundColor: item.overBudget ? "#FF5252" : "#4A6FA5",
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    )
  }

  // Budget summary for the current month
  const budgetSummary = calculateBudgetSummary(selectedMonth)

  // Main render
  return (
    <View style={styles.container}>
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
              <Text style={styles.summaryLabel}>Savings</Text>
              <Text style={styles.summaryValue}>{budgetSummary.savingsRate.toFixed(0)}%</Text>
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
          <PieChartIcon size={20} color={activeTab === "overview" ? "#4A6FA5" : "#6C757D"} />
          <Text style={[styles.tabText, activeTab === "overview" && styles.activeTabText]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "transactions" && styles.activeTab]}
          onPress={() => setActiveTab("transactions")}
        >
          <DollarSign size={20} color={activeTab === "transactions" ? "#4A6FA5" : "#6C757D"} />
          <Text style={[styles.tabText, activeTab === "transactions" && styles.activeTabText]}>Transactions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "budget" && styles.activeTab]}
          onPress={() => setActiveTab("budget")}
        >
          <TrendingUp size={20} color={activeTab === "budget" ? "#4A6FA5" : "#6C757D"} />
          <Text style={[styles.tabText, activeTab === "budget" && styles.activeTabText]}>Budget</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A6FA5" />
          <Text style={styles.loadingText}>Loading your budget data...</Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={styles.content}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        >
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <View style={styles.tabContent}>
              {/* Monthly Summary */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Monthly Summary</Text>
                <View style={styles.monthSelector}>
                  <TouchableOpacity onPress={() => handleMonthChange("prev")}>
                    <ChevronLeft size={24} color="#4A6FA5" />
                  </TouchableOpacity>
                  <Text style={styles.monthText}>
                    {selectedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </Text>
                  <TouchableOpacity onPress={() => handleMonthChange("next")}>
                    <ChevronRight size={24} color="#4A6FA5" />
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
                    <Text style={styles.overviewCardTitle}>Balance</Text>
                  </View>
                  <Text
                    style={[
                      styles.overviewCardValue,
                      {
                        color: budgetSummary.totalIncome - budgetSummary.totalExpenses >= 0 ? "#4CAF50" : "#FF5252",
                      },
                    ]}
                  >
                    {formatCurrency(budgetSummary.totalIncome - budgetSummary.totalExpenses)}
                  </Text>
                </View>
              </View>

              {/* Spending Trends */}
              <View style={styles.section}>
                <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("overview")}>
                  <Text style={styles.sectionTitle}>Spending Trends</Text>
                  {expandedSections.overview ? (
                    <ChevronUp size={24} color="#4A6FA5" />
                  ) : (
                    <ChevronDown size={24} color="#4A6FA5" />
                  )}
                </TouchableOpacity>

                {expandedSections.overview && (
                  <View style={styles.chartContainer}>
                    {dailySpending.datasets[0].data.some((value) => value > 0) ? (
                      <LineChart
                        data={dailySpending}
                        width={width - 40}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                      />
                    ) : (
                      <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>No spending data for this month</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Category Breakdown */}
              <View style={styles.section}>
                <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("categories")}>
                  <Text style={styles.sectionTitle}>Category Breakdown</Text>
                  {expandedSections.categories ? (
                    <ChevronUp size={24} color="#4A6FA5" />
                  ) : (
                    <ChevronDown size={24} color="#4A6FA5" />
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
                    <ChevronUp size={24} color="#4A6FA5" />
                  ) : (
                    <ChevronDown size={24} color="#4A6FA5" />
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
                        <ArrowRight size={16} color="#4A6FA5" />
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
                    <ChevronUp size={24} color="#4A6FA5" />
                  ) : (
                    <ChevronDown size={24} color="#4A6FA5" />
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
                        <ArrowRight size={16} color="#4A6FA5" />
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

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <View style={styles.tabContent}>
              {/* Filters */}
              <View style={styles.filtersRow}>
                <View style={styles.filterButtons}>
                  <TouchableOpacity
                    style={[styles.filterButton, filterType === "all" && styles.activeFilterButton]}
                    onPress={() => setFilterType("all")}
                  >
                    <Text style={[styles.filterButtonText, filterType === "all" && styles.activeFilterText]}>All</Text>
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
                  <Search size={20} color="#4A6FA5" />
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
                  <Text style={[styles.viewModeText, viewMode === "daily" && styles.activeViewModeText]}>Daily</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewModeButton, viewMode === "monthly" && styles.activeViewMode]}
                  onPress={() => setViewMode("monthly")}
                >
                  <Text style={[styles.viewModeText, viewMode === "monthly" && styles.activeViewModeText]}>
                    Monthly
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Transactions List */}
              <View style={styles.transactionsList}>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <View key={transaction.id}>{renderTransactionItem({ item: transaction })}</View>
                  ))
                ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No transactions found</Text>
                  </View>
                )}
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
                          budgetSummary.totalExpenses <= budgetSummary.totalBudget ? "#4A6FA5" : "#FF5252",
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Category Budgets */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Category Budgets</Text>
              </View>

              {categoryBudgetProgress.length > 0 ? (
                categoryBudgetProgress.map((category) => (
                  <View key={category.id}>{renderCategoryBudgetItem({ item: category })}</View>
                ))
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No budget categories set</Text>
                </View>
              )}
            </View>
          )}

          {/* Add some bottom padding for FAB */}
          <View style={{ height: 80 }} />
        </Animated.ScrollView>
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  header: {
    backgroundColor: "#4A6FA5",
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
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#4A6FA5",
  },
  tabText: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 4,
  },
  activeTabText: {
    color: "#4A6FA5",
    fontWeight: "600",
  },
  content: {
    flex: 1,
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
    color: "#4A6FA5",
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
    color: "#4A6FA5",
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
  fabContainer: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4A6FA5",
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
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  modalTitle: {
    fontSize: 18,
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
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    color: "#6C757D",
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  segmentedControl: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#4A6FA5",
    borderRadius: 8,
    overflow: "hidden",
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeSegmentedButton: {
    backgroundColor: "#4A6FA5",
  },
  segmentedButtonText: {
    color: "#4A6FA5",
    fontWeight: "500",
  },
  activeSegmentedButtonText: {
    color: "#fff",
  },
  categorySelector: {
    marginBottom: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryOptionText: {
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#4A6FA5",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#E9ECEF",
  },
  activeFilterButton: {
    backgroundColor: "#4A6FA5",
  },
  filterButtonText: {
    color: "#6C757D",
    fontWeight: "500",
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
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#CED4DA",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  viewModeContainer: {
    flexDirection: "row",
    backgroundColor: "#E9ECEF",
    borderRadius: 8,
    marginBottom: 16,
    padding: 2,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeViewMode: {
    backgroundColor: "#fff",
  },
  viewModeText: {
    color: "#6C757D",
    fontWeight: "500",
  },
  activeViewModeText: {
    color: "#4A6FA5",
  },
  transactionsList: {
    marginBottom: 16,
  },
  swipeActions: {
    flexDirection: "row",
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: "100%",
  },
  budgetSummaryCard: {
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
  budgetSummaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  budgetSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  budgetSummaryLabel: {
    fontSize: 16,
    color: "#6C757D",
  },
  budgetSummaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
})

export default BudgetScreen
