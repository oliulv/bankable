/**
 * @file HomeScreen.tsx
 * This file defines the main home screen component for the Bankable app.
 * It displays user account information, widgets for various features (transactions, savings, actions, etc.),
 * and allows users to customize the layout and visibility of these widgets.
 *
 * @module HomeScreen
 */

"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  Modal,
  Platform,
  UIManager,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "../context/UserContext" // Context for user data (accounts, name, etc.)
import { useRouter } from "expo-router" // Navigation hook
import { getAccountTransactions } from "../api/userData" // API function to fetch transactions
import { BlurView } from "expo-blur" // Component for blurred backgrounds (used in modals)
import { useScrollStatus } from "./_layout" // Custom hook to track scroll status for header effects
import { useEditMode } from "../context/EditModeContext" // Context for managing home screen edit mode
import { Image as ExpoImage } from "expo-image" // Optimized image component
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist" // Library for drag-and-drop lists

// Enable LayoutAnimation for Android for smoother UI transitions
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// --- Constants ---

/** Screen width used for layout calculations (e.g., card width). */
const { width: screenWidth } = Dimensions.get("window")
/** Width of the account cards displayed in the horizontal FlatList. */
const CARD_WIDTH = screenWidth * 0.85
/** Horizontal spacing around the account cards. */
const SPACING = (screenWidth - CARD_WIDTH) / 2
/** Height of the account cards. */
const CARD_HEIGHT = 200

/** Key used for storing and retrieving the user's widget configuration in AsyncStorage. */
const WIDGET_CONFIG_STORAGE_KEY = "home_screen_widget_config"

// --- Interfaces & Types ---

/** Defines the structure for a formatted transaction object used within the component. */
interface Transaction {
  id: number;                               // Unique identifier (often index in the formatted list)
  name: string;                             // Transaction description or merchant name
  date: string;                             // Formatted transaction date string
  amount: string;                           // Formatted transaction amount string (e.g., "£12.34")
  icon: keyof typeof Ionicons.glyphMap;     // Name of the Ionicons icon for the category
  type: "inflow" | "outflow";               // Type of transaction (income or expense)
}

/** Defines the structure for storing the configuration of a single widget on the home screen. */
interface WidgetConfig {
  id: string;                               // Unique identifier for the widget instance
  type: string;                             // Type identifier (e.g., "transactions", "investments")
  title: string;                            // Display title of the widget
  order: number;                            // Display order on the screen (lower numbers first)
  visible: boolean;                         // Whether the widget is currently shown
  removable?: boolean;                      // Whether the user can hide this widget (defaults to false if undefined)
  screenLink?: string;                      // Optional route to navigate to when the widget is pressed (e.g., "/InvestmentsScreen")
}

/** Defines the structure for describing an available widget that the user can add to their home screen. */
interface AvailableWidget {
  id: string;                               // Unique identifier for the available widget type
  type: string;                             // Type identifier (matches WidgetConfig.type)
  title: string;                            // Default title for this widget type
  description: string;                      // Description shown in the widget picker modal
  icon: keyof typeof Ionicons.glyphMap;     // Icon representing the widget type
  preview: React.ReactNode;                 // React component used to render a preview in the picker modal
  screenLink?: string;                      // Optional route associated with this widget type
}

// --- Mappings & Data ---

/** Maps account product types (strings) to local image assets for the card backgrounds. */
const productTypeToImage: Record<string, any> = {
  "Personal Current Account": require("../assets/images/carddesign.png"),
  Savings: require("../assets/images/carddesign.png"),
  "Credit Card": require("../assets/images/carddesign.png"),
  Overdraft: require("../assets/images/carddesign.png"),
}

/** Maps transaction category strings (normalized to lowercase) to Ionicons icon names. */
const categoryToIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  food: "fast-food-outline",
  shopping: "cart-outline",
  "monthly income": "trending-up-outline",
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

/** Array of daily financial affirmations displayed randomly in the affirmation widget. */
const dailyAffirmations = [
  "Your financial choices today shape your tomorrow. You're on the right path!",
  "Small steps toward financial goals create big changes over time.",
  "You are building wealth with every mindful decision you make.",
  "Financial freedom is a journey, not a destination. Enjoy the process.",
  "Today's discipline becomes tomorrow's financial security.",
]

// --- Helper Functions ---

/**
 * Gets an appropriate Ionicons icon name for a given transaction category string.
 * Uses case-insensitive matching and partial matching for robustness.
 * @param {string} category - The transaction category string.
 * @returns {keyof typeof Ionicons.glyphMap} The name of the Ionicons icon.
 */
const getIconForCategory = (category: string): keyof typeof Ionicons.glyphMap => {
  // Normalize category to lowercase for case-insensitive matching
  const normalizedCategory = category?.toLowerCase()?.trim() || ""

  // Try direct match
  if (categoryToIcon[normalizedCategory]) {
    return categoryToIcon[normalizedCategory]
  }

  // Try to find partial matches (e.g., "grocery shopping" matches "shopping")
  for (const [key, icon] of Object.entries(categoryToIcon)) {
    if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
      return icon
    }
  }

  // Default fallback icon if no match is found
  return "card-outline"
}

/**
 * Formats a numerical amount into a currency string (e.g., £12.34).
 * Always shows the absolute value with the currency symbol.
 * @param {number} amount - The numerical amount to format.
 * @returns {string} The formatted currency string.
 */
const formatCurrency = (amount: number): string => {
  return `£${Math.abs(amount).toFixed(2)}`
}

// --- Styles ---
const styles = StyleSheet.create({
  // Main container for the ScrollView content
  container: {
    paddingBottom: 32, // Space at the bottom
    backgroundColor: "#ffffff", // Default background color
  },
  // Style for mini progress bars used in widget previews
  miniProgressBar: {
    height: 4,
    backgroundColor: "#f0f0f0", // Background color of the bar track
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden", // Clip the fill part
  },
  // Style for the fill part of the mini progress bar
  miniProgressFill: {
    height: "100%",
    backgroundColor: "#015F45", // Bankable green fill color
    borderRadius: 2,
  },
  // Title style within widget previews
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  // Content container style within widget previews
  previewContent: {
    flexDirection: "column",
    gap: 8, // Spacing between elements
    minHeight: 100, // Ensure a minimum height for the preview area
  },
  // Container for the account cards section (FlatList)
  accountCardsSection: {
    width: "100%",
  },
  // Container for a single widget preview item in the picker modal
  widgetPreview: {
    padding: 16,
    backgroundColor: "#f3fee8", // Light mint green background
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01, // Very subtle shadow
    shadowRadius: 4,
    elevation: 2, // Android shadow
  },
  // Utility style to center content vertically and horizontally
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  // Style for the green header section (currently not used, but kept for potential future use)
  welcomeHeader: {
    backgroundColor: "#015F45",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  // Style for the main welcome text (currently not used)
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  // Style for the subtext in the welcome header (currently not used)
  welcomeSubtext: {
    fontSize: 16,
    color: "#e0e0e0",
    marginTop: 4,
  },
  // Container for the horizontal account card FlatList
  swipeableContainer: {
    height: CARD_HEIGHT + 20, // Height includes card + potential padding/margin
    marginBottom: 16, // Space below the card section
  },
  // Style for the placeholder shown when no account cards are available
  nocarddesign: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: SPACING, // Align with card spacing
    backgroundColor: "#ffffff", // White background
  },
  // Text style for the "No accounts found" message
  noAccountText: {
    fontSize: 16,
    color: "#666",
  },
  // Generic text style for empty states (e.g., no transactions)
  emptyText: {
    textAlign: "center",
    padding: 20,
    color: "#666",
  },
  // Container for the pagination dots below the account cards
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  // Style for inactive pagination dots
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc", // Light gray
    marginHorizontal: 3,
  },
  // Style for the active pagination dot
  paginationDotActive: {
    backgroundColor: "#015F45", // Bankable green
    width: 10, // Slightly larger
    height: 10,
    borderRadius: 5,
  },
  // Style for individual account cards in the FlatList
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: 4, // Small space between cards
    borderRadius: 16,
    overflow: "hidden", // Clip the background image
    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  // Style for the background image of the account card
  cardImage: {
    ...StyleSheet.absoluteFillObject, // Fill the card container
    width: "100%",
    height: "100%",
  },
  // Transparent overlay on the card (can be used for gradients or effects)
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0)", // Currently fully transparent
  },
  // Container for the text content overlayed on the account card
  headerCardContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingLeft: 26, // Specific padding for card design
    padding: 16,
    justifyContent: "center", // Center content vertically
  },
  // Style for the row containing account type/number (currently hidden in UI)
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  // Style for the account type text on the card
  accountType: {
    fontSize: 18,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 4,
  },
  // Style for the account number text on the card
  accountNumber: {
    fontSize: 14,
    color: "#fff",
    paddingBottom: 14, // Specific padding for card design
  },
  // Style for the balance text on the card
  balance: {
    fontSize: 32,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 12,
  },
  // Container for all the widgets below the account cards
  widgetsContainer: {
    paddingHorizontal: 16, // Horizontal padding for widgets
  },
  // Container for a single widget, including edit controls overlay
  widgetContainer: {
    position: "relative", // Needed for absolute positioning of controls
    marginBottom: 16, // Space below each widget
    backgroundColor: "#f3fee8", // Default background for widgets
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2, // Android shadow
  },
  // Style for the drag handle icon in edit mode (currently not used directly on widget)
  dragHandle: {
    padding: 4,
    marginRight: 8,
  },
  // Style for the remove widget button (X icon) in edit mode
  removeHandle: {
    padding: 4, // Touch area
  },
  // Generic container style for a widget's content section
  section: {
    backgroundColor: "#f3fee8", // Light mint green background
    borderRadius: 16, // Match widget container rounding
    padding: 16, // Inner padding
  },
  // Title style for widget sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700", // Bold title
    color: "#333",
    marginBottom: 12,
  },
  // Subtitle style (e.g., below section title)
  subTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  // Style for the affirmation widget section (currently not a separate widget)
  affirmationSection: {
    backgroundColor: "#f3fee8",
    borderRadius: 16,
    padding: 16,
  },
  // Style for the box containing the affirmation text
  affirmationBox: {
    backgroundColor: "#f3fee8", // Match section background
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  // Style for the affirmation text itself
  affirmationText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#333",
    textAlign: "center",
    lineHeight: 24, // Improve readability
  },
  // Style for a single transaction item row within the 'Recent Transactions' widget
  transactionItem: {
    backgroundColor: "#f3fee8", // Match section background
    borderRadius: 8,
    padding: 12,
    marginBottom: 8, // Space between transactions
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // Container for the left side of a transaction row (icon, name, date)
  transactionDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  // Style for the transaction name/description
  transactionName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  // Style for the transaction date
  transactionDate: {
    fontSize: 12,
    color: "#888", // Lighter gray
  },
  // Style for the transaction amount text
  transactionAmount: {
    fontSize: 14,
    fontWeight: "700", // Bold amount
  },
  // Style for inflow (income) amounts
  inflow: {
    color: "#015F45", // Bankable green
  },
  // Style for outflow (expense) amounts
  outflow: {
    color: "#333", // Default dark text color
  },
  // Style for a row within the 'Group Saving Goals' widget
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  // Style for the goal name text
  goalName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  // Style for the goal percentage text
  goalPercent: {
    fontSize: 14,
    fontWeight: "500",
    color: "#015F45", // Bankable green
  },
  // Style for the background track of the goal progress bar
  progressBarBackground: {
    height: 8,
    backgroundColor: "#eee", // Light gray track
    borderRadius: 4,
    overflow: "hidden", // Clip the fill
  },
  // Style for the fill part of the goal progress bar
  progressBarFill: {
    height: "100%",
    backgroundColor: "#015F45", // Bankable green fill
    borderRadius: 4,
  },
  // Style for the insights box (currently not used as a separate widget)
  insightsBox: {
    backgroundColor: "#f3fee8",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  // Style for the text within the insights box
  insightsText: {
    flex: 1, // Take available space
    fontSize: 14,
    color: "#333",
  },
  // Container for the 'Quick Actions' widget buttons
  quickActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap", // Allow buttons to wrap to the next line
    justifyContent: "space-between", // Space out buttons
  },
  // Style for individual quick action buttons
  quickActionButton: {
    width: "48%", // Approximately two buttons per row
    backgroundColor: "#f3fee8", // Match section background
    borderRadius: 8,
    padding: 12,
    alignItems: "center", // Center icon and text
    marginBottom: 8, // Space below buttons
  },
  // Style for the text below the quick action icons
  quickActionText: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  // Style for the "View all transactions" button
  viewAllButton: {
    marginTop: 12,
    alignItems: "center",
  },
  // Style for the text of the "View all transactions" button
  viewAllText: {
    fontSize: 14,
    color: "#015F45", // Bankable green
    fontWeight: "500",
  },
  // Container for the floating "Add Widget" button (visible in edit mode)
  addButtonContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1000, // Ensure it's above other content
  },
  // Style for the floating "Add Widget" button itself
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28, // Circular
    backgroundColor: "#006a4d", // Darker green
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5, // Android shadow
  },
  // Container for modal content (fills the screen, used with BlurView)
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end", // Position modal content at the bottom
  },
  // Container for the widget picker modal's content area
  widgetPickerContainer: {
    backgroundColor: "#fff", // White background
    borderTopLeftRadius: 20, // Rounded top corners
    borderTopRightRadius: 20,
    padding: 20,
    height: "70%", // Take 70% of screen height
  },
  // Container for a single widget preview item in the picker list
  widgetPreviewContainer: {
    width: screenWidth - 40, // Full width minus padding
    padding: 16,
    marginRight: 16, // Space for horizontal list if used
    backgroundColor: "#f3fee8", // Light mint green background
    borderRadius: 12,
  },
  // Container for the content within a widget preview item (icon + title)
  widgetPreviewContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  // Style for the widget title in the picker modal
  widgetTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  // Style for the widget description in the picker modal
  widgetDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginLeft: 32, // Indent description below icon
  },
  // Style for the modal title text (used in picker and reorder modals)
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  // Style for the close button (X icon) in modals
  closeModalButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10, // Ensure it's above other modal content
  },
  // Container for the edit controls (drag handle, remove button) overlayed on widgets
  widgetControls: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10, // Ensure controls are above widget content
  },
  // Generic container for the main content area within a widget
  widgetContent: {
    padding: 16,
  },
  // Style for the icon preview in the widget picker list
  widgetIconPreview: {
    width: 40,
    height: 40,
    borderRadius: 20, // Circular
    backgroundColor: "transparent", // No background, just icon
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  // Header container within widget previews (icon + title/subtitle)
  widgetPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  // Title style within widget previews
  widgetPreviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  // Subtitle style within widget previews
  widgetPreviewSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  // Container for data rows within widget previews
  widgetPreviewData: {
    marginTop: 8,
  },
  // Style for a single data row (label + value) in widget previews
  widgetPreviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  // Style for the label part of a data row in widget previews
  widgetPreviewLabel: {
    fontSize: 12,
    color: "#666",
  },
  // Style for the value part of a data row in widget previews
  widgetPreviewValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  // Style for buttons within widget previews (e.g., "View Loans")
  widgetPreviewButton: {
    backgroundColor: "#f0f0f0", // Light gray background
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    marginTop: 8,
  },
  // Style for the text of buttons within widget previews
  widgetPreviewButtonText: {
    fontSize: 12,
    color: "#015F45", // Bankable green
    fontWeight: "500",
  },
  // Dashed border overlay shown on widgets in edit mode
  editModeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.05)", // Slight dimming effect
    borderRadius: 16, // Match widget rounding
    borderWidth: 2,
    borderColor: "#015F45", // Bankable green border
    borderStyle: "dashed",
    zIndex: 5, // Above widget content, below controls
  },
  // Style for the "Reorder Widgets" button shown in edit mode
  reorderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#015F45", // Bankable green
    borderRadius: 8,
    padding: 12, // Increased padding
    marginVertical: 16, // Increased spacing
    marginBottom: 24, // Extra bottom margin
  },
  // Style for the text of the "Reorder Widgets" button
  reorderButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
    fontSize: 16, // Increased font size
  },
  // --- Drag and drop styles for reorder modal ---
  // Style for a single draggable item in the reorder list
  draggableItem: {
    padding: 16,
    backgroundColor: "#f3fee8", // Light mint green background
    borderRadius: 12,
    marginBottom: 12, // Space between items
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, // Android shadow
  },
  // Style applied to the item being actively dragged
  draggingItem: {
    opacity: 0.7, // Make it slightly transparent
    transform: [{ scale: 1.05 }], // Scale it up slightly
    shadowOpacity: 0.2, // Increase shadow intensity
    elevation: 5, // Increase Android shadow
  },
  // Style for the drag handle icon (menu icon)
  dragHandleIcon: {
    marginRight: 12,
  },
  // Container for the draggable list in the reorder modal
  reorderListContainer: {
    flex: 1, // Take remaining space in the modal
  },
  // Instructional text shown above the reorder list
  reorderInstructions: {
    textAlign: "center",
    color: "#666",
    marginBottom: 16,
    fontStyle: "italic",
  },
  // Style for the "Apply Changes" button in the reorder modal
  applyChangesButton: {
    backgroundColor: "#015F45", // Bankable green
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 20,
  },
  // Style for the text of the "Apply Changes" button
  applyChangesText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 16,
  },
})

// --- Placeholder Preview Components ---
// These components render mock previews for widgets in the "Add Widget" modal.

/** Renders a preview for the Dynamic Budget widget. */
const DynamicBudgetPreview = () => {
  // Mock data for preview
  const mockBudgetData = {
    totalBudget: 1000,
    totalSpent: 650,
  }

  return (
    <View style={styles.widgetPreview}>
      <Text style={styles.previewTitle}>Budget Overview</Text>
      <View style={styles.previewContent}>
        <Text>Total Budget: £{mockBudgetData.totalBudget}</Text>
        <Text>Spent: £{mockBudgetData.totalSpent}</Text>
        <View style={styles.miniProgressBar}>
          <View
            style={[
              styles.miniProgressFill,
              { width: `${(mockBudgetData.totalSpent / mockBudgetData.totalBudget) * 100}%` },
            ]}
          />
        </View>
      </View>
    </View>
  )
}

/** Renders a preview for the Investment Portfolio widget. */
const InvestmentPreview = () => {
  const mockData = {
    totalValue: 12450.75,
    performance: 5.2,
    topHolding: "Tech ETF",
  }

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
          <Text style={[styles.widgetPreviewValue, { color: mockData.performance > 0 ? "#4CAF50" : "#F44336" }]}>
            {mockData.performance > 0 ? "+" : ""}
            {mockData.performance}%
          </Text>
        </View>
        <View style={styles.widgetPreviewRow}>
          <Text style={styles.widgetPreviewLabel}>Top Holding</Text>
          <Text style={styles.widgetPreviewValue}>{mockData.topHolding}</Text>
        </View>
      </View>
    </View>
  )
}

/** Renders a preview for the Active Loans widget. */
const LoansPreview = () => {
  const mockData = {
    totalLoans: 3,
    nextPayment: 532.5,
    dueDate: "May 15",
  }

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
  )
}

/** Renders a preview for the Group Savings widget. */
const GroupSavingsPreview = () => {
  const mockData = {
    activeGoals: 2,
    totalSaved: 1850,
    targetAmount: 2500,
  }

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
          <Text style={styles.widgetPreviewValue}>
            {Math.round((mockData.totalSaved / mockData.targetAmount) * 100)}%
          </Text>
        </View>
      </View>
      <View style={styles.miniProgressBar}>
        <View style={[styles.miniProgressFill, { width: `${(mockData.totalSaved / mockData.targetAmount) * 100}%` }]} />
      </View>
    </View>
  )
}

/** Renders a preview for the Market Watch (Stock Prices) widget. */
const StockPricePreview = () => {
  const mockData = {
    stocks: [
      { symbol: "AAPL", price: 182.63, change: 1.2 },
      { symbol: "MSFT", price: 417.88, change: -0.5 },
      { symbol: "GOOGL", price: 165.27, change: 0.8 },
    ],
  }

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
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.widgetPreviewValue}>£{stock.price}</Text>
              <Text
                style={{
                  fontSize: 12,
                  marginLeft: 4,
                  color: stock.change > 0 ? "#4CAF50" : "#F44336", // Green for positive, red for negative
                }}
              >
                {stock.change > 0 ? "+" : ""}
                {stock.change}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

/** Renders a preview for the Virtual Pet widget. */
const VirtualPetPreview = () => {
  const mockData = {
    petName: "Finny",
    health: 85,
    happiness: 92,
    level: 4,
  }

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
  )
}

/** Renders a preview for the Eco Impact widget. */
const EcoImpactPreview = () => {
  const mockData = {
    carbonSaved: 247.8,
    ecoTransactions: 15,
    treesSaved: 5.2,
  }

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
  )
}

// --- Available Widgets Definition ---
/**
 * Array defining all widgets that can potentially be added to the home screen.
 * Includes configuration and preview components for the widget picker modal.
 */
const availableWidgets: AvailableWidget[] = [
  {
    id: "budget-calendar",
    type: "calendar",
    title: "Budget Calendar",
    description: "Track your spending with a dynamic calendar view",
    icon: "calendar",
    preview: <DynamicBudgetPreview />,
    screenLink: "/BudgetingScreen",
  },
  {
    id: "investments",
    type: "investments",
    title: "Investment Portfolio",
    description: "Quick view of your investment performance",
    icon: "trending-up",
    preview: <InvestmentPreview />,
    screenLink: "/InvestmentsScreen",
  },
  {
    id: "loans",
    type: "loans",
    title: "Active Loans",
    description: "Overview of your current loans and payments",
    icon: "cash",
    preview: <LoansPreview />,
    screenLink: "/LoansScreen",
  },
  {
    id: "group-savings",
    type: "group",
    title: "Group Savings",
    description: "Track your group saving goals progress",
    icon: "people",
    preview: <GroupSavingsPreview />,
    screenLink: "/GroupSavingGoalsScreen",
  },
  {
    id: "stock-prices",
    type: "stocks",
    title: "Market Watch",
    description: "Live stock and ETF price updates",
    icon: "stats-chart",
    preview: <StockPricePreview />,
    screenLink: "/InvestmentsScreen",
  },
  {
    id: "virtual-pet",
    type: "pet",
    title: "Virtual Pet Status",
    description: "Check on your financial companion",
    icon: "paw",
    preview: <VirtualPetPreview />,
    screenLink: "/BankableVirtualPetScreen",
  },
  {
    id: "eco-impact",
    type: "eco",
    title: "Eco Impact",
    description: "Track your sustainable financial choices",
    icon: "leaf",
    preview: <EcoImpactPreview />,
    screenLink: "/EcoFinancialImpactScreen",
  },
  // --- Default Widgets (rendered dynamically, no separate preview needed) ---
  {
    id: "recent-transactions",
    type: "transactions",
    title: "Recent Transactions",
    description: "View your most recent account activity",
    icon: "list",
    preview: null, // Rendered dynamically based on current account
    screenLink: undefined, // Navigates to AccountDetailsScreen dynamically
  },
  {
    id: "group-saving", // Note: Type is 'savings', ID is 'group-saving'
    type: "savings",
    title: "Group Saving Goals",
    description: "Track your savings goals progress",
    icon: "save",
    preview: null, // Rendered dynamically
    screenLink: undefined, // Could link to GroupSavingGoalsScreen
  },
  {
    id: "quick-actions",
    type: "actions",
    title: "Quick Actions",
    description: "Quick access to common banking tasks",
    icon: "flash",
    preview: null, // Rendered dynamically
    screenLink: undefined, // Actions are handled inline
  },
]

// --- Default Widget Configuration ---
/**
 * The default set of widgets and their order shown to users initially
 * or if no saved configuration is found.
 */
const defaultWidgets: WidgetConfig[] = [
  {
    id: "recent-transactions",
    type: "transactions",
    title: "Recent Transactions",
    order: 0,
    visible: true,
    removable: true, // User can hide this
  },
  {
    id: "group-saving",
    type: "savings",
    title: "Group Saving Goals",
    order: 1,
    visible: true,
    removable: true,
  },
  {
    id: "quick-actions",
    type: "actions",
    title: "Quick Actions",
    order: 2,
    visible: true,
    removable: true,
  },
  {
    id: "investments",
    type: "investments",
    title: "Investment Portfolio",
    order: 3,
    visible: true,
    removable: true,
    screenLink: "/InvestmentsScreen",
  },
  {
    id: "eco-impact",
    type: "eco",
    title: "Eco Impact",
    order: 4,
    visible: true,
    removable: true,
    screenLink: "/EcoFinancialImpactScreen",
  },
]

/**
 * HomeScreen Component.
 * The main screen displayed after login, showing account overview and customizable widgets.
 * @returns {JSX.Element} The rendered HomeScreen component.
 */
export default function HomeScreen(): JSX.Element {
  // --- Hooks ---
  const router = useRouter() // Navigation
  const { accounts, customerName, customerId, fetchAccountsData, isLoading } = useUser() // User context data
  const { setHasScrolled } = useScrollStatus() // Hook to update global scroll status
  const { editMode, toggleEditMode } = useEditMode() // Edit mode context

  // --- State ---
  /** Index of the currently displayed account card in the horizontal FlatList. */
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  /** Randomly selected daily affirmation text. */
  const [todayAffirmation] = useState<string>(dailyAffirmations[Math.floor(Math.random() * dailyAffirmations.length)])
  /** State holding transactions fetched for each account ID. Key: accountId, Value: array of transactions. */
  const [accountTransactions, setAccountTransactions] = useState<Record<string, any[]>>({})
  /** Loading state specifically for fetching transactions. */
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  /** Controls the visibility of the "Add Widget" modal. */
  const [showWidgetPicker, setShowWidgetPicker] = useState(false)
  /** Controls the visibility of the "Reorder Widgets" modal. */
  const [showReorderModal, setShowReorderModal] = useState(false)
  /** State holding the current configuration (order, visibility) of widgets. Persisted to AsyncStorage. */
  const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultWidgets)
  /** Temporary state holding the widget list during drag-and-drop reordering in the modal. */
  const [draggableList, setDraggableList] = useState<WidgetConfig[]>([])

  // --- Refs ---
  /** Ref for the horizontal account card FlatList to control scrolling programmatically. */
  const flatListRef = useRef<FlatList<any>>(null)
  /** Ref to track if initial account data fetch has been attempted. */
  const dataFetchedRef = useRef(false);

  // --- Effects ---

  /** Effect to load saved widget configuration from AsyncStorage on component mount. */
  useEffect(() => {
    const loadWidgetConfig = async () => {
      try {
        const savedConfig = await AsyncStorage.getItem(WIDGET_CONFIG_STORAGE_KEY)
        if (savedConfig) {
          // If config exists, parse and set it, overriding defaults
          setWidgets(JSON.parse(savedConfig))
        }
        // If no saved config, the defaultWidgets state is already set
      } catch (error) {
        console.error("Failed to load widget configuration:", error)
        // Keep default widgets in case of error
      }
    }

    loadWidgetConfig()
  }, []) // Empty dependency array ensures this runs only once on mount

  /** Effect to save the current widget configuration to AsyncStorage whenever the `widgets` state changes. */
  useEffect(() => {
    const saveWidgetConfig = async () => {
      try {
        // Persist the current widget state as a JSON string
        await AsyncStorage.setItem(WIDGET_CONFIG_STORAGE_KEY, JSON.stringify(widgets))
      } catch (error) {
        console.error("Failed to save widget configuration:", error)
      }
    }

    // Call save function whenever 'widgets' state is updated
    saveWidgetConfig()
  }, [widgets]) // Dependency: run effect when widgets state changes

  /** Effect to fetch user accounts data when the `customerId` is available and data hasn't been fetched yet. */
  useEffect(() => {
    // Fetch accounts only if customerId is present and fetch hasn't happened yet
    if (customerId && !dataFetchedRef.current) {
      fetchAccountsData(customerId);
      dataFetchedRef.current = true; // Mark as fetched
    }
  }, [customerId, fetchAccountsData]); // Dependencies: customerId and the fetch function itself

  /** Effect to fetch transactions for the currently selected account card. */
  useEffect(() => {
    /** Fetches transactions for a given account ID if not already loaded. */
    const fetchTransactionsForAccount = async (accountId: string) => {
      // Proceed only if accountId is valid and transactions for it aren't already in state
      if (accountId && !accountTransactions[accountId]) {
        setLoadingTransactions(true) // Show loading indicator for transactions widget
        try {
          const transactions = await getAccountTransactions(accountId)
          // Update state, adding transactions for the fetched accountId
          setAccountTransactions((prev) => ({
            ...prev,
            [accountId]: transactions,
          }))
        } catch (error) {
          console.error("Error fetching transactions:", error)
          // Optionally set an error state or clear transactions for this account
          setAccountTransactions((prev) => ({
            ...prev,
            [accountId]: [], // Set empty array on error
          }))
        } finally {
          setLoadingTransactions(false) // Hide loading indicator
        }
      }
    }

    // Trigger fetch if accounts exist and the current index is valid
    if (accounts.length > 0 && currentIndex < accounts.length) {
      fetchTransactionsForAccount(accounts[currentIndex].account_id)
    }
    // Dependencies: run when current card index, accounts list, or transaction state changes
  }, [currentIndex, accounts, accountTransactions])

  /** Effect to preload account card background images for smoother display. */
  useEffect(() => {
    if (accounts.length > 0) {
      accounts.forEach((item) => {
        // Determine the image source based on product type
        const imageSource = productTypeToImage[item.product.product_type] || require("../assets/images/carddesign.png")
        // If the source is a local require() result (a number), prefetch it
        if (typeof imageSource === "number") {
          Image.prefetch(Image.resolveAssetSource(imageSource).uri)
        }
      })
    }
  }, [accounts]) // Dependency: run when the accounts list changes

  /** Effect to initialize the `draggableList` state when the reorder modal is opened. */
  useEffect(() => {
    if (showReorderModal) {
      // Filter only visible widgets and sort them by their current order
      const visibleWidgets = widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order)
      // Set the draggableList state with a copy of the visible widgets
      setDraggableList([...visibleWidgets])
    }
    // Dependency: run only when the reorder modal visibility changes
  }, [showReorderModal, widgets])

  // --- Data Formatting ---

  /**
   * Formats raw transaction data from the API into the `Transaction` interface format
   * suitable for display in the 'Recent Transactions' widget. Limits to the first 3 transactions.
   * @param {any[]} [rawTransactions=[]] - Array of raw transaction objects from the API.
   * @returns {Transaction[]} An array of formatted Transaction objects.
   */
  const formatTransactions = (rawTransactions: any[] = []): Transaction[] => {
    // Take only the first 3 transactions and map them
    return rawTransactions.slice(0, 3).map((tx, index) => ({
      id: tx.transaction_id || index, // Use transaction_id if available, otherwise index
      name: tx.merchant_name || tx.transaction_reference || "Transaction", // Use merchant, reference, or fallback
      date: new Date(tx.transaction_date).toLocaleDateString("en-GB"), // Format date as DD/MM/YYYY
      amount: formatCurrency(tx.transaction_amount), // Format amount using helper
      icon: getIconForCategory(tx.transaction_category || "Other"), // Get icon using helper
      type: tx.transaction_amount >= 0 ? "inflow" : "outflow", // Determine type based on amount
    }))
  }

  // --- Event Handlers ---

  /**
   * Handles the scroll event of the horizontal account card FlatList.
   * Updates the `currentIndex` state based on the scroll position.
   * @param {NativeSyntheticEvent<NativeScrollEvent>} e - The native scroll event.
   */
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (accounts.length === 0) return // Do nothing if no accounts

    const offsetX = e.nativeEvent.contentOffset.x
    // Calculate the index based on scroll offset and card width + margin
    const newIndex = Math.round(offsetX / (CARD_WIDTH + 8))

    // Update state only if the calculated index is different and valid
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < accounts.length) {
      setCurrentIndex(newIndex)
    }
  }

  /**
   * Handles the end of a drag gesture on the horizontal account card FlatList.
   * Determines the target index based on velocity or final position and snaps the list to that card.
   * Includes basic logic for potential circular scrolling (currently commented out).
   * @param {NativeSyntheticEvent<NativeScrollEvent>} e - The native scroll event.
   */
  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (accounts.length === 0) return // Do nothing if no accounts

    const offsetX = e.nativeEvent.contentOffset.x
    const velocity = e.nativeEvent.velocity?.x || 0 // Get horizontal velocity

    let newIndex = currentIndex

    // Determine target index based on swipe velocity (even small velocity triggers change)
    if (velocity < -0.1 && currentIndex < accounts.length - 1) { // Swipe left
      newIndex = currentIndex + 1
    } else if (velocity > 0.1 && currentIndex > 0) { // Swipe right
      newIndex = currentIndex - 1
    } else {
      // If no significant velocity, calculate based on final position
      newIndex = Math.round(offsetX / (CARD_WIDTH + 8))
    }

    // Ensure the calculated index is within the valid bounds
    newIndex = Math.max(0, Math.min(newIndex, accounts.length - 1))

    // Scroll the FlatList programmatically to snap to the calculated index
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: newIndex,
        animated: true, // Animate the snap
      })
    }

    // Update the current index state if it changed
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex)
    }
  }

  /**
   * Adds a selected widget to the home screen configuration.
   * If the widget type already exists but is hidden, it makes it visible and places it at the end.
   * If it's a new type, it adds it to the configuration at the end.
   * @param {AvailableWidget} widget - The widget definition object selected from the picker modal.
   */
  const addWidget = (widget: AvailableWidget) => {
    // Check if a widget of the same type already exists in the configuration
    const existingWidget = widgets.find((w) => w.type === widget.type)

    if (existingWidget) {
      // If it exists but is currently hidden
      if (!existingWidget.visible) {
        setWidgets((prev) => {
          // Create a new array, marking the existing widget as visible
          const updatedWidgets = prev.map((w) => (w.id === existingWidget.id ? { ...w, visible: true } : w))

          // Find the highest order among currently visible widgets (excluding the one being added)
          const maxOrder = Math.max(
            ...updatedWidgets.filter((w) => w.visible && w.id !== existingWidget.id).map((w) => w.order),
            -1, // Default to -1 if no other visible widgets
          )

          // Find the widget we just made visible
          const widgetToUpdate = updatedWidgets.find((w) => w.id === existingWidget.id)
          if (widgetToUpdate) {
            // Set its order to be one greater than the current maximum, placing it last
            widgetToUpdate.order = maxOrder + 1
          }

          return updatedWidgets // Return the updated configuration array
        })
      }
      // If it exists and is already visible, do nothing (or potentially show a message)
    } else {
      // If it's a completely new widget type
      setWidgets((prev) => {
        // Find the highest order among currently visible widgets
        const maxOrder = Math.max(...prev.filter((w) => w.visible).map((w) => w.order), -1)

        // Add the new widget configuration to the end of the array
        return [
          ...prev,
          {
            id: `${widget.type}-${Date.now()}`, // Create a unique ID using type and timestamp
            type: widget.type,
            title: widget.title,
            order: maxOrder + 1, // Place it after the last visible widget
            visible: true,
            removable: true, // Assume new widgets are removable
            screenLink: widget.screenLink, // Copy screen link if provided
          },
        ]
      })
    }

    setShowWidgetPicker(false) // Close the picker modal
  }

  /**
   * Hides a widget from the home screen by setting its `visible` flag to false.
   * Re-calculates the `order` for the remaining visible widgets.
   * @param {string} widgetId - The ID of the widget instance to remove (hide).
   */
  const removeWidget = (widgetId: string) => {
    setWidgets((prev) => {
      // Create a new array, marking the specified widget as not visible
      const updatedWidgets = prev.map((w) => (w.id === widgetId ? { ...w, visible: false } : w))

      // Get the list of widgets that are still visible
      const visibleWidgets = updatedWidgets.filter((w) => w.visible)
      // Re-assign sequential order numbers to the visible widgets
      visibleWidgets.forEach((widget, index) => {
        widget.order = index
      })

      return updatedWidgets // Return the updated configuration array
    })
    // Note: Edit mode remains active after removing a widget.
  }

  /** Opens the "Reorder Widgets" modal. */
  const showReorderOptions = () => {
    setShowReorderModal(true)
  }

  /**
   * Applies the new widget order determined in the reorder modal.
   * Updates the main `widgets` state based on the order in `draggableList`.
   */
  const applyReorderedWidgets = () => {
    setWidgets((prev) => {
      // Map through the previous widget state
      return prev.map((widget) => {
        // Find the corresponding widget in the reordered draggableList
        const match = draggableList.find((item) => item.id === widget.id)
        if (match) {
          // If found, update its order based on its position in draggableList
          return { ...widget, order: match.order }
        }
        // If not found (e.g., it was hidden), keep the widget as is
        return widget
      })
    })
    setShowReorderModal(false) // Close the reorder modal
  }

  /**
   * Callback function for the DraggableFlatList when a drag operation ends.
   * Updates the temporary `draggableList` state with the new order.
   * @param {object} params - Object containing the reordered data.
   * @param {WidgetConfig[]} params.data - The array of widgets in their new order.
   */
  const handleDragEnd = ({ data }: { data: WidgetConfig[] }) => {
    // Update the order property for each widget based on its new index in the data array
    const updatedList = data.map((widget, index) => ({
      ...widget,
      order: index, // Assign order based on the final position
    }))

    setDraggableList(updatedList) // Update the temporary draggable list state
  }

  /**
   * Handles scroll events on the main ScrollView.
   * Updates the global scroll status context, used for header effects in `_layout.tsx`.
   * @param {NativeSyntheticEvent<NativeScrollEvent>} event - The native scroll event.
   */
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y
    // Update global state: true if scrolled down more than 10px, false otherwise
    setHasScrolled(scrollY > 10)
  }

  // --- Derived Data ---

  /** The account object corresponding to the currently selected card index. */
  const currentAccount = accounts.length > 0 && currentIndex < accounts.length ? accounts[currentIndex] : null

  /** Formatted transactions for the currently selected account. */
  const currentTransactions = currentAccount ? formatTransactions(accountTransactions[currentAccount.account_id]) : []

  /** Widgets filtered to include only visible ones, then sorted by their `order` property. */
  const sortedWidgets = [...widgets].filter((w) => w.visible).sort((a, b) => a.order - b.order)

  // --- Render Functions ---

  /**
   * Renders the appropriate content for a given widget configuration.
   * Uses a switch statement based on `widget.type` to determine the content.
   * Also handles rendering previews for custom widgets added from other screens.
   * @param {WidgetConfig} widget - The configuration object for the widget to render.
   * @returns {React.ReactNode | null} The rendered widget content, or null if not visible.
   */
  const renderWidget = (widget: WidgetConfig): React.ReactNode | null => {
    if (!widget.visible) return null // Don't render if hidden

    // Find the corresponding definition from the availableWidgets list
    const availableWidget = availableWidgets.find((aw) => aw.type === widget.type)

    // --- Render Previews for Added Custom Widgets ---
    // If it's a known widget type from `availableWidgets` BUT NOT one of the default dynamic ones
    if (availableWidget && widget.type !== "transactions" && widget.type !== "savings" && widget.type !== "actions") {
      return (
        // Wrap the preview in a TouchableOpacity to handle navigation
        <TouchableOpacity
          onPress={() => {
            // Navigate only if not in edit mode and a screen link exists
            if (!editMode && widget.screenLink) {
              router.push(widget.screenLink)
            }
          }}
          disabled={editMode} // Disable touch interaction in edit mode
        >
          {/* Render the preview component defined in availableWidgets */}
          {availableWidget.preview}
        </TouchableOpacity>
      )
    }

    // --- Render Default Dynamic Widgets ---
    switch (widget.type) {
      case "transactions":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{widget.title}</Text>
            {loadingTransactions ? (
              // Show loading indicator while fetching
              <ActivityIndicator size="small" color="#015F45" style={{ marginVertical: 20 }} />
            ) : currentTransactions.length > 0 ? (
              // If transactions loaded, display them
              <>
                {currentTransactions.map((tx) => (
                  <TouchableOpacity
                    key={tx.id}
                    style={styles.transactionItem}
                    onPress={() => {
                      // Navigate to account details if not in edit mode
                      if (!editMode && currentAccount) {
                        router.push({
                          pathname: "/AccountDetailsScreen",
                          params: { accountId: currentAccount.account_id },
                        })
                      }
                    }}
                    disabled={editMode} // Disable touch in edit mode
                  >
                    {/* Left side: Icon, Name, Date */}
                    <View style={styles.transactionDetails}>
                      <Ionicons name={tx.icon} size={20} color="#015F45" />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.transactionName}>{tx.name}</Text>
                        <Text style={styles.transactionDate}>{tx.date}</Text>
                      </View>
                    </View>
                    {/* Right side: Amount */}
                    <Text style={[styles.transactionAmount, tx.type === "inflow" ? styles.inflow : styles.outflow]}>
                      {tx.type === "inflow" ? "+" : "-"}
                      {tx.amount}
                    </Text>
                  </TouchableOpacity>
                ))}
                {/* "View All" button */}
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => {
                    if (!editMode && currentAccount) {
                      router.push({
                        pathname: "/AccountDetailsScreen",
                        params: { accountId: currentAccount.account_id },
                      })
                    }
                  }}
                  disabled={editMode}
                >
                  <Text style={styles.viewAllText}>View all transactions</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Show message if no transactions
              <Text style={styles.emptyText}>No recent transactions</Text>
            )}
          </View>
        )

      case "savings": // Corresponds to 'group-saving' ID in default config
        // Placeholder for Group Saving Goals widget content
        // In a real app, this would fetch and display actual group goal data
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{widget.title}</Text>
            {/* Mock goal display */}
            <View style={styles.goalRow}>
              <Text style={styles.goalName}>Summer Holiday Fund</Text>
              <Text style={styles.goalPercent}>75%</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: "75%" }]} />
            </View>
            {/* Add button to navigate to GroupSavingGoalsScreen */}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => { if (!editMode) router.push('/GroupSavingGoalsScreen'); }}
              disabled={editMode}
            >
              <Text style={styles.viewAllText}>View Group Goals</Text>
            </TouchableOpacity>
          </View>
        )

      case "actions":
        // Renders the Quick Actions widget with common banking tasks
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{widget.title}</Text>
            <View style={styles.quickActionsContainer}>
              {/* Transfer Action */}
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => { if (!editMode) { /* TODO: Implement Transfer action */ } }}
                disabled={editMode}
              >
                <Ionicons name="send" size={24} color="#015F45" />
                <Text style={styles.quickActionText}>Transfer</Text>
              </TouchableOpacity>
              {/* Pay Bills Action */}
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => { if (!editMode) { /* TODO: Implement Pay Bills action */ } }}
                disabled={editMode}
              >
                <Ionicons name="document-text" size={24} color="#015F45" />
                <Text style={styles.quickActionText}>Pay Bills</Text>
              </TouchableOpacity>
              {/* Freeze Card Action */}
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => { if (!editMode) { /* TODO: Implement Freeze Card action */ } }}
                disabled={editMode}
              >
                <Ionicons name="card" size={24} color="#015F45" />
                <Text style={styles.quickActionText}>Freeze Card</Text>
              </TouchableOpacity>
              {/* Investments Action (Navigate) */}
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => { if (!editMode) router.push('/InvestmentsScreen'); }}
                disabled={editMode}
              >
                <Ionicons name="pulse" size={24} color="#015F45" />
                <Text style={styles.quickActionText}>Investments</Text>
              </TouchableOpacity>
            </View>
          </View>
        )

      default:
        // Return null if the widget type is unknown or not handled
        return null
    }
  }

  /**
   * Renders a widget wrapped with edit mode controls (overlay, remove button).
   * @param {object} props - Component props.
   * @param {WidgetConfig} props.widget - The widget configuration to render.
   * @returns {JSX.Element} The widget component with optional edit controls.
   */
  const WidgetWithControls = ({ widget }: { widget: WidgetConfig }): JSX.Element => {
    return (
      <View style={styles.widgetContainer}>
        {/* Render the actual widget content */}
        {renderWidget(widget)}

        {/* Overlay controls shown only when editMode is active */}
        {editMode && (
          <>
            {/* Dashed border overlay */}
            <View style={styles.editModeOverlay} />
            {/* Container for control buttons (top right) */}
            <View style={styles.widgetControls}>
              {/* Show remove button only if widget is removable */}
              {widget.removable && (
                <TouchableOpacity style={styles.removeHandle} onPress={() => removeWidget(widget.id)}>
                  <Ionicons name="close-circle" size={20} color="#ff6b6b" /> {/* Red close icon */}
                </TouchableOpacity>
              )}
              {/* Potential drag handle could go here if dragging directly on screen */}
              {/* <TouchableOpacity style={styles.dragHandle} onPressIn={drag}>
                <Ionicons name="menu" size={24} color="#015F45" />
              </TouchableOpacity> */}
            </View>
          </>
        )}
      </View>
    )
  }

  /**
   * Renders a single item in the draggable list used in the reorder modal.
   * Includes drag handle, icon, and title. Applies styles when item is active (being dragged).
   * @param {object} params - Props provided by DraggableFlatList.
   * @param {WidgetConfig} params.item - The widget configuration for this item.
   * @param {Function} params.drag - Function to initiate dragging (call onPressIn or onLongPress).
   * @param {boolean} params.isActive - Whether this item is currently being dragged.
   * @returns {JSX.Element} The rendered draggable list item.
   */
  const renderDraggableItem = ({ item, drag, isActive }: { item: WidgetConfig; drag: () => void; isActive: boolean }): JSX.Element => {
    // Find the corresponding icon for the widget type
    const widgetIcon = availableWidgets.find((w) => w.type === item.type)?.icon || "apps" // Default to 'apps' icon

    return (
      // ScaleDecorator applies scaling animation when item is active
      <ScaleDecorator>
        {/* TouchableOpacity makes the item pressable and handles drag initiation */}
        <TouchableOpacity
          activeOpacity={1} // Prevent opacity change on press
          onLongPress={drag} // Initiate drag on long press
          // Apply base style and conditional style when active
          style={[styles.draggableItem, isActive && styles.draggingItem]}
          disabled={isActive} // Disable touch events while dragging
        >
          {/* Drag handle icon */}
          <Ionicons name="menu" size={24} color="#015F45" style={styles.dragHandleIcon} />
          {/* Widget type icon */}
          <Ionicons name={widgetIcon} size={24} color="#015F45" style={{ marginRight: 12 }} />
          {/* Widget title */}
          <Text style={styles.widgetTitle}>{item.title}</Text>
        </TouchableOpacity>
      </ScaleDecorator>
    )
  }

  // --- Conditional Rendering: Loading State ---
  // Show loading indicator while fetching initial account data
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#015F45" />
        <Text style={{ marginTop: 20, color: "#666" }}>Loading your accounts...</Text>
      </View>
    )
  }

  // --- Main Component Return ---
  return (
    <>
      {/* Main ScrollView containing all screen content */}
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: "#ffffff" }} // Ensure background is white
        bounces={true} // Allow bouncing effect on scroll (iOS)
        onScroll={handleScroll} // Attach scroll handler
        scrollEventThrottle={16} // Optimize scroll event frequency (16ms = ~60fps)
      >
        {/* --- Static Account Cards Section (Not Editable) --- */}
        <View style={styles.accountCardsSection}>
          {/* Swipeable Header Cards */}
          <View style={[styles.swipeableContainer, { marginTop: 16 }]}>
            {accounts.length === 0 ? (
              // Display placeholder if no accounts found
              <View style={[styles.card, styles.nocarddesign]}>
                <Text style={styles.noAccountText}>No accounts found</Text>
              </View>
            ) : (
              // Horizontal list of account cards
              <FlatList
                ref={flatListRef}
                data={accounts}
                keyExtractor={(item) => item.account_id}
                horizontal // Make the list horizontal
                showsHorizontalScrollIndicator={false} // Hide scrollbar
                snapToInterval={CARD_WIDTH + 8} // Define snap points (card width + margin)
                decelerationRate={0.8} // Adjust scroll deceleration
                snapToAlignment="center" // Snap cards to the center
                onScroll={onScroll} // Handle scroll events for index tracking
                onScrollEndDrag={onScrollEndDrag} // Handle drag end for snapping
                removeClippedSubviews={true} // Performance optimization
                scrollEventThrottle={16} // Optimize scroll event frequency
                contentContainerStyle={{ paddingHorizontal: SPACING }} // Add padding for centering first/last card
                // Performance optimization: provide item layout info
                getItemLayout={(data, index) => ({
                  length: CARD_WIDTH + 8,
                  offset: (CARD_WIDTH + 8) * index,
                  index,
                })}
                pagingEnabled={false} // Disable default paging, use snapToInterval instead
                directionalLockEnabled={true} // Lock scroll direction
                // Render each account card
                renderItem={({ item }) => {
                  // Determine card background image
                  const imageSource =
                    productTypeToImage[item.product.product_type] || require("../assets/images/carddesign.png")
                  return (
                    <TouchableOpacity
                      style={styles.card}
                      activeOpacity={0.9} // Slight opacity change on press
                      onPress={() => {
                        // Navigate to account details if not in edit mode
                        if (!editMode) {
                          router.push({
                            pathname: "/AccountDetailsScreen",
                            params: { accountId: item.account_id },
                          })
                        }
                      }}
                      disabled={editMode} // Disable touch in edit mode
                    >
                      {/* Optimized background image */}
                      <ExpoImage
                        source={imageSource} // Use determined image source
                        style={styles.cardImage}
                        contentFit="cover" // Cover the card area
                        cachePolicy="memory-disk" // Cache image
                      />
                      {/* Transparent overlay (for potential future use) */}
                      <View style={styles.overlay} />
                      {/* Text content on the card */}
                      <View style={styles.headerCardContent}>
                        <Text style={styles.accountType}>{item.product.product_name}</Text>
                        <Text style={styles.accountNumber}>**** **** **** {item.account_details.account_number_last_4}</Text>
                        <Text style={styles.balance}>{formatCurrency(item.balance.amount)}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                }}
              />
            )}

            {/* Pagination dots below the cards */}
            {accounts.length > 1 && ( // Only show if more than one card
              <View style={styles.paginationContainer}>
                {accounts.map((_, i) => (
                  <View key={i} style={[styles.paginationDot, i === currentIndex && styles.paginationDotActive]} />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* --- Editable Widgets Section --- */}
        <View style={styles.widgetsContainer}>
          {/* "Reorder Widgets" button (visible only in edit mode and if >1 widget) */}
          {editMode && sortedWidgets.length > 1 && (
            <TouchableOpacity style={styles.reorderButton} onPress={showReorderOptions}>
              <Ionicons name="reorder-two" size={24} color="#fff" />
              <Text style={styles.reorderButtonText}>Reorder Widgets</Text>
            </TouchableOpacity>
          )}

          {/* Render each visible widget, wrapped with edit controls */}
          {sortedWidgets.map((widget) => (
            <WidgetWithControls key={widget.id} widget={widget} />
          ))}
        </View>
      </ScrollView>

      {/* --- Floating "Add Widget" Button --- */}
      {/* Visible only in edit mode */}
      {editMode && (
        <Animated.View style={styles.addButtonContainer}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowWidgetPicker(true)}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* --- Modals --- */}

      {/* Widget Picker Modal */}
      <Modal
        visible={showWidgetPicker}
        animationType="slide" // Slide up from bottom
        transparent // Allows BlurView overlay
        onRequestClose={() => setShowWidgetPicker(false)} // Handle Android back button
      >
        {/* Blurred background overlay */}
        <BlurView style={styles.modalContainer} intensity={10} tint="light">
          {/* Modal content container */}
          <View style={styles.widgetPickerContainer}>
            <Text style={styles.modalTitle}>Add Widgets</Text>
            {/* Close button */}
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowWidgetPicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            {/* List of available widgets to add */}
            <FlatList
              // Filter out widgets that are already visible on the home screen
              data={availableWidgets.filter((widget) => {
                const existingWidget = widgets.find((w) => w.type === widget.type && w.visible)
                return !existingWidget
              })}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              // Render each available widget preview
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.widgetPreviewContainer} onPress={() => addWidget(item)}>
                  {/* Render the preview component if available, otherwise just title/desc */}
                  {item.preview ? (
                    item.preview
                  ) : (
                    <>
                      <View style={styles.widgetPreviewContent}>
                        <Ionicons name={item.icon} size={24} color="#015F45" />
                        <Text style={styles.widgetTitle}>{item.title}</Text>
                      </View>
                      <Text style={styles.widgetDescription}>{item.description}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              // Add spacing between list items
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              contentContainerStyle={{ paddingBottom: 20 }} // Padding at the bottom of the list
            />
          </View>
        </BlurView>
      </Modal>

      {/* Reorder Widgets Modal */}
      <Modal
        visible={showReorderModal}
        animationType="slide" // Slide up from bottom
        transparent // Allows BlurView overlay
        onRequestClose={() => setShowReorderModal(false)} // Handle Android back button
      >
        {/* Blurred background overlay */}
        <BlurView style={styles.modalContainer} intensity={10} tint="light">
          {/* Modal content container */}
          <View style={styles.widgetPickerContainer}>
            <Text style={styles.modalTitle}>Reorder Widgets</Text>
            {/* Close button */}
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowReorderModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.reorderInstructions}>Drag and drop to reorder your widgets</Text>

            {/* Container for the draggable list */}
            <View style={styles.reorderListContainer}>
              {/* Draggable FlatList component */}
              <DraggableFlatList
                data={draggableList} // Use the temporary draggable list state
                renderItem={renderDraggableItem} // Function to render each draggable item
                keyExtractor={(item) => item.id} // Unique key for each item
                onDragEnd={handleDragEnd} // Callback when drag ends to update order
                dragItemOverflow={false} // Prevent item content overflowing during drag
              />
            </View>

            {/* Button to apply the changes */}
            <TouchableOpacity style={styles.applyChangesButton} onPress={applyReorderedWidgets}>
              <Text style={styles.applyChangesText}>Apply Changes</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </>
  )
}