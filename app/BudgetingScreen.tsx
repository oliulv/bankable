import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext" // Context for user data
import { getAccountTransactions } from "../api/userData" // API function to fetch transactions
import { LineChart, PieChart } from "react-native-chart-kit" // Charting library
import AsyncStorage from "@react-native-async-storage/async-storage" // For storing budget settings

// --- Constants ---

// Get screen width for chart dimensions
const { width } = Dimensions.get("window")

// --- Interfaces ---

/** Defines the structure for a single transaction object, matching the API response and internal usage. */
interface Transaction {
  transaction_id: string
  account_id: string
  transaction_date: string
  description: string // Mapped from transaction_reference
  amount: number // Mapped from transaction_amount
  transaction_type: "income" | "expense" // Determined based on amount
  merchant_name?: string // Optional merchant name
  category?: string // Optional category
}

/** Defines the structure for storing budget settings for a specific category. */
interface CategoryBudget {
  category: string
  budgetAmount: number
}

// --- Configuration ---

// Categories considered as expenses for budgeting and pie chart display.
const EXPENSE_CATEGORIES = ["Food", "Utility", "Saving", "Health", "Leisure", "Shopping", "Withdrawal", "Interest"]

// Color mapping for different transaction categories, primarily used for visualization.
// Using shades of green and some distinct colors.
const CATEGORY_COLORS: Record<string, string> = {
  Food: "#015F45", // Dark green
  Utility: "#52B788", // Medium green
  Saving: "#81C995", // Light green
  Health: "#2D6A4F", // Forest green
  Leisure: "#40916C", // Teal green
  Shopping: "#6C757D", // Gray (distinct from greens)
  Withdrawal: "#74C69D", // Mint green
  Interest: "#B7E4C7", // Very light green
  // Other categories (might appear in transactions but not typically budgeted expenses)
  Mortgage: "#006A4D",
  Transfer: "#95D5B2", // Pale green (distinct from gray)
  Gambling: "#E76F51", // Orange-Red
  "Life Event": "#FFD166", // Yellow
  "Monthly fees": "#9C6644", // Brown
  "Monthly income": "#52B788", // Medium green (same as Utility for consistency)
}

/**
 * Budget Tracker Screen Component.
 * Provides an overview of income, expenses, and budget goals for a selected month.
 * Allows users to view transactions, set budgets per category, and visualize spending patterns.
 */
const DynamicBudgetCalendarScreen = () => {
  // --- State Variables ---
  const { customerData, accounts, isLoading: userDataLoading } = useUser() // User context data
  const [transactions, setTransactions] = useState<Transaction[]>([]) // Stores transactions for the selected month
  const [loading, setLoading] = useState<boolean>(true) // Loading state for initial data fetch
  const [refreshing, setRefreshing] = useState<boolean>(false) // State for pull-to-refresh indicator
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all") // Filter for transaction list ('all', 'income', 'expense')
  const [searchQuery, setSearchQuery] = useState<string>("") // Search query for filtering transactions
  const [showSearch, setShowSearch] = useState<boolean>(false) // Toggles visibility of the search bar (currently unused in UI logic)
  const [hasScrolled, setHasScrolled] = useState<boolean>(false) // Tracks if the main scroll view has scrolled for header shadow effect
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "settings">("overview") // Currently active tab
  const [showBudgetModal, setShowBudgetModal] = useState<boolean>(false) // Controls visibility of the budget setting modal
  const [selectedCategory, setSelectedCategory] = useState<string>("") // Category selected for budget setting
  const [budgetAmount, setBudgetAmount] = useState<string>("") // Input value for budget amount in the modal
  const [tooltipData, setTooltipData] = useState<{ visible: boolean; value: number; date: string }>({ // State for line chart tooltip
    visible: false,
    value: 0,
    date: "",
  })
  const defaultMonth = new Date(2024, 10, 1) // Default month to November 2024 (month is 0-indexed)
  const [selectedMonth, setSelectedMonth] = useState<Date>(defaultMonth) // Currently selected month for display
  const [showMonthPicker, setShowMonthPicker] = useState<boolean>(false) // Controls visibility of the month picker modal
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]) // Stores user-defined budgets per category

  // --- Refs ---
  const flatListRef = useRef<FlatList>(null) // Ref for the transaction FlatList to control scrolling

  // --- Effects ---

  // Initialize category budgets from AsyncStorage or set defaults on component mount.
  useEffect(() => {
    const initializeBudgets = async () => {
      try {
        const savedBudgets = await AsyncStorage.getItem("categoryBudgets")
        if (savedBudgets) {
          // Load saved budgets if they exist
          setCategoryBudgets(JSON.parse(savedBudgets))
        } else {
          // Set default budgets for expense categories if none are saved
          const defaultBudgets = EXPENSE_CATEGORIES.map((category) => {
            let defaultAmount = 0
            // Pre-fill some common categories with example budgets
            if (category === "Shopping") defaultAmount = 250
            if (category === "Leisure") defaultAmount = 200
            return {
              category,
              budgetAmount: defaultAmount,
            }
          })
          setCategoryBudgets(defaultBudgets)
          // Save these defaults to AsyncStorage
          await AsyncStorage.setItem("categoryBudgets", JSON.stringify(defaultBudgets))
        }
      } catch (error) {
        console.error("Failed to initialize category budgets:", error)
        // Handle error, potentially set empty budgets or defaults
        setCategoryBudgets(EXPENSE_CATEGORIES.map(category => ({ category, budgetAmount: 0 })));
      }
    }

    initializeBudgets()
  }, []) // Empty dependency array ensures this runs only once on mount

  // Load transactions for the selected month whenever accounts or selectedMonth change.
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true) // Show loading indicator

        // Proceed only if accounts data is available
        if (accounts && accounts.length > 0) {
          let allTransactions: Transaction[] = []

          // Fetch transactions for each account concurrently
          const transactionPromises = accounts.map(async (account): Promise<Transaction[]> => { // Explicit return type
            const accountTransactions = await getAccountTransactions(account.account_id)
            // Map the raw API response to the structured Transaction interface
            return accountTransactions.map((tx: any): Transaction => ({ // Explicit return type for map
              transaction_id: String(tx.transaction_id), // Ensure string
              account_id: String(tx.account_id), // Ensure string
              transaction_date: String(tx.transaction_date), // Ensure string
              description: tx.transaction_reference || "Transaction", // Use reference as description fallback
              amount: Number(tx.transaction_amount), // Ensure number
              transaction_type: Number(tx.transaction_amount) >= 0 ? "income" : "expense", // Determine type based on amount
              merchant_name: tx.merchant_name || tx.transaction_reference, // Use reference as merchant fallback
              category: tx.transaction_category || "Other", // Default category if missing
            }))
          })

          // Wait for all fetches to complete and flatten the results
          const results: Transaction[][] = await Promise.all(transactionPromises) // Explicit type
          allTransactions = results.flat()

          // Filter the fetched transactions to include only those within the selected month and year
          const filteredTransactions = allTransactions.filter((transaction) => {
            const transactionDate = new Date(transaction.transaction_date)
            return (
              transactionDate.getMonth() === selectedMonth.getMonth() &&
              transactionDate.getFullYear() === selectedMonth.getFullYear()
            )
          })

          setTransactions(filteredTransactions) // Update state with filtered transactions
        } else {
          // If no accounts, set transactions to empty
          setTransactions([])
        }
      } catch (error) {
        console.error("Failed to load transactions:", error)
        setTransactions([]) // Set empty on error
      } finally {
        setLoading(false) // Hide loading indicator
      }
    }

    loadTransactions()
  }, [accounts, selectedMonth]) // Dependencies: re-run effect if accounts or selectedMonth change

  // Save category budgets to AsyncStorage whenever the `categoryBudgets` state changes.
  useEffect(() => {
    const saveBudgets = async () => {
      try {
        // Persist the current budget settings
        await AsyncStorage.setItem("categoryBudgets", JSON.stringify(categoryBudgets))
      } catch (error) {
        console.error("Failed to save category budgets:", error)
      }
    }

    // Only save if there are budgets defined (avoids saving empty array initially)
    if (categoryBudgets.length > 0) {
      saveBudgets()
    }
  }, [categoryBudgets]) // Dependency: run effect whenever categoryBudgets state changes

  // --- Event Handlers ---

  /**
   * Handles the scroll event of the main ScrollView/FlatList.
   * Sets the `hasScrolled` state to true if scrolled down, false if scrolled back to top.
   * Used to conditionally apply a shadow to the tab navigation header.
   * @param event - The native scroll event.
   */
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y
    setHasScrolled(scrollY > 5) // Set true if scrolled more than 5 pixels down
  }

  /**
   * Handles the pull-to-refresh action on the ScrollView/FlatList.
   * Refetches transactions for the currently selected month.
   */
  const handleRefresh = async () => {
    setRefreshing(true) // Show refresh indicator

    try {
      // Re-fetch logic (similar to the initial load in useEffect)
      if (accounts && accounts.length > 0) {
        let allTransactions: Transaction[] = []
        const transactionPromises = accounts.map(async (account): Promise<Transaction[]> => { // Explicit return type
          const accountTransactions = await getAccountTransactions(account.account_id)
          return accountTransactions.map((tx: any): Transaction => ({ // Explicit return type for map
            transaction_id: String(tx.transaction_id), // Ensure string
            account_id: String(tx.account_id), // Ensure string
            transaction_date: String(tx.transaction_date), // Ensure string
            description: tx.transaction_reference || "Transaction",
            amount: Number(tx.transaction_amount), // Ensure number
            transaction_type: Number(tx.transaction_amount) >= 0 ? "income" : "expense",
            merchant_name: tx.merchant_name || tx.transaction_reference,
            category: tx.transaction_category || "Other",
          }))
        })
        const results: Transaction[][] = await Promise.all(transactionPromises) // Explicit type
        allTransactions = results.flat()

        // Filter for the selected month
        const filteredTransactions = allTransactions.filter((transaction) => {
          const transactionDate = new Date(transaction.transaction_date)
          return (
            transactionDate.getMonth() === selectedMonth.getMonth() &&
            transactionDate.getFullYear() === selectedMonth.getFullYear()
          )
        })

        setTransactions(filteredTransactions) // Update state with refreshed data
      }
    } catch (error) {
      console.error("Failed to refresh transactions:", error)
      Alert.alert("Error", "Failed to refresh data. Please try again.") // Show error to user
    } finally {
      setRefreshing(false) // Hide refresh indicator
    }
  }

  /**
   * Updates the budget amount for the `selectedCategory`.
   * Validates the input, updates the `categoryBudgets` state, and closes the modal.
   */
  const handleUpdateBudget = () => {
    const numericAmount = Number.parseFloat(budgetAmount) // Convert input string to number

    // Validate the input amount
    if (isNaN(numericAmount) || numericAmount < 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive number for your budget.")
      return
    }

    // Update the categoryBudgets state
    setCategoryBudgets((currentBudgets) => {
      const existingBudgetIndex = currentBudgets.findIndex((b) => b.category === selectedCategory)

      if (existingBudgetIndex > -1) {
        // If budget for this category exists, update it
        const updatedBudgets = [...currentBudgets]
        updatedBudgets[existingBudgetIndex] = { ...updatedBudgets[existingBudgetIndex], budgetAmount: numericAmount }
        return updatedBudgets
      } else {
        // If no budget exists, add a new entry
        return [...currentBudgets, { category: selectedCategory, budgetAmount: numericAmount }]
      }
    })

    // Close modal and reset input fields
    setShowBudgetModal(false)
    setBudgetAmount("")
    setSelectedCategory("")
  }

  /**
   * Opens the budget setting modal for a specific category.
   * Pre-fills the input field with the existing budget amount if available.
   * @param category - The category name for which to set the budget.
   */
  const openBudgetModal = (category: string) => {
    setSelectedCategory(category) // Set the category being edited
    const existingBudget = categoryBudgets.find((b) => b.category === category)
    // Pre-fill amount if budget exists, otherwise empty string
    setBudgetAmount(existingBudget ? existingBudget.budgetAmount.toString() : "")
    setShowBudgetModal(true) // Show the modal
  }

  /**
   * Switches the active tab and resets the scroll position of the content area.
   * @param tab - The target tab ('overview', 'transactions', 'settings').
   */
  const switchTab = (tab: "overview" | "transactions" | "settings") => {
    setActiveTab(tab)
    // Scroll the FlatList (if active) or ScrollView back to the top smoothly
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true })
    }
    // Note: Need a ref for the ScrollView in 'overview' and 'settings' tabs to scroll them too.
    // This example only scrolls the FlatList in the 'transactions' tab.
  }

  // --- Memoized Calculations ---

  /**
   * Filters transactions based on the selected `filterType` ('all', 'income', 'expense')
   * and the `searchQuery`. Sorts the results by date (newest first).
   * Uses `useMemo` for performance optimization, recalculating only when dependencies change.
   */
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions] // Start with all transactions for the month

    // Apply type filter
    if (filterType === "income") {
      filtered = filtered.filter((t) => t.amount > 0)
    } else if (filterType === "expense") {
      filtered = filtered.filter((t) => t.amount < 0)
    }

    // Apply search filter (case-insensitive)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.description?.toLowerCase().includes(query) ||
          t.merchant_name?.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query),
      )
    }

    // Sort by transaction date, newest first
    return filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
  }, [transactions, filterType, searchQuery]) // Dependencies: recalculate if these change

  /**
   * Calculates the total spending for each expense category within the selected month.
   * Formats the data for use in the custom pie chart visualization.
   * Excludes income and 'Transfer' category transactions.
   * Uses `useMemo` for performance optimization.
   */
  const spendingByCategory = useMemo(() => {
    const categorySpending: Record<string, number> = {}

    // Iterate through transactions, summing up expenses per category
    transactions
      .filter((t) => t.amount < 0) // Only consider expenses
      .forEach((t) => {
        const category = t.category || "Other"
        // Include only categories defined in EXPENSE_CATEGORIES and explicitly exclude 'Transfer'
        if (EXPENSE_CATEGORIES.includes(category) && category !== "Transfer") {
          categorySpending[category] = (categorySpending[category] || 0) + Math.abs(t.amount)
        }
      })

    // Calculate total spending across included categories for percentage calculation
    const totalSpending = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0)

    // Map the aggregated spending data into the format required by the chart/legend
    return Object.entries(categorySpending)
      .map(([category, amount]) => {
        const percentage = totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0
        return {
          name: category,
          amount,
          percentage,
          color: CATEGORY_COLORS[category] || "#6C757D", // Get color from map or default gray
          legendFontColor: "#333333", // Legend text color
          legendFontSize: 12, // Legend text size
        }
      })
      .sort((a, b) => b.amount - a.amount) // Sort categories by spending amount descending
      .filter(item => item.name !== "Transfer"); // Final safety filter to ensure Transfer is excluded
  }, [transactions]) // Dependency: recalculate if transactions change

  /**
   * Calculates the total daily spending for the selected month.
   * Formats the data for the LineChart component.
   * Uses `useMemo` for performance optimization.
   */
  const dailySpending = useMemo(() => {
    const dailyData: number[] = [] // Array to hold spending amount for each day
    const labels: string[] = [] // Array for x-axis labels (day numbers)

    // Determine the number of days in the selected month
    const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
    const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
    const daysInMonth = endDate.getDate()

    // Iterate through each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
      // Add label for the day (only show every 5th day to reduce clutter)
      labels.push(i % 5 === 0 ? i.toString() : "")

      // Calculate total expenses for the current day
      const dayExpenses = transactions
        .filter((t) => {
          const transactionDate = new Date(t.transaction_date)
          // Check if transaction date matches the current day and is an expense
          return transactionDate.getDate() === i && t.amount < 0
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) // Sum the absolute amounts

      dailyData.push(dayExpenses) // Add the total expense for the day to the data array
    }

    // Return data formatted for the LineChart
    return {
      labels,
      datasets: [
        {
          data: dailyData,
          color: (opacity = 1) => `rgba(1, 95, 69, ${opacity})`, // Line color (Bankable green)
          strokeWidth: 2, // Line thickness
        },
      ],
    }
  }, [transactions, selectedMonth]) // Dependencies: recalculate if transactions or selectedMonth change

  /**
   * Calculates the total income and total expenses for the selected month.
   * Uses `useMemo` for performance optimization.
   */
  const incomeVsExpenses = useMemo(() => {
    // Sum of all positive transaction amounts
    const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
    // Sum of the absolute values of all negative transaction amounts
    const totalExpenses = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
    return { totalIncome, totalExpenses }
  }, [transactions]) // Dependency: recalculate if transactions change

  // --- Helper Functions ---

  /**
   * Formats a number as a currency string in GBP (e.g., £1,234.56).
   * @param amount - The numerical amount to format.
   * @returns The formatted currency string.
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  /**
   * Formats a date string into a short format (e.g., "5 Nov").
   * @param dateString - The date string (ISO format or similar).
   * @returns The formatted date string.
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short", // e.g., "Nov"
    })
  }

  /**
   * Returns the appropriate Ionicons icon name for a given transaction category.
   * Includes fallback logic for partial matches and a default icon.
   * @param category - The transaction category string.
   * @returns The name of the Ionicons icon.
   */
  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    // Mapping of normalized category names (or keywords) to icon names
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      food: "fast-food-outline",
      shopping: "cart-outline",
      monthly_income: "trending-up-outline", // Consider 'cash-outline' or 'wallet-outline' too
      leisure: "game-controller-outline", // Changed from videocam
      saving: "wallet-outline", // Or 'save-outline'
      utility: "flash-outline", // Or 'water-outline', 'home-outline' depending on context
      withdrawal: "cash-outline",
      interest: "trending-up-outline",
      health: "fitness-outline", // Or 'medkit-outline'
      transfer: "swap-horizontal-outline",
      clothing: "shirt-outline",
      mortgage: "home-outline",
      gambling: "logo-usd", // Changed from game-controller
      transport: "bus-outline", // Added common category
      rent: "home-outline", // Added common category
      groceries: "cart-outline", // Added common category
      bills: "document-text-outline", // Added common category
      other: "help-circle-outline", // Default for 'Other'
    }

    // Normalize the input category name (lowercase, trim whitespace)
    const normalizedCategory = category?.toLowerCase()?.trim() || "other"

    // 1. Try direct match with the normalized category name
    if (iconMap[normalizedCategory]) {
      return iconMap[normalizedCategory]
    }

    // 2. Try partial matching: check if the normalized category *contains* a keyword from the map
    for (const [key, icon] of Object.entries(iconMap)) {
      if (normalizedCategory.includes(key)) {
        return icon
      }
    }

    // 3. Try partial matching: check if a keyword from the map *contains* the normalized category (less common)
    // Example: category="supermarket" might match key="market" if that existed
    // This is less reliable and might need refinement based on actual category names.
    // for (const [key, icon] of Object.entries(iconMap)) {
    //   if (key.includes(normalizedCategory)) {
    //     return icon;
    //   }
    // }

    // 4. Default fallback icon if no match found
    return "card-outline"
  }


  /**
   * Finds the account name corresponding to a given account ID.
   * @param accountId - The ID of the account to find.
   * @returns The product name of the account or "Unknown Account" if not found.
   */
  const getAccountNameById = (accountId: string): string => {
    const account = accounts.find((acc) => acc.account_id === accountId)
    // Assumes account object has a 'product' property with 'product_name'
    return account ? account.product.product_name : "Unknown Account"
  }

  // --- Chart Configurations ---

  /** Configuration object for the LineChart component. */
  const lineChartConfig = {
    backgroundColor: "#ffffff", // Chart background color
    backgroundGradientFrom: "#ffffff", // Gradient start color
    backgroundGradientTo: "#ffffff", // Gradient end color
    color: (opacity = 1) => `rgba(1, 95, 69, ${opacity})`, // Default line/label color (Bankable green)
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.7})`, // Axis label color (slightly transparent black)
    strokeWidth: 2, // Line thickness
    barPercentage: 0.5, // Used for bar charts if present
    decimalPlaces: 0, // Decimal places for axis labels
    propsForBackgroundLines: { // Style for background grid lines
      stroke: "#e0f2e3", // Light green grid lines
      strokeWidth: 1,
    },
    propsForDots: { // Style for data points on the line
      r: "0", // Radius 0 makes dots invisible
    },
    propsForLabels: { // Style for axis labels
      fontSize: 10,
    },
  }

  // --- Render Functions ---

  /**
   * Renders a single transaction item in the FlatList.
   * @param item - The Transaction object for the current row.
   */
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.amount > 0 // Determine if it's income or expense
    const accountName = getAccountNameById(item.account_id) // Get the account name

    return (
      // Card container for the transaction
      <View style={styles.transactionCard}>
        {/* Icon representing the transaction category */}
        <View style={styles.transactionIconContainer}>
          <Ionicons name={getCategoryIcon(item.category || "Other")} size={24} color="#015F45" />
        </View>
        {/* Middle section with transaction details */}
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionMerchant} numberOfLines={1}>{item.merchant_name || item.description}</Text>
          <Text style={styles.transactionCategory}>
            {item.category || "Other"} • {formatDate(item.transaction_date)} {/* Category and formatted date */}
          </Text>
          <Text style={styles.transactionAccount}>{accountName}</Text> {/* Account name */}
        </View>
        {/* Right section displaying the transaction amount */}
        <View style={styles.transactionAmounts}>
          <Text style={[styles.transactionAmount, { color: isIncome ? "#015F45" : "#000000" }]}>
            {isIncome ? "+" : ""} {/* Add '+' sign for income */}
            {formatCurrency(item.amount)} {/* Formatted amount */}
          </Text>
        </View>
      </View>
    )
  }

  /**
   * Renders a custom pie chart visualization and legend for spending by category.
   * This component calculates its own category data based on all transactions for the month.
   */
  const CustomPieChart = () => {
    // Calculate category spending data specifically for this component
    const allCategories = useMemo(() => {
      const categorySpending: Record<string, number> = {}

      // Aggregate spending for all expense categories found in transactions
      transactions
        .filter((t) => t.amount < 0) // Only expenses
        .forEach((t) => {
          const category = t.category || "Other"
          if (category !== "Transfer") { // Exclude transfers
            categorySpending[category] = (categorySpending[category] || 0) + Math.abs(t.amount)
          }
        })

      const totalSpending = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0)

      // Map to the required format, assigning colors
      return Object.entries(categorySpending)
        .map(([category, amount]) => {
          const percentage = totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0
          const color = CATEGORY_COLORS[category] || "#6C757D" // Use defined color or default gray
          return {
            name: category,
            amount,
            percentage,
            color,
            legendFontColor: "#333333",
            legendFontSize: 12,
          }
        })
        .sort((a, b) => b.amount - a.amount) // Sort by amount descending
        .filter(item => item.name !== "Transfer"); // Final safety filter
    }, [transactions]) // Dependency: recalculate if transactions change

    // Display message if no spending data is available
    if (allCategories.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No spending data available for {selectedMonth.toLocaleDateString("en-GB", { month: "long" })}</Text>
        </View>
      )
    }

    // Render the pie chart visualization and legend
    return (
      <View style={styles.pieChartContainer}>
        {/* Abstract visualization area using colored circles */}
        {/* Note: This is not a traditional pie chart but a visual representation */}
        <View style={styles.pieChartVisualContainer}>
          {/* Map through categories to render positioned & scaled circles */}
          {allCategories.map((category, index) => {
            // Calculate position on a circle using trigonometry
            const angle = index * (Math.PI / (allCategories.length / 2)); // Distribute points around a circle
            const radius = 80; // Radius of the circle layout
            const scaleFactor = Math.max(0.5, Math.min(2, category.percentage / 10)); // Scale based on percentage (adjust divisor as needed)

            return (
              <View
                key={index}
                style={[
                  styles.pieChartSegment, // Base style for the segment (circle)
                  {
                    backgroundColor: category.color, // Color from category data
                    width: 40, // Base width
                    height: 40, // Base height
                    borderRadius: 20, // Make it a circle
                    position: "absolute", // Position absolutely within the container
                    // Center + offset based on angle and radius
                    top: 80 + Math.sin(angle) * radius - 20, // Center Y + sin(angle)*radius - half height
                    left: (width / 2 - 20) + Math.cos(angle) * radius - 20, // Center X + cos(angle)*radius - half width
                    zIndex: 5 - (index % 5), // Basic z-index layering
                    transform: [{ scale: scaleFactor }], // Scale based on percentage
                  },
                ]}
              />
            );
          })}
          {/* Text in the center of the visualization */}
          <Text style={styles.pieChartCenterText}>{selectedMonth.toLocaleDateString("en-GB", { month: "short" })}</Text>
        </View>

        {/* Legend area displaying category details */}
        <View style={styles.pieChartLegendContainer}>
          {allCategories.map((category, index) => (
            // Row for each category in the legend
            <View key={index} style={styles.pieChartLegendItem}>
              <View style={[styles.legendColorDot, { backgroundColor: category.color }]} /> {/* Color indicator */}
              <Text style={styles.pieChartLegendText}>
                {category.name} ({category.percentage}%) {/* Name and percentage */}
              </Text>
              <Text style={styles.pieChartLegendAmount}>{formatCurrency(category.amount)}</Text> {/* Formatted amount */}
            </View>
          ))}
        </View>
      </View>
    )
  }

  // --- Dynamic Styles ---

  // Style for the tab container, adding shadow when scrolled
  const pillTabContainerWithShadow = StyleSheet.flatten([
    styles.pillTabContainer, // Base style
    { // Shadow properties
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3, // Android shadow
    },
  ])

  // --- Main Component Return ---
  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section: Title, Subtitle (Month), Month Selector */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Budget Tracker</Text>
        <Text style={styles.subtitle}>
          {selectedMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </Text>

        {/* Month Navigation Controls */}
        <View style={styles.monthSelectorContainer}>
          {/* Previous Month Button */}
          <TouchableOpacity
            style={styles.monthArrowButton}
            onPress={() => {
              const newMonth = new Date(selectedMonth)
              newMonth.setMonth(newMonth.getMonth() - 1)
              // Basic validation: Allow navigation within 2024
              if (newMonth.getFullYear() === 2024 && newMonth.getMonth() >= 0) {
                setSelectedMonth(newMonth)
              }
            }}
          >
            <Ionicons name="chevron-back" size={24} color="#015F45" />
          </TouchableOpacity>

          {/* Current Month Display & Picker Trigger */}
          <TouchableOpacity style={styles.monthButton} onPress={() => setShowMonthPicker(true)}>
            <Text style={styles.monthButtonText}>{selectedMonth.toLocaleDateString("en-GB", { month: "long" })}</Text>
            <Ionicons name="calendar-outline" size={18} color="#015F45" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          {/* Next Month Button */}
          <TouchableOpacity
            style={styles.monthArrowButton}
            onPress={() => {
              const newMonth = new Date(selectedMonth)
              newMonth.setMonth(newMonth.getMonth() + 1)
              // Basic validation: Allow navigation within 2024
              if (newMonth.getFullYear() === 2024 && newMonth.getMonth() <= 11) {
                setSelectedMonth(newMonth)
              }
            }}
          >
            <Ionicons name="chevron-forward" size={24} color="#015F45" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conditional Rendering: Loading State or Main Content */}
      {loading || userDataLoading ? (
        // Loading Indicator
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#015F45" />
          <Text style={styles.loadingText}>Loading your budget data...</Text>
        </View>
      ) : (
        // Main Content Area
        <>
          {/* Tab Navigation Header with conditional shadow */}
          <View style={[styles.pillTabContainer, hasScrolled && pillTabContainerWithShadow]}>
            <View style={styles.pillTabWrapper}>
              {/* Overview Tab Button */}
              <TouchableOpacity
                style={[styles.pillTab, activeTab === "overview" && styles.activePillTab]}
                onPress={() => switchTab("overview")} // Use switchTab to handle scroll reset
              >
                <View style={styles.tabIconTextContainer}>
                  <Ionicons
                    name="pie-chart-outline"
                    size={20}
                    color={activeTab === "overview" ? "#f3fee8" : "#015F45"} // Dynamic color
                  />
                  <Text style={[styles.pillTabText, activeTab === "overview" && styles.activePillTabText]}>
                    Overview
                  </Text>
                </View>
              </TouchableOpacity>
              {/* Transactions Tab Button */}
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
              {/* Settings Tab Button */}
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

          {/* --- Tab Content Rendering --- */}

          {/* Overview Tab */}
          {activeTab === "overview" ? (
            <ScrollView
              contentContainerStyle={styles.contentContainer}
              onScroll={handleScroll} // Attach scroll handler for shadow effect
              scrollEventThrottle={16} // Optimize scroll event frequency
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#015F45"]} />} // Pull-to-refresh
            >
              {/* Monthly Income/Expense/Net Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>Monthly Overview</Text>
                <View style={styles.summaryStats}>
                  {/* Income Stat */}
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatLabel}>Income</Text>
                    <Text style={[styles.summaryStatValue, { color: "#015F45" }]}>
                      {formatCurrency(incomeVsExpenses.totalIncome)}
                    </Text>
                  </View>
                  {/* Expenses Stat */}
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatLabel}>Expenses</Text>
                    <Text style={[styles.summaryStatValue, { color: "#000000" }]}>
                      {formatCurrency(incomeVsExpenses.totalExpenses)}
                    </Text>
                  </View>
                  {/* Net Stat */}
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatLabel}>Net</Text>
                    <Text
                      style={[
                        styles.summaryStatValue,
                        { // Dynamic color based on positive/negative net
                          color:
                            incomeVsExpenses.totalIncome - incomeVsExpenses.totalExpenses >= 0 ? "#015F45" : "#D9534F", // Green or Red
                        },
                      ]}
                    >
                      {formatCurrency(incomeVsExpenses.totalIncome - incomeVsExpenses.totalExpenses)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Spending by Category Section */}
              <View style={styles.chartSectionContainer}>
                <Text style={styles.sectionTitle}>Spending by Category</Text>
                <CustomPieChart /> {/* Render the custom pie chart visualization */}
              </View>

              {/* Budget Goals Progress Section */}
              <View style={styles.budgetGoalsContainer}>
                <View style={styles.budgetGoalsHeader}>
                  <Text style={styles.sectionTitle}>Budget Goals</Text>
                  {/* Button to navigate to settings tab */}
                  <TouchableOpacity style={styles.setBudgetButton} onPress={() => setActiveTab("settings")}>
                    <Ionicons name="settings-outline" size={18} color="#015F45" />
                  </TouchableOpacity>
                </View>

                {/* Conditional rendering: Show budget list or 'no budgets' message */}
                {categoryBudgets.filter((budget) => budget.budgetAmount > 0).length > 0 ? (
                  // List of budget goals
                  <View style={styles.budgetGoalsList}>
                    {categoryBudgets
                      .filter((budget) => budget.budgetAmount > 0) // Only show budgets with a set amount > 0
                      .map((budget) => {
                        // Find corresponding spending data for this category
                        const categorySpendingData = spendingByCategory.find((cat) => cat.name === budget.category)
                        const spent = categorySpendingData ? categorySpendingData.amount : 0 // Amount spent in this category
                        const progress = budget.budgetAmount > 0 ? Math.min(spent / budget.budgetAmount, 1) : 0 // Calculate progress (0-1)
                        const isOverBudget = spent > budget.budgetAmount // Check if over budget
                        const remaining = budget.budgetAmount - spent // Calculate remaining amount

                        return (
                          // Container for a single budget goal item
                          <View key={budget.category} style={styles.budgetGoalItem}>
                            {/* Header row: Icon, Category Name, Budget Amount */}
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

                            {/* Progress Bar Row */}
                            <View style={styles.budgetProgressRow}>
                              {/* Progress bar background */}
                              <View style={styles.progressBarContainer}>
                                {/* Progress bar fill, width based on progress, color changes if over budget */}
                                <View
                                  style={[
                                    styles.progressBar,
                                    { width: `${progress * 100}%` },
                                    isOverBudget && styles.overBudgetBar, // Apply red style if over budget
                                  ]}
                                />
                              </View>
                              {/* Text indicating amount remaining or overspent */}
                              <Text style={[styles.remainingBudget, isOverBudget && styles.overBudgetText]}>
                                {isOverBudget
                                  ? `Over ${formatCurrency(Math.abs(remaining))}`
                                  : `${formatCurrency(remaining)} Left`}
                              </Text>
                            </View>
                          </View>
                        )
                      })}
                  </View>
                ) : (
                  // Message shown when no budgets are set
                  <View style={styles.noBudgetsContainer}>
                    <Text style={styles.noBudgetsText}>No budget goals set yet.</Text>
                    <TouchableOpacity onPress={() => setActiveTab("settings")} style={styles.setGoalsButton}>
                      <Text style={styles.setGoalsText}>Set Budget Goals</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Daily Spending Line Chart Section */}
              <View style={styles.chartSectionContainer}>
                <Text style={styles.sectionTitle}>Daily Spending Trend</Text>
                {transactions.length > 0 ? ( // Only show chart if there are transactions
                  <View style={styles.lineChartContainer}>
                    <LineChart
                      data={dailySpending} // Data calculated in useMemo
                      width={width - 40} // Chart width (screen width minus padding)
                      height={220} // Chart height
                      chartConfig={lineChartConfig} // Configuration object
                      bezier // Use smooth curves
                      style={styles.lineChart}
                      fromZero // Start y-axis from zero
                      withInnerLines={false} // Hide inner grid lines
                      withOuterLines={true} // Show outer border lines
                      withHorizontalLabels={true} // Show y-axis labels
                      withVerticalLabels={true} // Show x-axis labels
                      withDots={true} // Show dots on data points (can be styled via propsForDots)
                      yAxisLabel="£" // Prefix for y-axis labels
                      yAxisInterval={5} // Interval for y-axis labels (adjust as needed)
                      // Click handler for data points to show tooltip
                      onDataPointClick={({ value, index }) => {
                        // Get the date corresponding to the clicked data point index
                        const day = index + 1 // Index is 0-based, day is 1-based
                        const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
                        const formattedDate = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })

                        // Show tooltip with value and date
                        setTooltipData({
                          visible: true,
                          value,
                          date: formattedDate,
                        })

                        // Automatically hide tooltip after 3 seconds
                        setTimeout(() => {
                          setTooltipData((prev) => ({ ...prev, visible: false }))
                        }, 3000)
                      }}
                      // Custom decorator to render the tooltip when visible
                      decorator={() => {
                        if (!tooltipData.visible) return null // Render nothing if tooltip is not visible

                        // Render the tooltip view
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
                    {/* Label below the chart indicating the month */}
                    <Text style={styles.chartXAxisLabel}>
                      {selectedMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                    </Text>
                  </View>
                ) : (
                  // Message shown if no daily spending data
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No daily spending data available</Text>
                  </View>
                )}
              </View>

              {/* Recent Transactions Preview Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                {/* Display the first 5 transactions */}
                {filteredTransactions.slice(0, 5).map((transaction) => (
                  <React.Fragment key={transaction.transaction_id}>
                    {renderTransactionItem({ item: transaction })}
                  </React.Fragment>
                ))}
                {/* Show "View All" button if there are more than 5 transactions */}
                {filteredTransactions.length > 5 && (
                  <TouchableOpacity style={styles.viewAllButton} onPress={() => setActiveTab("transactions")}>
                    <Text style={styles.viewAllText}>
                      View All Transactions for{" "}
                      {selectedMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#015F45" />
                  </TouchableOpacity>
                )}
                 {/* Show message if no transactions exist */}
                 {filteredTransactions.length === 0 && (
                   <Text style={styles.noTransactionsText}>No transactions found for this month.</Text>
                 )}
              </View>
            </ScrollView>

          /* Transactions Tab */
          ) : activeTab === "transactions" ? (
            <FlatList
              ref={flatListRef} // Assign ref for scroll control
              data={filteredTransactions} // Use the memoized filtered list
              renderItem={renderTransactionItem} // Function to render each item
              keyExtractor={(item) => item.transaction_id} // Unique key for items
              contentContainerStyle={styles.contentContainer} // Padding for content
              onScroll={handleScroll} // Attach scroll handler for header shadow
              scrollEventThrottle={16} // Optimize scroll event frequency
              // Component to show when the list is empty
              ListEmptyComponent={
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="receipt-outline" size={48} color="#cccccc" />
                  <Text style={styles.emptyStateText}>No transactions match your filters</Text>
                </View>
              }
              // Header component containing filter buttons
              ListHeaderComponent={
                <View style={styles.filtersContainer}>
                  <View style={styles.filterButtons}>
                    {/* All Filter Button */}
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
                    {/* Income Filter Button */}
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
                    {/* Expenses Filter Button */}
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
                  {/* Search Input - Conditionally rendered or always visible */}
                  <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="#6C757D" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search description, merchant..."
                      placeholderTextColor="#999"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {/* Clear search button appears when query is not empty */}
                    {searchQuery ? (
                      <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchButton}>
                        <Ionicons name="close-circle" size={20} color="#6C757D" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              }
              // Pull-to-refresh configuration
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#015F45"]} />}
            />

          /* Settings Tab */
          ) : (
            <ScrollView
              contentContainerStyle={styles.contentContainer}
              onScroll={handleScroll} // Attach scroll handler
              scrollEventThrottle={16} // Optimize scroll events
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#015F45"]} />} // Pull-to-refresh
            >
              {/* Container for settings content */}
              <View style={styles.settingsContainer}>
                <Text style={styles.settingsTitle}>Budget Settings</Text>
                <Text style={styles.settingsDescription}>
                  Set monthly spending limits for each category to help manage your finances. Tap a category to set or edit its budget.
                </Text>

                {/* List of budget categories */}
                <View style={styles.budgetCategoriesList}>
                  {/* Map through defined expense categories to create list items */}
                  {EXPENSE_CATEGORIES.map((category) => {
                    // Find the current budget amount for this category
                    const budget = categoryBudgets.find((b) => b.category === category)
                    const budgetAmountValue = budget ? budget.budgetAmount : 0 // Default to 0 if not set

                    return (
                      // Touchable item for each category
                      <TouchableOpacity
                        key={category}
                        style={styles.budgetCategoryItem}
                        onPress={() => openBudgetModal(category)} // Open modal on press
                      >
                        {/* Left side: Icon and Category Name */}
                        <View style={styles.budgetCategoryLeft}>
                          <Ionicons
                            name={getCategoryIcon(category)}
                            size={24}
                            color="#015F45"
                            style={styles.budgetCategoryIcon}
                          />
                          <Text style={styles.budgetCategoryName}>{category}</Text>
                        </View>
                        {/* Right side: Budget Amount and Chevron */}
                        <View style={styles.budgetCategoryRight}>
                          <Text style={styles.budgetCategoryAmount}>
                            {/* Display formatted amount or "Set budget" prompt */}
                            {budgetAmountValue > 0 ? formatCurrency(budgetAmountValue) : "Set budget"}
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

      {/* --- Modals --- */}

      {/* Budget Setting Modal */}
      <Modal
        visible={showBudgetModal}
        transparent={true} // Allows overlay background
        animationType="slide" // Animation style
        onRequestClose={() => setShowBudgetModal(false)} // Handle back button on Android
      >
        {/* Semi-transparent background overlay */}
        <View style={styles.modalOverlay}>
          {/* Main modal content container */}
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Budget for {selectedCategory}</Text>
              {/* Close Button */}
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowBudgetModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Modal Body - Input Area */}
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Monthly Budget Amount</Text>
              {/* Input container with currency symbol */}
              <View style={styles.chatInputContainer}>
                <Text style={styles.currencySymbol}>£</Text>
                <TextInput
                  style={styles.chatBudgetInput}
                  value={budgetAmount}
                  onChangeText={setBudgetAmount} // Update state on text change
                  keyboardType="numeric" // Use numeric keyboard
                  placeholder="0.00" // Placeholder text
                  placeholderTextColor="#999"
                  autoFocus // Automatically focus the input field
                />
              </View>
            </View>

            {/* Modal Footer - Action Buttons */}
            <View style={styles.modalFooter}>
              {/* Cancel Button */}
              <TouchableOpacity style={styles.cancelChatButton} onPress={() => setShowBudgetModal(false)}>
                <Text style={styles.cancelChatButtonText}>Cancel</Text>
              </TouchableOpacity>
              {/* Save Button */}
              <TouchableOpacity style={styles.saveChatButton} onPress={handleUpdateBudget}>
                <Text style={styles.saveChatButtonText}>Save Budget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent={true} // Overlay background
        animationType="fade" // Fade animation
        onRequestClose={() => setShowMonthPicker(false)} // Android back button
      >
        {/* Semi-transparent background overlay */}
        <View style={styles.modalOverlay}>
          {/* Content container for the month picker */}
          <View style={styles.monthPickerContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month (2024)</Text>
              {/* Close Button */}
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowMonthPicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Grid layout for month selection */}
            <View style={styles.monthGrid}>
              {/* Generate buttons for each month of 2024 */}
              {Array.from({ length: 12 }, (_, i) => {
                const monthDate = new Date(2024, i, 1) // Date object for the month
                const monthName = monthDate.toLocaleDateString("en-GB", { month: "short" }) // Short month name (e.g., "Nov")
                const isSelected = selectedMonth.getMonth() === i // Check if this month is currently selected

                return (
                  // Touchable button for each month
                  <TouchableOpacity
                    key={i}
                    // Apply conditional styling if selected
                    style={[styles.monthGridItem, isSelected && styles.selectedMonthGridItem]}
                    onPress={() => {
                      // Set the selected month and close the picker
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

// --- Styles ---
const styles = StyleSheet.create({
  // --- Main Layout & Containers ---
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Light background for the whole screen
  },
  contentContainer: {
    paddingBottom: 80, // Ensure space at the bottom, below tabs/footer
    paddingHorizontal: 16, // Horizontal padding for content sections
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#343a40",
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6c757d",
  },
  sectionContainer: {
    marginBottom: 24, // Space below sections like Recent Transactions
  },
  chartSectionContainer: {
    backgroundColor: "#ffffff", // White background for chart sections
    borderRadius: 12,
    padding: 16,
    marginBottom: 20, // Space below chart sections
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  noDataContainer: {
    paddingVertical: 30,
    alignItems: "center",
  },
  noDataText: {
    fontSize: 14,
    color: "#6c757d",
  },
  emptyStateContainer: { // For empty transaction list
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 200, // Ensure it takes some space
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6c757d",
    marginTop: 16,
    textAlign: "center",
  },
  noTransactionsText: { // Text when no transactions in overview preview
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },

  // --- Header ---
  headerContainer: {
    backgroundColor: "#ffffff", // White header background
    paddingTop: 10, // Adjust as needed
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef", // Light border
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#343a40",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 10,
  },
  monthSelectorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  monthArrowButton: {
    padding: 8, // Increase touchable area
  },
  monthButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#e0f2e3", // Light green background
    borderRadius: 20,
  },
  monthButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#015F45", // Bankable green text
  },

  // --- Tab Navigation ---
  pillTabContainer: {
    backgroundColor: "#ffffff", // Background for the tab area
    paddingVertical: 8,
    paddingHorizontal: 16,
    // Position sticky/fixed if needed, or rely on scroll behavior
    zIndex: 10, // Ensure tabs are above content
    // Conditional shadow is applied dynamically
  },
  pillTabWrapper: {
    flexDirection: "row",
    backgroundColor: "#e9ecef", // Background of the pill container itself
    borderRadius: 25, // Fully rounded ends
    overflow: "hidden", // Clip children to rounded corners
    padding: 4, // Inner padding around buttons
  },
  pillTab: {
    flex: 1, // Each tab takes equal width
    paddingVertical: 10,
    borderRadius: 20, // Rounded corners for individual tabs (matches wrapper)
    alignItems: "center",
    justifyContent: "center",
  },
  activePillTab: {
    backgroundColor: "#015F45", // Bankable green for active tab background
  },
  tabIconTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pillTabText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
    color: "#495057", // Default text color
  },
  activePillTabText: {
    color: "#ffffff", // White text for active tab
  },
  pillTabContainerWithShadow: { // Style for shadow when scrolled
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  // --- Overview Tab: Summary Card ---
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#343a40",
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around", // Distribute items evenly
  },
  summaryStatItem: {
    alignItems: "center",
    flex: 1, // Allow items to take equal space
  },
  summaryStatLabel: {
    fontSize: 13,
    color: "#6c757d",
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: "bold",
  },

  // --- Overview Tab: Custom Pie Chart ---
  pieChartContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  pieChartVisualContainer: {
    width: width - 80, // Container width based on screen width
    height: 200, // Fixed height for the visualization area
    justifyContent: "center",
    alignItems: "center",
    position: "relative", // Needed for absolute positioning of segments
    marginBottom: 10, // Space between visual and legend
  },
  pieChartSegment: {
    // Base style for the circles, specific position/scale applied dynamically
  },
  pieChartCenterText: {
    position: "absolute", // Position in the center
    fontSize: 18,
    fontWeight: "bold",
    color: "#015F45",
  },
  pieChartLegendContainer: {
    width: "100%", // Take full width of the chart section container
    marginTop: 10,
  },
  pieChartLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Space out elements in the row
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef", // Light separator line
  },
  legendColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  pieChartLegendText: {
    flex: 1, // Allow text to take available space
    fontSize: 14,
    color: "#343a40",
  },
  pieChartLegendAmount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
  },

  // --- Overview Tab: Budget Goals ---
  budgetGoalsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetGoalsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  setBudgetButton: {
    padding: 4, // Increase touch area
  },
  budgetGoalsList: {
    // Container for the list of budget items
  },
  budgetGoalItem: {
    marginBottom: 16, // Space between budget items
  },
  budgetGoalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  budgetCategoryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetCategoryIcon: {
    marginRight: 8,
  },
  budgetGoalCategory: {
    fontSize: 15,
    fontWeight: "500",
    color: "#343a40",
  },
  budgetGoalAmount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6c757d",
  },
  budgetProgressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBarContainer: {
    flex: 1, // Take most of the space
    height: 8,
    backgroundColor: "#e9ecef", // Background of the progress bar
    borderRadius: 4,
    marginRight: 10,
    overflow: "hidden", // Clip the progress fill
  },
  progressBar: {
    height: 8,
    backgroundColor: "#52B788", // Default progress bar color (medium green)
    borderRadius: 4,
  },
  overBudgetBar: {
    backgroundColor: "#e76f51", // Red/Orange color when over budget
  },
  remainingBudget: {
    fontSize: 12,
    color: "#6c757d",
    minWidth: 80, // Ensure enough space for text
    textAlign: "right",
  },
  overBudgetText: {
    color: "#e76f51", // Red/Orange text when over budget
    fontWeight: "500",
  },
  noBudgetsContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noBudgetsText: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 12,
  },
  setGoalsButton: {
    backgroundColor: "#e0f2e3",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  setGoalsText: {
    color: "#015F45",
    fontWeight: "600",
    fontSize: 14,
  },

  // --- Overview Tab: Daily Spending Chart ---
  lineChartContainer: {
    alignItems: "center", // Center the chart
    marginTop: 10,
  },
  lineChart: {
    borderRadius: 8, // Rounded corners for the chart background
  },
  chartXAxisLabel: { // Label below the line chart
    marginTop: 8,
    fontSize: 12,
    color: "#6c757d",
  },
  tooltipContainer: { // Position container for the tooltip
    position: 'absolute', // Needed for decorator positioning
    // Adjust top/left based on where you want the tooltip relative to the point
    // This might need dynamic calculation based on the clicked point's coordinates
    // For simplicity, placing it slightly above the center for now
    left: width / 2 - 50, // Example positioning
    top: 80, // Example positioning
    zIndex: 10, // Ensure tooltip is above chart lines/dots
  },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent black background
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tooltipAmount: {
    color: '#ffffff', // White text
    fontWeight: 'bold',
    fontSize: 14,
  },
  tooltipDate: {
    color: '#ffffff', // White text
    fontSize: 12,
    marginTop: 2,
  },

  // --- Overview Tab: Recent Transactions Preview ---
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    color: "#015F45",
    fontWeight: "600",
    marginRight: 4,
  },

  // --- Transactions Tab ---
  filtersContainer: {
    paddingVertical: 10,
    paddingBottom: 15, // Add space below filters/search
    backgroundColor: "#f8f9fa", // Match screen background
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "center", // Center filter buttons
    marginBottom: 15, // Space below filter buttons
  },
  categoryFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e9ecef", // Default background
    marginHorizontal: 5,
  },
  categoryFilterButtonActive: {
    backgroundColor: "#015F45", // Active background color
  },
  categoryFilterText: {
    color: "#495057", // Default text color
    fontWeight: "500",
  },
  categoryFilterTextActive: {
    color: "#ffffff", // Active text color
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff", // White background for search bar
    borderRadius: 25, // Rounded corners
    paddingHorizontal: 15,
    marginHorizontal: 5, // Align with filter button margins
    height: 45, // Fixed height
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1, // Take available space
    fontSize: 15,
    color: "#333",
  },
  clearSearchButton: {
    padding: 5, // Increase touchable area
  },
  transactionCard: { // Style for individual transaction items
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIconContainer: {
    backgroundColor: "#e0f2e3", // Light green background for icon
    borderRadius: 20, // Circular background
    padding: 8,
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1, // Take remaining space
    marginRight: 8,
  },
  transactionMerchant: {
    fontSize: 15,
    fontWeight: "500",
    color: "#343a40",
  },
  transactionCategory: {
    fontSize: 13,
    color: "#6c757d",
    marginTop: 2,
  },
  transactionAccount: {
    fontSize: 12,
    color: "#adb5bd", // Lighter gray for account name
    marginTop: 2,
  },
  transactionAmounts: {
    alignItems: "flex-end", // Align amount to the right
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "bold",
  },

  // --- Settings Tab ---
  settingsContainer: {
    paddingVertical: 10, // Padding top/bottom for settings content
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 8,
  },
  settingsDescription: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 20,
    lineHeight: 20,
  },
  budgetCategoriesList: {
    // Container for the list of categories in settings
  },
  budgetCategoryItem: { // Style for each category row in settings
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  budgetCategoryLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetCategoryName: {
    fontSize: 16,
    color: "#343a40",
  },
  budgetCategoryRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetCategoryAmount: {
    fontSize: 15,
    color: "#6c757d",
    marginRight: 8,
  },

  // --- Modals (General) ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Darker overlay
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#343a40",
  },
  modalCloseButton: {
    padding: 5, // Increase touch area
  },

  // --- Budget Setting Modal ---
  modalContent: { // Specific style for budget modal content area
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 8,
  },
  chatInputContainer: { // Renamed from budgetInputContainer for consistency
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa", // Light background for input area
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  currencySymbol: {
    fontSize: 18,
    color: "#495057",
    marginRight: 5,
  },
  chatBudgetInput: { // Renamed from modalInput
    flex: 1,
    fontSize: 18,
    color: "#343a40",
    paddingVertical: 12,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end", // Align buttons to the right
  },
  cancelChatButton: { // Renamed from modalCancelButton
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelChatButtonText: { // Renamed from modalCancelButtonText
    color: "#6c757d",
    fontWeight: "500",
    fontSize: 16,
  },
  saveChatButton: { // Renamed from modalSaveButton
    backgroundColor: "#015F45", // Bankable green
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveChatButtonText: { // Renamed from modalSaveButtonText
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },

  // --- Month Picker Modal ---
  monthPickerContent: { // Specific style for month picker content area
    width: "85%",
    maxWidth: 350,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap", // Allow items to wrap to the next line
    justifyContent: "center", // Center items horizontally
    marginTop: 10,
  },
  monthGridItem: {
    width: "30%", // Roughly 3 items per row with spacing
    aspectRatio: 1.5, // Make items slightly wider than tall
    justifyContent: "center",
    alignItems: "center",
    margin: 5, // Spacing between items
    backgroundColor: "#f8f9fa", // Default background
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  selectedMonthGridItem: {
    backgroundColor: "#015F45", // Bankable green for selected month
    borderColor: "#015F45",
  },
  monthGridText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#495057", // Default text color
  },
  selectedMonthGridText: {
    color: "#ffffff", // White text for selected month
  },
})

export default DynamicBudgetCalendarScreen