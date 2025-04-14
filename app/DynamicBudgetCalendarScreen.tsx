"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Dimensions,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { useColorScheme } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LineChart, PieChart } from "react-native-chart-kit"

// Define TypeScript interfaces
interface Category {
  id: string
  name: string
  color: string
  budgeted: number
  spent: number
  icon: string
}

interface Transaction {
  id: string
  date: string
  amount: number
  category: string
  description: string
  isRecurring: boolean
  recurringType?: "daily" | "weekly" | "monthly" | "yearly"
  recurringEndDate?: string
}

interface BudgetPeriod {
  id: string
  startDate: string
  endDate: string
  name: string
  categories: { [categoryId: string]: number } // budgeted amounts
}

interface AppState {
  categories: Category[]
  transactions: Transaction[]
  budgetPeriods: BudgetPeriod[]
  activeBudgetPeriodId: string
}

// Month names array
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

// Day names array
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// Screen dimensions
const screenWidth = Dimensions.get("window").width

// Define color palette
const colors = {
  light: {
    background: "#F5F7FA",
    card: "#FFFFFF",
    text: "#1A202C",
    secondaryText: "#718096",
    border: "#E2E8F0",
    primary: "#006A4D", // Main green from investment screen
    secondary: "#3B82F6",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    accent: "#F0FDF4",
    muted: "#F1F5F9",
    highlight: "#E6FFFA",
  },
  dark: {
    background: "#1A202C",
    card: "#2D3748",
    text: "#F7FAFC",
    secondaryText: "#A0AEC0",
    border: "#4A5568",
    primary: "#00A36C", // Brighter green for dark mode
    secondary: "#3B82F6",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    accent: "#1C2A33",
    muted: "#2D3748",
    highlight: "#1F3A3A",
  },
}

// Category icons
const categoryIcons: { [key: string]: string } = {
  Housing: "🏠",
  Food: "🍔",
  Transportation: "🚗",
  Entertainment: "🎬",
  Utilities: "💡",
  Shopping: "🛍️",
  Health: "🏥",
  Education: "📚",
  Travel: "✈️",
  Savings: "💰",
  Investments: "📈",
  Personal: "👤",
  Other: "📦",
}

// Sample initial data
const initialCategories: Category[] = [
  { id: "1", name: "Housing", color: "#4F46E5", budgeted: 1500, spent: 1200, icon: "🏠" },
  { id: "2", name: "Food", color: "#10B981", budgeted: 600, spent: 450, icon: "🍔" },
  { id: "3", name: "Transportation", color: "#F59E0B", budgeted: 300, spent: 240, icon: "🚗" },
  { id: "4", name: "Entertainment", color: "#EC4899", budgeted: 200, spent: 180, icon: "🎬" },
  { id: "5", name: "Utilities", color: "#6366F1", budgeted: 250, spent: 230, icon: "💡" },
  { id: "6", name: "Shopping", color: "#8B5CF6", budgeted: 300, spent: 275, icon: "🛍️" },
  { id: "7", name: "Health", color: "#14B8A6", budgeted: 150, spent: 80, icon: "🏥" },
]

// Sample monthly transactions
const generateSampleTransactions = (): Transaction[] => {
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  return [
    {
      id: "1",
      date: `${year}-${String(month + 1).padStart(2, "0")}-02`,
      amount: 800,
      category: "Housing",
      description: "Rent payment",
      isRecurring: true,
      recurringType: "monthly",
    },
    {
      id: "2",
      date: `${year}-${String(month + 1).padStart(2, "0")}-05`,
      amount: 120,
      category: "Food",
      description: "Grocery shopping",
      isRecurring: false,
    },
    {
      id: "3",
      date: `${year}-${String(month + 1).padStart(2, "0")}-07`,
      amount: 50,
      category: "Transportation",
      description: "Gas",
      isRecurring: false,
    },
    {
      id: "4",
      date: `${year}-${String(month + 1).padStart(2, "0")}-10`,
      amount: 45,
      category: "Entertainment",
      description: "Movie tickets",
      isRecurring: false,
    },
    {
      id: "5",
      date: `${year}-${String(month + 1).padStart(2, "0")}-12`,
      amount: 95,
      category: "Food",
      description: "Restaurant",
      isRecurring: false,
    },
    {
      id: "6",
      date: `${year}-${String(month + 1).padStart(2, "0")}-15`,
      amount: 150,
      category: "Utilities",
      description: "Electricity bill",
      isRecurring: true,
      recurringType: "monthly",
    },
    {
      id: "7",
      date: `${year}-${String(month + 1).padStart(2, "0")}-18`,
      amount: 400,
      category: "Housing",
      description: "HOA fee",
      isRecurring: true,
      recurringType: "monthly",
    },
    {
      id: "8",
      date: `${year}-${String(month + 1).padStart(2, "0")}-20`,
      amount: 60,
      category: "Transportation",
      description: "Rideshare",
      isRecurring: false,
    },
    {
      id: "9",
      date: `${year}-${String(month + 1).padStart(2, "0")}-22`,
      amount: 80,
      category: "Utilities",
      description: "Internet",
      isRecurring: true,
      recurringType: "monthly",
    },
    {
      id: "10",
      date: `${year}-${String(month + 1).padStart(2, "0")}-25`,
      amount: 135,
      category: "Food",
      description: "Grocery shopping",
      isRecurring: false,
    },
    {
      id: "11",
      date: `${year}-${String(month + 1).padStart(2, "0")}-28`,
      amount: 75,
      category: "Shopping",
      description: "Clothes",
      isRecurring: false,
    },
    {
      id: "12",
      date: `${year}-${String(month + 1).padStart(2, "0")}-30`,
      amount: 40,
      category: "Health",
      description: "Pharmacy",
      isRecurring: false,
    },
  ]
}

// Generate initial budget period
const generateInitialBudgetPeriod = (): BudgetPeriod => {
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // First day of current month
  const startDate = new Date(year, month, 1)
  // Last day of current month
  const endDate = new Date(year, month + 1, 0)

  const categoryBudgets: { [categoryId: string]: number } = {}
  initialCategories.forEach((category) => {
    categoryBudgets[category.id] = category.budgeted
  })

  return {
    id: "1",
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    name: `${monthNames[month]} ${year}`,
    categories: categoryBudgets,
  }
}

// Chart configuration
const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
  style: {
    borderRadius: 16,
  },
}

const BudgetCalendar: React.FC = () => {
  const colorScheme = useColorScheme()
  const theme = colorScheme === "dark" ? colors.dark : colors.light

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  // States
  const [appState, setAppState] = useState<AppState>({
    categories: initialCategories,
    transactions: generateSampleTransactions(),
    budgetPeriods: [generateInitialBudgetPeriod()],
    activeBudgetPeriodId: "1",
  })

  const [activeView, setActiveView] = useState<"calendar" | "categories" | "analytics">("calendar")

  const currentDate = new Date()
  const [currentMonth, setCurrentMonth] = useState<number>(currentDate.getMonth())
  const [currentYear, setCurrentYear] = useState<number>(currentDate.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [showAddCategory, setShowAddCategory] = useState<boolean>(false)
  const [showAddTransaction, setShowAddTransaction] = useState<boolean>(false)
  const [showEditTransaction, setShowEditTransaction] = useState<boolean>(false)
  const [showRecurringOptions, setShowRecurringOptions] = useState<boolean>(false)

  const [newCategory, setNewCategory] = useState<{
    name: string
    budgeted: string
    color: string
    icon: string
  }>({
    name: "",
    budgeted: "0",
    color: "#006A4D",
    icon: "📦",
  })

  const [newTransaction, setNewTransaction] = useState<{
    id?: string
    date: string
    amount: string
    category: string
    description: string
    isRecurring: boolean
    recurringType?: "daily" | "weekly" | "monthly" | "yearly"
    recurringEndDate?: string
  }>({
    date: "",
    amount: "",
    category: "",
    description: "",
    isRecurring: false,
  })

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Calculate total budgeted and spent
  const totalBudgeted = appState.categories.reduce((sum, cat) => sum + cat.budgeted, 0)
  const totalSpent = appState.categories.reduce((sum, cat) => sum + cat.spent, 0)
  const remaining = totalBudgeted - totalSpent

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedData = await AsyncStorage.getItem("budgetCalendarData")
        if (storedData) {
          setAppState(JSON.parse(storedData))
        }

        // Start animations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start()

        setIsLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [fadeAnim, slideAnim])

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("budgetCalendarData", JSON.stringify(appState))
      } catch (error) {
        console.error("Error saving data:", error)
      }
    }

    if (!isLoading) {
      saveData()
    }
  }, [appState, isLoading])

  // Format date as YYYY-MM-DD
  const formatDate = (year: number, month: number, day: number): string => {
    const paddedMonth = String(month + 1).padStart(2, "0")
    const paddedDay = String(day).padStart(2, "0")
    return `${year}-${paddedMonth}-${paddedDay}`
  }

  // Parse date string to Date object
  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Date(year, month - 1, day)
  }

  // Get days in month
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get the first day of the month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay()
  }

  // Navigation functions
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
    setSelectedDate(null)
  }

  // Get transactions for specific date
  const getTransactionsForDate = (date: string): Transaction[] => {
    return appState.transactions.filter((t) => t.date === date)
  }

  // Add a new category
  const handleAddCategory = () => {
    if (newCategory.name && Number.parseFloat(newCategory.budgeted) > 0) {
      const newId = Date.now().toString()
      const newCategoryObj: Category = {
        id: newId,
        name: newCategory.name,
        color: newCategory.color,
        budgeted: Number.parseFloat(newCategory.budgeted),
        spent: 0,
        icon: newCategory.icon,
      }

      // Update categories
      const updatedCategories = [...appState.categories, newCategoryObj]

      // Update budget periods to include the new category
      const updatedBudgetPeriods = appState.budgetPeriods.map((period) => {
        const updatedPeriod = { ...period }
        updatedPeriod.categories[newId] = Number.parseFloat(newCategory.budgeted)
        return updatedPeriod
      })

      setAppState((prev) => ({
        ...prev,
        categories: updatedCategories,
        budgetPeriods: updatedBudgetPeriods,
      }))

      setNewCategory({ name: "", budgeted: "0", color: "#006A4D", icon: "📦" })
      setShowAddCategory(false)
    }
  }

  // Add a new transaction
  const handleAddTransaction = () => {
    if (newTransaction.date && newTransaction.amount && newTransaction.category) {
      const newId = Date.now().toString()
      const amount = Number.parseFloat(newTransaction.amount)

      const newTx: Transaction = {
        id: newId,
        date: newTransaction.date,
        amount: amount,
        category: newTransaction.category,
        description: newTransaction.description || "No description",
        isRecurring: newTransaction.isRecurring,
        ...(newTransaction.isRecurring && {
          recurringType: newTransaction.recurringType,
          recurringEndDate: newTransaction.recurringEndDate,
        }),
      }

      // Update transactions
      const updatedTransactions = [...appState.transactions, newTx]

      // Update category spending
      const updatedCategories = appState.categories.map((cat) => {
        if (cat.name === newTransaction.category) {
          return { ...cat, spent: cat.spent + amount }
        }
        return cat
      })

      setAppState((prev) => ({
        ...prev,
        transactions: updatedTransactions,
        categories: updatedCategories,
      }))

      resetTransactionForm()
      setShowAddTransaction(false)
    }
  }

  // Edit a transaction
  const handleEditTransaction = () => {
    if (!editingTransaction || !newTransaction.date || !newTransaction.amount || !newTransaction.category) {
      return
    }

    const amount = Number.parseFloat(newTransaction.amount)
    const oldAmount = editingTransaction.amount
    const oldCategory = editingTransaction.category

    // Update the transaction
    const updatedTransactions = appState.transactions.map((tx) => {
      if (tx.id === editingTransaction.id) {
        return {
          ...tx,
          date: newTransaction.date,
          amount: amount,
          category: newTransaction.category,
          description: newTransaction.description || "No description",
          isRecurring: newTransaction.isRecurring,
          ...(newTransaction.isRecurring && {
            recurringType: newTransaction.recurringType,
            recurringEndDate: newTransaction.recurringEndDate,
          }),
        }
      }
      return tx
    })

    // Update category spending
    const updatedCategories = appState.categories.map((cat) => {
      if (cat.name === oldCategory && cat.name === newTransaction.category) {
        // Same category, just update the amount difference
        return { ...cat, spent: cat.spent - oldAmount + amount }
      } else if (cat.name === oldCategory) {
        // Remove from old category
        return { ...cat, spent: cat.spent - oldAmount }
      } else if (cat.name === newTransaction.category) {
        // Add to new category
        return { ...cat, spent: cat.spent + amount }
      }
      return cat
    })

    setAppState((prev) => ({
      ...prev,
      transactions: updatedTransactions,
      categories: updatedCategories,
    }))

    resetTransactionForm()
    setShowEditTransaction(false)
    setEditingTransaction(null)
  }

  // Delete a transaction
  const deleteTransaction = (id: string) => {
    const tx = appState.transactions.find((t) => t.id === id)

    if (tx) {
      // First update the category's spent amount
      const updatedCategories = appState.categories.map((cat) => {
        if (cat.name === tx.category) {
          return { ...cat, spent: Math.max(0, cat.spent - tx.amount) }
        }
        return cat
      })

      // Then remove the transaction
      const updatedTransactions = appState.transactions.filter((t) => t.id !== id)

      setAppState((prev) => ({
        ...prev,
        transactions: updatedTransactions,
        categories: updatedCategories,
      }))
    }
  }

  // Reset transaction form
  const resetTransactionForm = () => {
    setNewTransaction({
      date: "",
      amount: "",
      category: "",
      description: "",
      isRecurring: false,
    })
  }

  // Open edit transaction modal
  const openEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setNewTransaction({
      id: transaction.id,
      date: transaction.date,
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description,
      isRecurring: transaction.isRecurring,
      recurringType: transaction.recurringType,
      recurringEndDate: transaction.recurringEndDate,
    })
    setShowEditTransaction(true)
  }

  // Create calendar days data
  interface CalendarDay {
    day: number
    dateStr: string
    isEmpty: boolean
    isToday?: boolean
    transactions?: Transaction[]
    totalSpent?: number
  }

  const generateCalendarDays = (): CalendarDay[] => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const days: CalendarDay[] = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, dateStr: "", isEmpty: true, transactions: [] })
    }

    // Add actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(currentYear, currentMonth, day)
      const transactionsForDay = getTransactionsForDate(dateStr)
      const totalSpent = transactionsForDay.reduce((sum, tx) => sum + tx.amount, 0)

      days.push({
        day,
        dateStr,
        isEmpty: false,
        isToday:
          day === currentDate.getDate() &&
          currentMonth === currentDate.getMonth() &&
          currentYear === currentDate.getFullYear(),
        transactions: transactionsForDay,
        totalSpent,
      })
    }

    return days
  }

  // Get spending data for chart
  const getSpendingChartData = () => {
    // Group transactions by day for the current month
    const dailySpending: { [day: number]: number } = {}

    appState.transactions.forEach((tx) => {
      const txDate = parseDate(tx.date)
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        const day = txDate.getDate()
        dailySpending[day] = (dailySpending[day] || 0) + tx.amount
      }
    })

    // Create chart data
    const labels: string[] = []
    const data: number[] = []

    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    for (let i = 1; i <= daysInMonth; i++) {
      if (i % 5 === 1 || i === daysInMonth) {
        // Show every 5th day and the last day
        labels.push(i.toString())
      } else {
        labels.push("")
      }
      data.push(dailySpending[i] || 0)
    }

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    }
  }

  // Get category spending data for pie chart
  const getCategorySpendingData = () => {
    const categorySpending: { [category: string]: number } = {}

    // Calculate total spending by category for the current month
    appState.transactions.forEach((tx) => {
      const txDate = parseDate(tx.date)
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        categorySpending[tx.category] = (categorySpending[tx.category] || 0) + tx.amount
      }
    })

    // Create pie chart data
    const data = Object.entries(categorySpending)
      .filter(([_, amount]) => amount > 0)
      .map(([category, amount]) => {
        const categoryObj = appState.categories.find((c) => c.name === category)
        return {
          name: category,
          value: amount,
          color: categoryObj?.color || "#CCCCCC",
          legendFontColor: theme.text,
          legendFontSize: 12,
        }
      })

    return data
  }

  // Refresh data
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)

    // Simulate a refresh
    setTimeout(() => {
      // Update category spending based on transactions
      const categorySpending: { [category: string]: number } = {}

      appState.transactions.forEach((tx) => {
        categorySpending[tx.category] = (categorySpending[tx.category] || 0) + tx.amount
      })

      const updatedCategories = appState.categories.map((cat) => ({
        ...cat,
        spent: categorySpending[cat.name] || 0,
      }))

      setAppState((prev) => ({
        ...prev,
        categories: updatedCategories,
      }))

      setIsRefreshing(false)
    }, 1000)
  }, [appState.transactions, appState.categories])

  // Render Calendar View
  const renderCalendarView = () => {
    const calendarDays = generateCalendarDays()

    return (
      <View style={styles.viewContainer}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.monthNavButton}>
            <Text style={{ color: theme.primary, fontSize: 20 }}>‹</Text>
          </TouchableOpacity>

          <Text style={[styles.monthTitle, { color: theme.text }]}>
            {monthNames[currentMonth]} {currentYear}
          </Text>

          <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavButton}>
            <Text style={{ color: theme.primary, fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayHeader}>
          {dayNames.map((day, index) => (
            <Text key={index} style={[styles.weekdayText, { color: theme.secondaryText }]}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((item, index) => {
            if (item.isEmpty) {
              return <View key={`empty-${index}`} style={styles.emptyDay} />
            }

            return (
              <TouchableOpacity
                key={`day-${item.day}`}
                style={[
                  styles.calendarDay,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  item.isToday && { borderColor: theme.primary, borderWidth: 2 },
                  selectedDate === item.dateStr && { backgroundColor: `${theme.primary}20` },
                ]}
                onPress={() => {
                  setSelectedDate(item.dateStr)
                  setNewTransaction({ ...newTransaction, date: item.dateStr })
                }}
              >
                <View style={styles.dayHeader}>
                  <Text style={[styles.dayNumber, { color: item.isToday ? theme.primary : theme.text }]}>
                    {item.day}
                  </Text>

                  {(item.transactions?.length ?? 0) > 0 && (
                    <View style={[styles.transactionBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.transactionBadgeText}>{item.transactions?.length ?? 0}</Text>
                    </View>
                  )}
                </View>

                {item.totalSpent && item.totalSpent > 0 && (
                  <Text style={[styles.dayTotal, { color: theme.secondaryText }]}>${item.totalSpent.toFixed(0)}</Text>
                )}

                {item.transactions?.slice(0, 2).map((tx) => {
                  const category = appState.categories.find((c) => c.name === tx.category)
                  return (
                    <View key={tx.id} style={styles.dayTransaction}>
                      <View style={[styles.categoryDot, { backgroundColor: category?.color || theme.primary }]} />
                      <Text style={[styles.transactionText, { color: theme.secondaryText }]} numberOfLines={1}>
                        ${tx.amount.toFixed(0)} - {tx.category}
                      </Text>
                    </View>
                  )
                })}

                {(item.transactions?.length ?? 0) > 2 && (
                  <Text style={[styles.moreTransactions, { color: theme.secondaryText }]}>
                    +{(item.transactions?.length ?? 0) - 2} more
                  </Text>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            setShowAddTransaction(true)
            if (!selectedDate) {
              const today = formatDate(currentYear, currentMonth, currentDate.getDate())
              setSelectedDate(today)
              setNewTransaction({ ...newTransaction, date: today })
            }
          }}
        >
          <Text style={styles.addButtonText}>+ Add Transaction</Text>
        </TouchableOpacity>

        {selectedDate && (
          <View style={[styles.selectedDateCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.selectedDateHeader}>
              <Text style={[styles.selectedDateTitle, { color: theme.text }]}>Transactions for {selectedDate}</Text>
              <TouchableOpacity onPress={() => setSelectedDate(null)}>
                <Text style={[styles.closeButton, { color: theme.secondaryText }]}>Close</Text>
              </TouchableOpacity>
            </View>

            {getTransactionsForDate(selectedDate).length > 0 ? (
              <View style={styles.transactionsList}>
                {getTransactionsForDate(selectedDate).map((tx) => {
                  const category = appState.categories.find((c) => c.name === tx.category)
                  return (
                    <View
                      key={tx.id}
                      style={[
                        styles.transactionItem,
                        { backgroundColor: `${theme.background}80`, borderColor: theme.border },
                      ]}
                    >
                      <View style={styles.transactionInfo}>
                        <View
                          style={[styles.categoryIndicator, { backgroundColor: category?.color || theme.primary }]}
                        />
                        <View>
                          <Text style={[styles.categoryName, { color: theme.text }]}>
                            <Text>{category?.icon}</Text> {tx.category}
                          </Text>
                          <Text style={[styles.transactionDescription, { color: theme.secondaryText }]}>
                            {tx.description}
                          </Text>
                          {tx.isRecurring && (
                            <View style={styles.recurringBadge}>
                              <Text style={styles.recurringText}>
                                <Text>🔄</Text> {tx.recurringType}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.transactionActions}>
                        <Text style={[styles.transactionAmount, { color: theme.text }]}>${tx.amount.toFixed(2)}</Text>
                        <View style={styles.actionButtons}>
                          <TouchableOpacity onPress={() => openEditTransaction(tx)} style={styles.editButton}>
                            <Text style={{ color: theme.secondary }}>✎</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteTransaction(tx.id)} style={styles.deleteButton}>
                            <Text style={{ color: theme.danger }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            ) : (
              <View style={styles.emptyTransactions}>
                <Text style={[styles.emptyTransactionsText, { color: theme.secondaryText }]}>
                  No transactions for this date
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    )
  }

  // Render Categories View
  const renderCategoriesView = () => {
    return (
      <View style={styles.viewContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Categories</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowAddCategory(true)}
          >
            <Text style={styles.addButtonText}>+ Add Category</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.categoriesList}>
          {appState.categories.map((category) => {
            const percentSpent = category.budgeted > 0 ? (category.spent / category.budgeted) * 100 : 0
            const progressColor = percentSpent > 100 ? theme.danger : percentSpent > 80 ? theme.warning : theme.success

            return (
              <View
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryNameContainer}>
                    <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
                    <Text style={[styles.categoryTitle, { color: theme.text }]}>
                      <Text>{category.icon}</Text> {category.name}
                    </Text>
                  </View>

                  <View style={styles.categoryBudget}>
                    <Text style={[styles.budgetText, { color: theme.text }]}>
                      ${category.spent.toFixed(2)}
                      <Text style={{ color: theme.secondaryText, fontWeight: "normal" }}>
                        {" "}
                        of ${category.budgeted.toFixed(2)}
                      </Text>
                    </Text>
                    <Text style={[styles.percentText, { color: theme.secondaryText }]}>
                      {percentSpent.toFixed(0)}% spent
                    </Text>
                  </View>
                </View>

                <View style={[styles.progressBarBg, { backgroundColor: `${theme.background}80` }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: progressColor,
                        width: `${Math.min(percentSpent, 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  // Render Analytics View
  const renderAnalyticsView = () => {
    // Calculate percentages for the simple chart
    const calculatePercentages = () => {
      const total = appState.categories.reduce((sum, cat) => sum + cat.spent, 0)

      if (total === 0) return appState.categories.map((cat) => ({ ...cat, percentage: 0 }))

      return appState.categories
        .map((cat) => ({
          ...cat,
          percentage: (cat.spent / total) * 100,
        }))
        .sort((a, b) => b.spent - a.spent)
    }

    const categoryWithPercentages = calculatePercentages()
    const spendingPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0
    const spendingBarColor =
      spendingPercentage > 100 ? theme.danger : spendingPercentage > 80 ? theme.warning : theme.success

    const spendingChartData = getSpendingChartData()
    const categorySpendingData = getCategorySpendingData()

    return (
      <View style={styles.viewContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Spending Analytics</Text>

        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Monthly Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Total Budget</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>${totalBudgeted.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Total Spent</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>${totalSpent.toFixed(2)}</Text>
          </View>

          <View style={[styles.summaryDivider, { borderColor: theme.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Remaining</Text>
            <Text style={[styles.summaryValue, { color: remaining < 0 ? theme.danger : theme.success }]}>
              ${remaining.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.progressBarBg, { backgroundColor: `${theme.background}80` }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: spendingBarColor,
                  width: `${Math.min(spendingPercentage, 100)}%`,
                },
              ]}
            />
          </View>

          <Text style={[styles.percentText, { color: theme.secondaryText, textAlign: "right" }]}>
            {spendingPercentage.toFixed(0)}% of budget used
          </Text>
        </View>

        <View style={[styles.analyticsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Daily Spending</Text>

          {spendingChartData.datasets[0].data.some((value) => value > 0) ? (
            <LineChart
              data={spendingChartData}
              width={screenWidth - 40}
              height={220}
              yAxisLabel="$"
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`,
                propsForDots: { r: "4", strokeWidth: "2", stroke: theme.primary },
                fillShadowGradientFrom: theme.primary,
                fillShadowGradientTo: "#ffffff",
                fillShadowGradientOpacity: 0.2,
                decimalPlaces: 0,
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={[styles.emptyChartText, { color: theme.secondaryText }]}>
                No spending data for this month
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.analyticsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Spending by Category</Text>

          {categorySpendingData.length > 0 ? (
            <PieChart
              data={categorySpendingData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={[styles.emptyChartText, { color: theme.secondaryText }]}>
                No category spending data for this month
              </Text>
            </View>
          )}

          <View style={styles.categoriesLegend}>
            {categoryWithPercentages
              .filter((cat) => cat.spent > 0)
              .map((cat) => (
                <View key={cat.id} style={styles.legendItem}>
                  <View style={styles.legendItemLeft}>
                    <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                    <Text style={[styles.legendText, { color: theme.text }]}>
                      <Text>{cat.icon}</Text> {cat.name}
                    </Text>
                  </View>
                  <Text style={[styles.legendPercent, { color: theme.text }]}>{cat.percentage.toFixed(1)}%</Text>
                </View>
              ))}
          </View>
        </View>
      </View>
    )
  }

  // Render Add Category Modal
  const renderAddCategoryModal = () => {
    return (
      <Modal
        visible={showAddCategory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddCategory(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
              <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Category</Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Category Name</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                    ]}
                    value={newCategory.name}
                    onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
                    placeholder="e.g., Groceries"
                    placeholderTextColor={theme.secondaryText}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Monthly Budget</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                    ]}
                    value={newCategory.budgeted}
                    onChangeText={(text) => setNewCategory({ ...newCategory, budgeted: text })}
                    placeholder="0.00"
                    placeholderTextColor={theme.secondaryText}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Icon</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconSelector}>
                    {Object.entries(categoryIcons).map(([name, icon]) => (
                      <TouchableOpacity
                        key={icon}
                        style={[
                          styles.iconOption,
                          newCategory.icon === icon && [styles.selectedIcon, { borderColor: theme.primary }],
                        ]}
                        onPress={() => setNewCategory({ ...newCategory, icon })}
                      >
                        <Text style={styles.iconText}>{icon}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Color</Text>
                  <View style={styles.colorSelector}>
                    {[
                      "#006A4D",
                      "#4F46E5",
                      "#10B981",
                      "#F59E0B",
                      "#EC4899",
                      "#6366F1",
                      "#8B5CF6",
                      "#14B8A6",
                      "#64748B",
                    ].map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          newCategory.color === color && styles.selectedColor,
                        ]}
                        onPress={() => setNewCategory({ ...newCategory, color })}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { borderColor: theme.border }]}
                    onPress={() => setShowAddCategory(false)}
                  >
                    <Text style={{ color: theme.secondaryText }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.primary }]}
                    onPress={handleAddCategory}
                  >
                    <Text style={styles.confirmButtonText}>Add Category</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  // Render Add Transaction Modal
  const renderAddTransactionModal = () => {
    return (
      <Modal
        visible={showAddTransaction}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddTransaction(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
              <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Transaction</Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Date</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                    ]}
                    value={newTransaction.date}
                    onChangeText={(text) => setNewTransaction({ ...newTransaction, date: text })}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.secondaryText}
                  />
                  <Text style={[styles.inputHint, { color: theme.secondaryText }]}>
                    Format: YYYY-MM-DD (e.g., 2025-04-15)
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Amount</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                    ]}
                    value={newTransaction.amount}
                    onChangeText={(text) => setNewTransaction({ ...newTransaction, amount: text })}
                    placeholder="0.00"
                    placeholderTextColor={theme.secondaryText}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Category</Text>
                  <View
                    style={[styles.categoryPicker, { backgroundColor: theme.background, borderColor: theme.border }]}
                  >
                    <FlatList
                      data={appState.categories}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.categoryChip,
                            {
                              backgroundColor: newTransaction.category === item.name ? item.color : `${item.color}30`,
                            },
                          ]}
                          onPress={() => setNewTransaction({ ...newTransaction, category: item.name })}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              { color: newTransaction.category === item.name ? "#FFFFFF" : item.color },
                            ]}
                          >
                            <Text>{item.icon}</Text> {item.name}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Description</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                    ]}
                    value={newTransaction.description}
                    onChangeText={(text) => setNewTransaction({ ...newTransaction, description: text })}
                    placeholder="e.g., Grocery shopping"
                    placeholderTextColor={theme.secondaryText}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.recurringContainer}>
                    <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Recurring Transaction</Text>
                    <TouchableOpacity
                      style={[
                        styles.recurringToggle,
                        { backgroundColor: newTransaction.isRecurring ? theme.primary : theme.background },
                      ]}
                      onPress={() => setNewTransaction({ ...newTransaction, isRecurring: !newTransaction.isRecurring })}
                    >
                      <View
                        style={[
                          styles.toggleCircle,
                          {
                            backgroundColor: theme.card,
                            transform: [{ translateX: newTransaction.isRecurring ? 20 : 0 }],
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  </View>

                  {newTransaction.isRecurring && (
                    <View style={styles.recurringOptions}>
                      <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Frequency</Text>
                      <View style={styles.recurringTypeContainer}>
                        {(["daily", "weekly", "monthly", "yearly"] as const).map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.recurringTypeButton,
                              {
                                backgroundColor:
                                  newTransaction.recurringType === type ? theme.primary : theme.background,
                                borderColor: theme.border,
                              },
                            ]}
                            onPress={() => setNewTransaction({ ...newTransaction, recurringType: type })}
                          >
                            <Text
                              style={[
                                styles.recurringTypeText,
                                { color: newTransaction.recurringType === type ? "#FFFFFF" : theme.text },
                              ]}
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>
                        End Date (Optional)
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                        ]}
                        value={newTransaction.recurringEndDate}
                        onChangeText={(text) => setNewTransaction({ ...newTransaction, recurringEndDate: text })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={theme.secondaryText}
                      />
                      <Text style={[styles.inputHint, { color: theme.secondaryText }]}>
                        Leave blank for indefinite recurring
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { borderColor: theme.border }]}
                    onPress={() => setShowAddTransaction(false)}
                  >
                    <Text style={{ color: theme.secondaryText }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.primary }]}
                    onPress={handleAddTransaction}
                  >
                    <Text style={styles.confirmButtonText}>Add Transaction</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  // Render Edit Transaction Modal
  const renderEditTransactionModal = () => {
    return (
      <Modal
        visible={showEditTransaction}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditTransaction(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
              <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Transaction</Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Date</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                    ]}
                    value={newTransaction.date}
                    onChangeText={(text) => setNewTransaction({ ...newTransaction, date: text })}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.secondaryText}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Amount</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                    ]}
                    value={newTransaction.amount}
                    onChangeText={(text) => setNewTransaction({ ...newTransaction, amount: text })}
                    placeholder="0.00"
                    placeholderTextColor={theme.secondaryText}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Category</Text>
                  <View
                    style={[styles.categoryPicker, { backgroundColor: theme.background, borderColor: theme.border }]}
                  >
                    <FlatList
                      data={appState.categories}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.categoryChip,
                            {
                              backgroundColor: newTransaction.category === item.name ? item.color : `${item.color}30`,
                            },
                          ]}
                          onPress={() => setNewTransaction({ ...newTransaction, category: item.name })}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              { color: newTransaction.category === item.name ? "#FFFFFF" : item.color },
                            ]}
                          >
                            <Text>{item.icon}</Text> {item.name}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Description</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                    ]}
                    value={newTransaction.description}
                    onChangeText={(text) => setNewTransaction({ ...newTransaction, description: text })}
                    placeholder="e.g., Grocery shopping"
                    placeholderTextColor={theme.secondaryText}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.recurringContainer}>
                    <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Recurring Transaction</Text>
                    <TouchableOpacity
                      style={[
                        styles.recurringToggle,
                        { backgroundColor: newTransaction.isRecurring ? theme.primary : theme.background },
                      ]}
                      onPress={() => setNewTransaction({ ...newTransaction, isRecurring: !newTransaction.isRecurring })}
                    >
                      <View
                        style={[
                          styles.toggleCircle,
                          {
                            backgroundColor: theme.card,
                            transform: [{ translateX: newTransaction.isRecurring ? 20 : 0 }],
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  </View>

                  {newTransaction.isRecurring && (
                    <View style={styles.recurringOptions}>
                      <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Frequency</Text>
                      <View style={styles.recurringTypeContainer}>
                        {(["daily", "weekly", "monthly", "yearly"] as const).map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.recurringTypeButton,
                              {
                                backgroundColor:
                                  newTransaction.recurringType === type ? theme.primary : theme.background,
                                borderColor: theme.border,
                              },
                            ]}
                            onPress={() => setNewTransaction({ ...newTransaction, recurringType: type })}
                          >
                            <Text
                              style={[
                                styles.recurringTypeText,
                                { color: newTransaction.recurringType === type ? "#FFFFFF" : theme.text },
                              ]}
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={[styles.inputLabel, { color: theme.secondaryText, marginTop: 10 }]}>
                        End Date (Optional)
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                        ]}
                        value={newTransaction.recurringEndDate}
                        onChangeText={(text) => setNewTransaction({ ...newTransaction, recurringEndDate: text })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={theme.secondaryText}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { borderColor: theme.border }]}
                    onPress={() => setShowEditTransaction(false)}
                  >
                    <Text style={{ color: theme.secondaryText }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.primary }]}
                    onPress={handleEditTransaction}
                  >
                    <Text style={styles.confirmButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading budget data...</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Budget Planner</Text>

          {/* Overview cards */}
          <View style={styles.overviewCards}>
            <View style={[styles.overviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.overviewContent}>
                <View>
                  <Text style={[styles.overviewLabel, { color: theme.secondaryText }]}>Total Budget</Text>
                  <Text style={[styles.overviewValue, { color: theme.text }]}>${totalBudgeted.toFixed(2)}</Text>
                </View>
                <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}20` }]}>
                  <Text style={[styles.icon, { color: theme.primary }]}>💰</Text>
                </View>
              </View>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.overviewContent}>
                <View>
                  <Text style={[styles.overviewLabel, { color: theme.secondaryText }]}>Total Spent</Text>
                  <Text style={[styles.overviewValue, { color: theme.text }]}>${totalSpent.toFixed(2)}</Text>
                </View>
                <View style={[styles.iconContainer, { backgroundColor: `${theme.success}20` }]}>
                  <Text style={[styles.icon, { color: theme.success }]}>📊</Text>
                </View>
              </View>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.overviewContent}>
                <View>
                  <Text style={[styles.overviewLabel, { color: theme.secondaryText }]}>Remaining</Text>
                  <Text style={[styles.overviewValue, { color: remaining < 0 ? theme.danger : theme.success }]}>
                    ${remaining.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.iconContainer, { backgroundColor: `${theme.warning}20` }]}>
                  <Text style={[styles.icon, { color: theme.warning }]}>⚙️</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Navigation tabs */}
          <View style={[styles.tabBar, { borderColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.tab, activeView === "calendar" && [styles.activeTab, { borderColor: theme.primary }]]}
              onPress={() => setActiveView("calendar")}
            >
              <Text
                style={[styles.tabText, { color: activeView === "calendar" ? theme.primary : theme.secondaryText }]}
              >
                📅 Calendar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeView === "categories" && [styles.activeTab, { borderColor: theme.primary }]]}
              onPress={() => setActiveView("categories")}
            >
              <Text
                style={[styles.tabText, { color: activeView === "categories" ? theme.primary : theme.secondaryText }]}
              >
                ⚙️ Categories
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeView === "analytics" && [styles.activeTab, { borderColor: theme.primary }]]}
              onPress={() => setActiveView("analytics")}
            >
              <Text
                style={[styles.tabText, { color: activeView === "analytics" ? theme.primary : theme.secondaryText }]}
              >
                📊 Analytics
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main content area */}
          <View style={[styles.contentCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={[theme.primary]}
                  tintColor={theme.primary}
                />
              }
            >
              {activeView === "calendar" && renderCalendarView()}
              {activeView === "categories" && renderCategoriesView()}
              {activeView === "analytics" && renderAnalyticsView()}
            </ScrollView>
          </View>

          {/* Modals */}
          {renderAddCategoryModal()}
          {renderAddTransactionModal()}
          {renderEditTransactionModal()}
        </Animated.View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  overviewCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  overviewCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,// Use theme color instead of hardcoded "white"
    overflow: "hidden", // Add overflow hidden
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontWeight: "500",
  },
  contentCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scrollContent: {
    padding: 12,
  },
  viewContainer: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  monthNavButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  weekdayHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  weekdayText: {
    width: 40,
    textAlign: "center",
    fontWeight: "500",
    fontSize: 14,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emptyDay: {
    width: "13.5%",
    aspectRatio: 1,
    marginBottom: 8,
  },
  calendarDay: {
    width: "13.5%",
    aspectRatio: 1,
    borderRadius: 8,
    padding: 4,
    marginBottom: 8,
    borderWidth: 1,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "500",
  },
  dayTotal: {
    fontSize: 10,
    fontWeight: "500",
    marginBottom: 2,
  },
  transactionBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  dayTransaction: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  transactionText: {
    fontSize: 8,
    flex: 1,
  },
  moreTransactions: {
    fontSize: 8,
    marginTop: 2,
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  addButtonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 14,
  },
  selectedDateCard: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: "hidden",
  },
  selectedDateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectedDateTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  closeButton: {
    fontSize: 14,
  },
  transactionsList: {
    marginTop: 8,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  transactionInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontWeight: "500",
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
  },
  transactionActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    marginLeft: 8,
  },
  editButton: {
    padding: 6,
    marginRight: 4,
  },
  deleteButton: {
    padding: 6,
  },
  transactionAmount: {
    fontWeight: "bold",
  },
  emptyTransactions: {
    padding: 20,
    alignItems: "center",
  },
  emptyTransactionsText: {
    fontSize: 14,
  },
  categoriesList: {
    paddingBottom: 16,
  },
  categoryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: "hidden",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryTitle: {
    fontWeight: "500",
  },
  categoryBudget: {
    alignItems: "flex-end",
  },
  budgetText: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  percentText: {
    fontSize: 12,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: "hidden",
  },
  analyticsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: "hidden",
  },
  cardTitle: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontWeight: "bold",
    fontSize: 14,
  },
  summaryDivider: {
    borderTopWidth: 1,
    marginVertical: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  emptyChartContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyChartText: {
    fontSize: 14,
  },
  categoriesLegend: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  legendItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
  legendPercent: {
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 16,
    maxHeight: "80%", // Use theme color
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  colorSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 4,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  iconSelector: {
    flexDirection: "row",
    marginTop: 8,
    maxHeight: 50,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  selectedIcon: {
    borderWidth: 2,
  },
  iconText: {
    fontSize: 20,
  },
  categoryPicker: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryChipText: {
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    minWidth: 100,
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "500",
    textAlign: "center",
  },
  recurringContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  recurringToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 5,
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  recurringOptions: {
    marginTop: 10,
  },
  recurringTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  recurringTypeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  recurringTypeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  recurringBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#f0f0f0",
    alignSelf: "flex-start",
  },
  recurringText: {
    fontSize: 10,
    color: "#666",
  },
  overviewContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overviewLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
  },
})

export default BudgetCalendar
