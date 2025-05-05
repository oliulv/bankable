import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Icon libraries
import { LineChart, PieChart } from 'react-native-chart-kit'; // Charting library
import AsyncStorage from '@react-native-async-storage/async-storage'; // Local storage

// Import dummy data (replace with API calls in production)
import initialAssetsData from '../data/assets.json';
import initialPortfolioData from '../data/initialPortfolio.json';

// Get screen width for responsive design
const screenWidth = Dimensions.get('window').width;

// --- Interfaces ---

/** Defines the structure for a single investment asset. */
interface Asset {
  id: string; // Unique identifier
  name: string; // Full name of the asset (e.g., Apple Inc.)
  symbol: string; // Ticker symbol (e.g., AAPL)
  category: AssetCategory; // Type of asset (e.g., Stocks, Crypto)
  currentPrice: number; // Current market price
  priceChange24h: number; // Absolute price change in the last 24 hours
  priceChangePercentage24h: number; // Percentage price change in the last 24 hours
  marketCap: number; // Market capitalization
  volume24h: number; // Trading volume in the last 24 hours
  favorite: boolean; // Whether the user has marked this as a favorite
  description?: string; // Optional description of the asset
  historicalData?: { // Optional historical price data for charts
    labels: string[]; // Time labels (e.g., dates, times)
    prices: number[]; // Corresponding prices
  };
}

/** Defines the structure for a single transaction record. */
interface Transaction {
  id: string; // Unique identifier for the transaction
  assetId: string; // ID of the asset involved
  type: 'buy' | 'sell'; // Type of transaction
  amount: number; // Total monetary value of the transaction (£)
  price: number; // Price per unit of the asset at the time of transaction
  date: Date; // Date and time of the transaction
  quantity: number; // Number of units bought or sold
}

/** Defines the structure of the user's investment portfolio. */
interface Portfolio {
  balance: number; // Available cash balance for trading
  assets: { // Holdings keyed by asset ID
    [assetId: string]: {
      quantity: number; // Number of units owned
      averagePrice: number; // Average purchase price per unit
    };
  };
  transactions: Transaction[]; // List of past transactions
}

/** Defines the possible categories for assets. */
type AssetCategory = 'Stocks' | 'ETFs' | 'Crypto' | 'Bonds' | 'Real Estate';

/** Defines the structure for data used in the holdings list. */
interface HoldingDataItem {
  assetId: string;
  asset: Asset; // The asset details
  holding: { // The user's holding details for this asset
    quantity: number;
    averagePrice: number;
  };
  value: number; // Current market value of the holding
}

// --- Chart Configuration ---

/** Configuration object for react-native-chart-kit charts. */
const chartConfig = {
  backgroundGradientFrom: "#ffffff", // Chart background start color
  backgroundGradientTo: "#ffffff", // Chart background end color
  color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`, // Default line/element color (Bankable green)
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Axis label color
  strokeWidth: 2, // Default line stroke width
  barPercentage: 0.7, // Width of bars in bar charts
  useShadowColorFromDataset: false, // Whether to use shadow color defined in dataset
  decimalPlaces: 2, // Decimal places for chart labels
  style: {
    borderRadius: 16 // Style for the chart container
  },
};

// --- Component ---

/**
 * InvestmentsScreen Component: Displays investment assets, user portfolio, and allows trading.
 */
const InvestmentsScreen: React.FC = () => {
  // --- State Variables ---
  const [assets, setAssets] = useState<Asset[]>(initialAssetsData as Asset[]); // Full list of available assets
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>(initialAssetsData as Asset[]); // Assets filtered by category/search
  const [portfolio, setPortfolio] = useState<Portfolio>(initialPortfolioData); // User's portfolio data
  const [loading, setLoading] = useState<boolean>(true); // Loading state for initial data fetch
  const [refreshing, setRefreshing] = useState<boolean>(false); // State for pull-to-refresh indicator
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null); // Asset currently viewed in detail modal
  const [showAssetModal, setShowAssetModal] = useState<boolean>(false); // Visibility state for asset detail modal
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false); // Visibility state for buy/sell modal
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy'); // Type of transaction in the modal ('buy' or 'sell')
  const [transactionAmount, setTransactionAmount] = useState<string>(''); // Input value (£) for transaction amount
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search query for filtering assets
  const [activeTab, setActiveTab] = useState<'assets' | 'portfolio'>('assets'); // Main tab ('assets' list or 'portfolio' view)
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'All'>('All'); // Currently selected asset category filter
  const [sortOption, setSortOption] = useState<'name' | 'price' | 'change'>('name'); // Sorting option for the asset list
  const categoryScrollViewRef = React.useRef<ScrollView>(null); // Ref for the category filter scroll view
  const [showCategoryIndicator, setShowCategoryIndicator] = useState(true); // Whether to show the scroll indicator for categories
  const [activePortfolioTab, setActivePortfolioTab] = useState<'holdings' | 'transactions'>('holdings'); // Sub-tab within the portfolio view

  /** State for historical chart data in the asset detail modal. */
  interface ChartData {
    isLoading: boolean;
    labels: string[];
    prices: number[];
  }
  const [chartData, setChartData] = useState<ChartData>({ // State to hold chart data for the selected asset modal
    isLoading: false,
    labels: [],
    prices: []
  });

  // --- Effects ---

  /** Effect to initialize data on component mount. */
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true); // Start loading indicator
        // Load portfolio and favorite assets from AsyncStorage concurrently
        await Promise.all([
          loadPortfolio(),
          loadFavorites()
        ]);
        // Simulate fetching initial asset data (replace with actual API call)
        setTimeout(() => {
          simulateAssetUpdate(); // Perform an initial simulated update
          setLoading(false); // Stop loading indicator
        }, 200); // Short delay for simulation
      } catch (error) {
        console.error('Error initializing data:', error);
        setLoading(false); // Stop loading indicator on error
      }
    };

    initialize(); // Run initialization

    // Set up an interval to periodically simulate asset price updates (replace with WebSocket or polling in production)
    const refreshInterval = setInterval(() => {
      // Only update if modals are not open to avoid disrupting user interaction
      if (!showAssetModal && !showTransactionModal) {
        simulateAssetUpdate();
      }
    }, 60000); // Update every 60 seconds

    // Cleanup function: clear the interval when the component unmounts
    return () => clearInterval(refreshInterval);
  }, []); // Empty dependency array ensures this runs only once on mount

  /** Effect to briefly scroll the category filter on mount to indicate scrollability. */
  useEffect(() => {
    setTimeout(() => {
      if (categoryScrollViewRef.current) {
        // Scroll slightly to the right
        categoryScrollViewRef.current.scrollTo({ x: 50, animated: true });
        // Scroll back to the beginning after a short delay
        setTimeout(() => {
          categoryScrollViewRef.current?.scrollTo({ x: 0, animated: true });
        }, 800);
      }
    }, 500); // Delay the animation slightly after mount
  }, []); // Empty dependency array ensures this runs only once

  /** Effect to filter and sort assets whenever dependencies change. */
  useEffect(() => {
    let result = [...assets]; // Start with the full asset list

    // Apply category filter
    if (selectedCategory !== 'All') {
      result = result.filter(asset => asset.category === selectedCategory);
    }

    // Apply search filter (case-insensitive)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(asset =>
        asset.name.toLowerCase().includes(query) ||
        asset.symbol.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortOption) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name
        break;
      case 'price':
        result.sort((a, b) => b.currentPrice - a.currentPrice); // Sort by price descending
        break;
      case 'change':
        result.sort((a, b) => b.priceChangePercentage24h - a.priceChangePercentage24h); // Sort by 24h change descending
        break;
    }

    setFilteredAssets(result); // Update the state with the filtered and sorted assets
  }, [assets, selectedCategory, searchQuery, sortOption]); // Dependencies: re-run when these change

  // --- Data Handling Functions ---

  /** Loads the portfolio data from AsyncStorage. */
  const loadPortfolio = async () => {
    try {
      const portfolioData = await AsyncStorage.getItem('portfolio');
      if (portfolioData) {
        const parsedData = JSON.parse(portfolioData);
        // Convert stored date strings back to Date objects for transactions
        if (parsedData.transactions) {
          parsedData.transactions = parsedData.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date) // Ensure date is a Date object
          }));
        }
        // Reset the balance to £1000 every time the app loads (for demo purposes)
        parsedData.balance = 1000;
        setPortfolio(parsedData); // Update portfolio state
      }
      // If no data found, the initial state (from JSON) is used
    } catch (error) {
      console.error('Failed to load portfolio:', error);
      // Handle error appropriately, maybe show a message to the user
    }
  };

  /** Saves the current portfolio data to AsyncStorage. */
  const savePortfolio = async (newPortfolio: Portfolio) => {
    try {
      await AsyncStorage.setItem('portfolio', JSON.stringify(newPortfolio));
    } catch (error) {
      console.error('Failed to save portfolio:', error);
      // Handle error appropriately
    }
  };

  /** Saves the IDs of favorite assets to AsyncStorage. */
  const saveFavorites = (assetsList: Asset[]) => {
    try {
      // Extract IDs of assets marked as favorite
      const favoriteIds = assetsList.filter(asset => asset.favorite).map(asset => asset.id);
      // Store the array of favorite IDs
      AsyncStorage.setItem('favoriteAssets', JSON.stringify(favoriteIds));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  };

  /** Loads favorite asset IDs from AsyncStorage and updates the assets state. */
  const loadFavorites = async () => {
    try {
      const favoritesData = await AsyncStorage.getItem('favoriteAssets');
      if (favoritesData) {
        const favoriteIds = JSON.parse(favoritesData) as string[]; // Parse the stored IDs
        // Update the main assets list based on loaded favorite IDs
        const updatedAssets = assets.map(asset => ({
          ...asset,
          favorite: favoriteIds.includes(asset.id) // Set favorite status
        }));
        setAssets(updatedAssets); // Update state
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  /** Simulates fetching updated asset prices and historical data. (Replace with real API calls) */
  const simulateAssetUpdate = () => {
    setRefreshing(true); // Indicate that data is being refreshed

    // Create a small random fluctuation for each asset's price
    const updatedAssets = assets.map(asset => {
      // Random change between -2% and +2%
      const randomPercentageChange = (Math.random() * 4 - 2) / 100;
      const priceChange = asset.currentPrice * randomPercentageChange;
      const newPrice = Math.max(0.01, asset.currentPrice + priceChange); // Ensure price doesn't go below 0.01

      // Simulate updating historical data: remove oldest point, add new price
      const newHistoricalPrices = asset.historicalData?.prices.slice(1) || []; // Get existing prices, remove first
      newHistoricalPrices.push(newPrice); // Add the new price to the end

      // Keep labels the same length as prices (simple simulation)
      const newLabels = asset.historicalData?.labels.slice(1) || [];
      newLabels.push(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); // Add current time as label

      return {
        ...asset,
        currentPrice: newPrice,
        priceChange24h: priceChange, // Update 24h absolute change (simplified)
        priceChangePercentage24h: randomPercentageChange * 100, // Update 24h percentage change
        historicalData: { // Update historical data
          labels: newLabels,
          prices: newHistoricalPrices
        }
      };
    });

    setAssets(updatedAssets); // Update the main assets state

    // Re-apply filters and sorting to the updated assets
    // (This logic is duplicated from the useEffect, consider refactoring)
    const filtered = updatedAssets.filter(asset => {
      const matchesCategory = selectedCategory === 'All' || asset.category === selectedCategory;
      const matchesSearch = !searchQuery ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    // Apply sorting (logic duplicated)
    switch (sortOption) {
        case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'price': filtered.sort((a, b) => b.currentPrice - a.currentPrice); break;
        case 'change': filtered.sort((a, b) => b.priceChangePercentage24h - a.priceChangePercentage24h); break;
    }
    setFilteredAssets(filtered); // Update the filtered assets state

    setRefreshing(false); // Stop the refreshing indicator
  };

  /** Callback function for the pull-to-refresh action. */
  const onRefresh = useCallback(() => {
    setRefreshing(true); // Show refresh indicator
    simulateAssetUpdate(); // Trigger the simulated data update
    // Simulate network delay for better UX
    setTimeout(() => setRefreshing(false), 1000);
  }, []); // Dependencies for useCallback (empty means it doesn't change)

  // --- Event Handlers ---

  /** Handles scrolling in the category filter ScrollView to hide/show the indicator. */
  const handleCategoryScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    // Check if scrolled near the end (within 20 pixels)
    const isScrolledToEnd = layoutMeasurement.width + contentOffset.x >= contentSize.width - 20;
    setShowCategoryIndicator(!isScrolledToEnd); // Hide indicator if near the end
  };

  /** Toggles the favorite status of an asset. */
  const toggleFavorite = (assetId: string) => {
    // Update the main assets list
    const updatedAssets = assets.map(asset =>
      asset.id === assetId ? { ...asset, favorite: !asset.favorite } : asset
    );
    setAssets(updatedAssets);

    // If the toggled asset is the one currently selected in the modal, update its state too
    if (selectedAsset && selectedAsset.id === assetId) {
      setSelectedAsset({ ...selectedAsset, favorite: !selectedAsset.favorite });
    }

    saveFavorites(updatedAssets); // Persist the change to AsyncStorage
  };

  /** Simulates fetching/refreshing historical data for an asset (replace with API call). */
  const refreshAssetHistoricalData = async (asset: Asset): Promise<{labels: string[], prices: number[]}> => {
    // Simulate API call delay
    return new Promise(resolve => {
      setTimeout(() => {
        // Return existing data or empty arrays if none exists
        resolve(asset.historicalData || { labels: [], prices: [] });
      }, 500); // 500ms delay simulation
    });
  };

  /** Opens the asset detail modal and fetches/updates its historical data. */
  const openAssetDetails = (asset: Asset) => {
    setSelectedAsset(asset); // Set the selected asset for the modal
    setShowAssetModal(true); // Show the modal

    // Asynchronously refresh historical data when modal opens
    (async () => {
      try {
        // If no historical data exists yet, set empty arrays initially
        if (!asset.historicalData || asset.historicalData.prices.length === 0) {
          const updatedAsset = { ...asset, historicalData: { labels: [], prices: [] } };
          setSelectedAsset(updatedAsset); // Update modal state immediately
        }
        // Fetch (or simulate fetching) the latest historical data
        const histData = await refreshAssetHistoricalData(asset);
        // Create the updated asset object with fresh data
        const freshAsset = { ...asset, historicalData: histData };
        setSelectedAsset(freshAsset); // Update the modal state with fresh data
        // Also update the main assets list in the background
        setAssets(prev => prev.map(a => a.id === asset.id ? freshAsset : a));
      } catch (error) {
        console.error('Error refreshing asset data:', error);
        // Handle error (e.g., show a message in the modal)
      }
    })();
  };

  /** Opens the transaction modal (buy/sell). */
  const openTransactionModal = (type: 'buy' | 'sell') => {
    if (!selectedAsset) return; // Ensure an asset is selected

    // Check if user can sell this asset
    if (type === 'sell') {
      const assetHolding = portfolio.assets[selectedAsset.id];
      if (!assetHolding || assetHolding.quantity <= 0) {
        Alert.alert("Cannot Sell", "You don't own any shares of this asset to sell.", [{ text: "OK" }]);
        return; // Prevent opening modal if no holdings
      }
    }

    const asset = selectedAsset; // Store selected asset temporarily
    setShowAssetModal(false); // Close the asset detail modal first

    // Use setTimeout to allow the asset detail modal to close before opening the transaction modal
    setTimeout(() => {
      setSelectedAsset(asset); // Restore selected asset
      setTransactionType(type); // Set buy or sell mode
      setTransactionAmount(''); // Clear previous amount input
      setShowTransactionModal(true); // Show the transaction modal
    }, 300); // Delay opening slightly
  };

  /** Processes the buy or sell transaction. */
  const processTransaction = () => {
    if (!selectedAsset || !transactionAmount) return; // Ensure asset and amount are set

    const amount = parseFloat(transactionAmount); // Convert input string to number
    // Validate the amount
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive amount.");
      return;
    }

    const currentPrice = selectedAsset.currentPrice; // Get current price
    const quantity = amount / currentPrice; // Calculate quantity based on amount and price
    const newPortfolio = { ...portfolio }; // Create a mutable copy of the portfolio

    if (transactionType === 'buy') {
      // Check for sufficient balance
      if (amount > newPortfolio.balance) {
        Alert.alert("Insufficient Funds", "You don't have enough balance for this transaction.");
        return;
      }
      newPortfolio.balance -= amount; // Deduct cost from balance

      // Initialize asset holding if it doesn't exist
      if (!newPortfolio.assets[selectedAsset.id]) {
        newPortfolio.assets[selectedAsset.id] = { quantity: 0, averagePrice: 0 };
      }

      // Update holding quantity and calculate new average price
      const currentHolding = newPortfolio.assets[selectedAsset.id];
      const currentTotalValue = currentHolding.quantity * currentHolding.averagePrice;
      const newTotalValue = currentTotalValue + amount;
      const newTotalQuantity = currentHolding.quantity + quantity;
      currentHolding.quantity = newTotalQuantity;
      currentHolding.averagePrice = newTotalValue / newTotalQuantity; // Weighted average

    } else { // Sell transaction
      const assetHolding = newPortfolio.assets[selectedAsset.id];
      // Check if user owns enough to sell
      if (!assetHolding || assetHolding.quantity < quantity) {
        // Note: This check might be slightly inaccurate due to floating point precision.
        // Consider comparing with a small tolerance (epsilon) or using a dedicated decimal library.
        Alert.alert("Insufficient Assets", `You don't own enough ${selectedAsset.symbol} to sell this amount.`);
        return;
      }
      newPortfolio.balance += amount; // Add proceeds to balance
      assetHolding.quantity -= quantity; // Reduce holding quantity

      // Remove asset from holdings if quantity becomes zero or negligible
      if (assetHolding.quantity <= 1e-9) { // Use a small threshold for floating point comparison
        delete newPortfolio.assets[selectedAsset.id];
      }
    }

    // Create a new transaction record
    const transaction: Transaction = {
      id: Date.now().toString(), // Simple unique ID using timestamp
      assetId: selectedAsset.id,
      type: transactionType,
      amount: amount,
      price: currentPrice,
      date: new Date(), // Record current date/time
      quantity: quantity
    };

    // Add the new transaction to the beginning of the list
    newPortfolio.transactions = [transaction, ...newPortfolio.transactions];

    setPortfolio(newPortfolio); // Update the portfolio state
    savePortfolio(newPortfolio); // Save the updated portfolio to AsyncStorage
    setShowTransactionModal(false); // Close the transaction modal

    // Show success message
    Alert.alert(
      "Transaction Successful",
      `You ${transactionType === 'buy' ? 'bought' : 'sold'} ${quantity.toFixed(6)} ${selectedAsset.symbol} for £${amount.toFixed(2)}.`,
      [{ text: "OK" }]
    );
  };

  // --- Calculation Functions ---

  /** Calculates the total value of the portfolio (cash + holdings). */
  const calculateTotalPortfolioValue = () => {
    let totalValue = portfolio.balance; // Start with cash balance
    // Add the current market value of each holding
    Object.entries(portfolio.assets).forEach(([assetId, holding]) => {
      const asset = assets.find(a => a.id === assetId); // Find the asset details
      if (asset) {
        totalValue += asset.currentPrice * holding.quantity; // Add value of this holding
      }
    });
    return totalValue;
  };

  /** Calculates the overall portfolio performance percentage (profit/loss). */
  const calculatePortfolioPerformance = () => {
    let totalInvested = 0; // Total cost basis of current holdings
    let totalCurrentValue = 0; // Total current market value of holdings

    Object.entries(portfolio.assets).forEach(([assetId, holding]) => {
      const asset = assets.find(a => a.id === assetId);
      if (asset) {
        totalInvested += holding.averagePrice * holding.quantity; // Add cost basis
        totalCurrentValue += asset.currentPrice * holding.quantity; // Add current value
      }
    });

    // Avoid division by zero if nothing is invested
    if (totalInvested === 0) return 0;

    // Calculate percentage change
    return ((totalCurrentValue - totalInvested) / totalInvested) * 100;
  };

  /** Generates data formatted for the portfolio allocation PieChart. */
  const getPortfolioAllocationData = () => {
    const categoryMap: Record<string, number> = {}; // Map category name to total value
    let totalPortfolioValue = 0; // Total value of all assets held

    // Calculate value per category
    Object.entries(portfolio.assets).forEach(([assetId, holding]) => {
      const asset = assets.find(a => a.id === assetId);
      if (asset) {
        const value = asset.currentPrice * holding.quantity;
        totalPortfolioValue += value; // Add to total portfolio value
        // Add value to the corresponding category
        categoryMap[asset.category] = (categoryMap[asset.category] || 0) + value;
      }
    });

    // Avoid division by zero if portfolio is empty
    if (totalPortfolioValue === 0) return [];

    // Format data for PieChart
    const chartData = Object.entries(categoryMap).map(([category, value]) => {
      const colorStyle = getCategoryStyle(category as AssetCategory); // Get color for the category
      const backgroundColor = colorStyle.backgroundColor;
      const percentage = (value / totalPortfolioValue) * 100;
      const roundedPercentage = percentage.toFixed(1); // Format percentage
      return {
        name: `% ${category}`, // Label for the chart slice (e.g., "% Stocks")
        value: parseFloat(roundedPercentage), // Numerical value for the slice size
        legend: `${category}: ${roundedPercentage}%`, // Text for the legend item
        color: backgroundColor, // Color of the slice
        legendFontColor: '#333333', // Legend text color
        legendFontSize: 12 // Legend text size
      };
    });

    return chartData; // Return formatted data
  };

  /** Generates data formatted for the portfolio performance LineChart. */
  const getPortfolioPerformanceData = () => {
    // If no transactions, show only the current balance
    if (portfolio.transactions.length === 0) {
      return {
        labels: ['Now'], // Single label
        datasets: [{
          data: [portfolio.balance], // Single data point
          color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`, // Line color
          strokeWidth: 2.5
        }]
      };
    }

    // Simulate historical portfolio value based on recent transactions (simplified)
    const dataPoints: {date: Date, value: number}[] = [];
    // Start with the current total value
    dataPoints.push({
      date: new Date(),
      value: calculateTotalPortfolioValue()
    });

    // Look back at the last ~6 transactions to estimate past values
    // This is a very rough estimation and doesn't account for price changes between transactions.
    // A proper implementation would require historical price data for all held assets.
    const recentTransactions = portfolio.transactions.slice(0, 6); // Limit to recent transactions for simplicity
    for (let i = 0; i < recentTransactions.length; i++) {
      const transaction = recentTransactions[i];
      const asset = assets.find(a => a.id === transaction.assetId);
      if (!asset) continue; // Skip if asset details not found

      // Estimate the portfolio value *before* this transaction occurred
      let estimatedPreviousValue = dataPoints[dataPoints.length - 1].value; // Start with the most recent known value
      // Reverse the transaction's effect on value (using current price as an approximation)
      if (transaction.type === 'buy') {
        estimatedPreviousValue -= asset.currentPrice * transaction.quantity; // Subtract value of bought asset
      } else { // Sell
        estimatedPreviousValue += asset.currentPrice * transaction.quantity; // Add back value of sold asset
      }

      // Add the estimated past value and the transaction date
      dataPoints.push({
        date: new Date(transaction.date), // Use the transaction's date
        value: Math.max(estimatedPreviousValue, 0) // Ensure value doesn't go negative
      });
    }

    // Sort data points chronologically
    dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Extract labels (formatted dates) and values for the chart
    const labels = dataPoints.map(dp => {
      const d = new Date(dp.date);
      return `${d.getDate()}/${d.getMonth() + 1}`; // Format as DD/MM
    });
    const values = dataPoints.map(dp => dp.value);

    // Return data formatted for LineChart
    return {
      labels,
      datasets: [{
        data: values,
        color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`, // Line color
        strokeWidth: 2.5
      }]
    };
  };

  // --- Render Functions ---

  /** Renders a single asset item in the FlatList. */
  const renderAssetItem = ({ item: asset }: { item: Asset }) => {
    const holding = portfolio.assets[asset.id]; // Check if user holds this asset
    const hasHolding = holding && holding.quantity > 0;
    const holdingValue = hasHolding ? holding.quantity * asset.currentPrice : 0; // Calculate current value of holding
    const categoryStyle = getCategoryStyle(asset.category); // Get styling for the asset category

    return (
      <TouchableOpacity style={styles.assetCard} onPress={() => openAssetDetails(asset)}>
        {/* Asset Header: Symbol, Name, Category Tag, Favorite Button */}
        <View style={styles.assetHeader}>
          <View style={styles.assetTitleContainer}>
            <Text style={styles.assetSymbol}>{asset.symbol}</Text>
            <Text style={styles.assetName} numberOfLines={1}>{asset.name}</Text>
            {/* Category Tag */}
            <View style={[styles.categoryTag, { backgroundColor: categoryStyle.backgroundColor }]}>
              <Text style={[styles.categoryText, { color: categoryStyle.textColor }]}>{asset.category}</Text>
            </View>
          </View>
          {/* Favorite Button */}
          <TouchableOpacity style={styles.favoriteButton} onPress={(e) => { e.stopPropagation(); toggleFavorite(asset.id); }}>
            <Ionicons name={asset.favorite ? 'star' : 'star-outline'} size={20} color={asset.favorite ? '#FFC700' : '#BBBBBB'} />
          </TouchableOpacity>
        </View>
        {/* Asset Details: Price, Change, Market Info */}
        <View style={styles.assetDetails}>
          {/* Price and 24h Change */}
          <View style={styles.priceContainer}>
            <Text style={styles.assetPrice}>£{asset.currentPrice.toFixed(2)}</Text>
            <Text style={[styles.priceChange, asset.priceChangePercentage24h >= 0 ? styles.positiveChange : styles.negativeChange]}>
              {asset.priceChangePercentage24h >= 0 ? '↑' : '↓'} {Math.abs(asset.priceChangePercentage24h).toFixed(2)}%
            </Text>
          </View>
          {/* Market Cap and Volume */}
          <View style={styles.marketInfoContainer}>
            <View style={styles.marketInfoItem}>
              <Text style={styles.marketInfoLabel}>Market Cap</Text>
              <Text style={styles.marketInfoValue}>£{(asset.marketCap / 1000000000).toFixed(2)}B</Text>
            </View>
            <View style={styles.marketInfoItem}>
              <Text style={styles.marketInfoLabel}>24h Vol</Text>
              <Text style={styles.marketInfoValue}>£{(asset.volume24h / 1000000).toFixed(1)}M</Text>
            </View>
          </View>
        </View>
        {/* Holding Info (if user owns the asset) */}
        {hasHolding && (
          <View style={styles.holdingInfo}>
            <Text style={styles.holdingText}>
              Owned: {holding.quantity.toFixed(holding.quantity < 1 ? 6 : 2)} {asset.symbol}
            </Text>
            <Text style={styles.holdingValue}>Value: £{holdingValue.toFixed(2)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /** Renders a single transaction item in the portfolio's transaction list. */
  const renderTransactionItem = ({ item }: { item: Transaction }) => { // Removed type assertion
    const asset = assets.find(a => a.id === item.assetId); // Find asset details
    if (!asset) return null; // Don't render if asset not found

    return (
      <View style={styles.transactionCard}>
        {/* Transaction Header: Type, Symbol, Date/Time */}
        <View style={styles.transactionHeader}>
          <View style={styles.transactionTitleContainer}>
            <Text style={styles.transactionTitle}>
              {item.type === 'buy' ? 'Bought' : 'Sold'} {asset.symbol}
            </Text>
            <Text style={styles.transactionSubtitle}>
              {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
        </View>
        {/* Transaction Details: Quantity, Price, Total Value */}
        <View style={styles.transactionDetailsRow}>
          <View style={styles.transactionDetail}>
            <Text style={styles.transactionDetailLabel}>Quantity</Text>
            <Text style={styles.transactionDetailValue}>
              {item.quantity.toFixed(item.quantity < 0.01 ? 6 : 4)} {asset.symbol}
            </Text>
          </View>
          <View style={styles.transactionDetail}>
            <Text style={styles.transactionDetailLabel}>Price</Text>
            <Text style={styles.transactionDetailValue}>£{item.price.toFixed(2)}</Text>
          </View>
          <View style={styles.transactionDetail}>
            <Text style={styles.transactionDetailLabel}>Total</Text>
            <Text style={[
              styles.transactionDetailValue,
              // Style amount based on buy (negative impact on cash) or sell (positive)
              item.type === 'buy' ? styles.negativeChange : styles.positiveChange
            ]}>
              {item.type === 'buy' ? '-' : '+'}£{item.amount.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  /** Generates the data array for the portfolio FlatList based on the active sub-tab. */
  const generatePortfolioListData = () => {
    const listData: any[] = []; // Initialize empty array

    if (activePortfolioTab === 'holdings') {
      // Generate data for holdings list
      const holdingsData = Object.entries(portfolio.assets)
        // Map holdings to HoldingDataItem structure
        .map(([assetId, holding]): (HoldingDataItem & { type: 'holding'; id: string }) | null => {
          if (holding.quantity <= 1e-9) return null; // Ignore negligible quantities
          const asset = assets.find(a => a.id === assetId);
          if (!asset) return null; // Skip if asset details not found
          const currentValue = asset.currentPrice * holding.quantity;
          // Add type and unique ID for FlatList key
          return { assetId, asset, holding, value: currentValue, type: 'holding', id: `holding-${assetId}` };
        })
        // Filter out null items (negligible quantity or missing asset)
        .filter((item): item is HoldingDataItem & { type: 'holding'; id: string } => item !== null)
        // Sort holdings by current value descending
        .sort((a, b) => b.value - a.value);

      // Add holdings data or empty state message to the list
      if (holdingsData.length > 0) {
        listData.push(...holdingsData);
      } else {
        listData.push({ type: 'emptyHoldings', id: 'empty-holdings' }); // Placeholder for empty message
      }
    } else { // activePortfolioTab === 'transactions'
      // Generate data for transactions list
      if (portfolio.transactions.length > 0) {
        // Map transactions, adding itemType and unique ID
        const transactionItems = portfolio.transactions.map(t => ({
          ...t,
          itemType: 'transaction', // Use itemType to avoid conflict with transaction's own 'type' ('buy'/'sell')
          id: `tx-${t.id}` // Unique ID for FlatList key
        }));
        listData.push(...transactionItems);
      } else {
        listData.push({ type: 'emptyTransactions', id: 'empty-transactions' }); // Placeholder for empty message
      }
    }

    return listData; // Return the combined list data
  };

  /** Renders items in the portfolio FlatList (holdings or transactions). */
  const renderPortfolioItem = ({ item }: { item: any }) => {
    // Determine item type (check itemType first for transactions)
    const itemDisplayType = item.itemType === 'transaction' ? item.itemType : item.type;

    switch (itemDisplayType) {
      case 'holding':
        // Render a holding card
        const { asset, holding } = item;
        const currentValue = asset.currentPrice * holding.quantity;
        const investedValue = holding.averagePrice * holding.quantity;
        const profit = currentValue - investedValue;
        // Calculate profit percentage, avoiding division by zero
        const profitPercentage = investedValue !== 0 ? (profit / investedValue) * 100 : 0;
        return (
          <TouchableOpacity
            style={styles.holdingCard} // Use specific style for holding card
            onPress={() => openAssetDetails(asset)} // Open detail modal on press
          >
            {/* Holding Header: Symbol, Name */}
            <View style={styles.holdingHeader}>
              <Text style={styles.holdingSymbol}>{asset.symbol}</Text>
              <Text style={styles.holdingName} numberOfLines={1}>{asset.name}</Text>
            </View>
            {/* Holding Details: Quantity, Value, Profit/Loss */}
            <View style={styles.holdingDetails}>
              {/* Quantity */}
              <View style={styles.holdingQuantity}>
                <Text style={styles.holdingLabel}>Quantity</Text>
                <Text style={styles.holdingValueText}>{holding.quantity.toFixed(holding.quantity < 0.01 ? 6 : 4)}</Text>
              </View>
              {/* Current Value */}
              <View style={styles.holdingCurrentValue}>
                <Text style={styles.holdingLabel}>Current Value</Text>
                <Text style={styles.holdingValueText}>£{currentValue.toFixed(2)}</Text>
              </View>
              {/* Profit/Loss */}
              <View style={styles.holdingProfit}>
                <Text style={styles.holdingLabel}>Profit/Loss</Text>
                <Text style={[styles.holdingValueText, profit >= 0 ? styles.positiveChange : styles.negativeChange]}>
                  {profit >= 0 ? '+' : ''}£{profit.toFixed(2)} ({profitPercentage.toFixed(2)}%)
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      case 'transaction':
        // Render a transaction item using the dedicated function
        // The original item.type ('buy'/'sell') is preserved within the item object
        return renderTransactionItem({ item });
      case 'emptyHoldings':
        // Render message when no holdings exist
         return (
              <View style={[styles.emptyState, styles.emptyStateCard]}>
                <MaterialCommunityIcons name="finance" size={48} color="#BBBBBB" />
                <Text style={styles.emptyStateText}>No investments yet.</Text>
                <Text style={styles.emptyStateSubtext}>Explore assets to start investing!</Text>
              </View>
            );
      case 'emptyTransactions':
        // Render message when no transactions exist
          return <Text style={[styles.emptyStateSubtext, { paddingVertical: 20, textAlign: 'center' }]}>No transactions yet</Text>;
      default:
        return null; // Should not happen if data generation is correct
    }
  };

  /** Renders the header component for the portfolio FlatList. */
  const renderPortfolioHeader = () => {
    const totalValue = calculateTotalPortfolioValue(); // Calculate total portfolio value
    const performance = calculatePortfolioPerformance(); // Calculate overall performance %
    const allocationData = getPortfolioAllocationData(); // Get data for allocation pie chart
    const performanceData = getPortfolioPerformanceData(); // Get data for performance line chart

    return (
      <View>
        {/* Portfolio Summary Card: Total Value, Performance, Available Cash */}
        <View style={styles.portfolioSummary}>
          {/* Left Side: Total Value & Performance */}
          <View style={styles.portfolioValueContainer}>
            <Text style={styles.portfolioLabel}>Total Value</Text>
            <Text style={styles.portfolioTotalValue}>£{totalValue.toFixed(2)}</Text>
            <View style={styles.portfolioPerformanceContainer}>
              <Text style={[styles.portfolioPerformance, performance >= 0 ? styles.positiveChange : styles.negativeChange]}>
                {performance >= 0 ? '+' : ''}{performance.toFixed(2)}%
              </Text>
              <Text style={styles.portfolioTimeframe}>All time</Text>
            </View>
          </View>
          {/* Right Side: Available Cash */}
          <View style={styles.portfolioCashContainer}>
            <Text style={styles.portfolioLabel}>Available Cash</Text>
            <Text style={styles.portfolioCashValueAdjusted}>£{portfolio.balance.toFixed(2)}</Text>
          </View>
        </View>

        {/* Performance Line Chart */}
        <View style={styles.portfolioChartContainer}>
          <Text style={styles.chartTitle}>Portfolio Performance</Text>
          {/* Render chart only if there's enough data (more than one point) */}
          {performanceData.datasets[0].data.length > 1 ? (
            <LineChart
              data={performanceData}
              width={screenWidth - 64} // Chart width adjusted for padding
              height={220} // Fixed height
              yAxisLabel="£" // Y-axis prefix
              chartConfig={{ // Specific config overrides for this chart
                ...chartConfig, // Base config
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`, // Line color
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`, // Label color
                propsForDots: { r: "0" }, // Hide dots on the line
                strokeWidth: 2.5, // Thicker line
                // Gradient fill below the line
                fillShadowGradientFrom: "#006a4d",
                fillShadowGradientTo: "#ffffff",
                fillShadowGradientOpacity: 0.15,
                // Style for background grid lines
                propsForBackgroundLines: {
                    strokeWidth: 0.5,
                    stroke: "rgba(0,0,0,0.08)", // Subtle grid lines
                    strokeDasharray: "" // Solid lines
                }
              }}
              bezier // Use smooth curves
              withDots={false} // Hide dots
              withShadow={true} // Enable shadow/fill below line
              withInnerLines={true} // Show horizontal grid lines
              withOuterLines={true} // Show outer border lines
              style={styles.improvedChart} // Apply specific styling
              yLabelsOffset={5} // Offset for Y-axis labels
              segments={4} // Number of horizontal grid lines
            />
          ) : (
             // Show message if not enough data for chart
             <View style={styles.chartLoadingContainer}>
               <Text style={styles.emptyStateSubtext}>Not enough data for performance chart.</Text>
             </View>
          )}
        </View>

        {/* Allocation Pie Chart */}
        {/* Render pie chart only if there is allocation data */}
        {allocationData.length > 0 && (
          <View style={styles.portfolioChartContainer}>
            <Text style={styles.chartTitle}>Asset Allocation</Text>
            <PieChart
              data={allocationData} // Data generated by getPortfolioAllocationData
              width={screenWidth - 64} // Chart width adjusted for padding
              height={220} // Fixed height
              chartConfig={{ // Simplified config for PieChart
                  color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`, // Default color (used if data item has no color)
                  labelColor: (opacity = 1) => `rgba(50, 50, 50, ${opacity})`, // Legend label color
              }}
              accessor="value" // Key in data object containing the numerical value for slice size
              backgroundColor="transparent" // Transparent background
              paddingLeft="15" // Padding on the left
              center={[10, 0]} // Adjust chart center position if needed
              absolute // Display absolute values (percentages in this case) on slices
              style={styles.pieChartStyle} // Apply specific styling
              // Note: PieChart legend is implicitly generated based on data structure
            />
          </View>
        )}

        {/* Sub-Tab Navigation: Holdings / Transactions */}
        <View style={styles.pillTabContainer}>
          <View style={styles.pillTabWrapper}>
            {/* Holdings Tab Button */}
            <TouchableOpacity
              style={[
                styles.pillTab,
                activePortfolioTab === 'holdings' && styles.activePillTab // Apply active style conditionally
              ]}
              onPress={() => setActivePortfolioTab('holdings')} // Switch tab on press
            >
              <Text style={[
                styles.pillTabText,
                activePortfolioTab === 'holdings' && styles.activePillTabText // Apply active text style conditionally
              ]}>Your Holdings</Text>
            </TouchableOpacity>
            {/* Transactions Tab Button */}
            <TouchableOpacity
              style={[
                styles.pillTab,
                activePortfolioTab === 'transactions' && styles.activePillTab
              ]}
              onPress={() => setActivePortfolioTab('transactions')}
            >
              <Text style={[
                styles.pillTabText,
                activePortfolioTab === 'transactions' && styles.activePillTabText
              ]}>Recent Transactions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  /** Renders the modal for displaying asset details and historical chart. */
  const renderAssetDetailModal = () => {
    if (!selectedAsset) return null; // Don't render if no asset is selected

    // Prepare data for the LineChart, handling potential missing data
    const assetChartData = {
      labels: selectedAsset.historicalData?.labels || [],
      datasets: [
        {
          data: selectedAsset.historicalData?.prices || [],
          color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`, // Line color
          strokeWidth: 2
        }
      ]
    };
    const hasChartData = assetChartData.labels.length > 0 && assetChartData.datasets[0].data.length > 0;

    return (
      <Modal
        visible={showAssetModal}
        animationType="slide" // Slide up animation
        transparent={true} // Allows underlying content to be partially visible (if modal content is not fully opaque)
        onRequestClose={() => setShowAssetModal(false)} // Handle Android back button
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Use TouchableWithoutFeedback to dismiss keyboard if description is editable */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              {/* Modal Header: Close Button, Title (optional), Favorite Button */}
              <View style={styles.modalHeader}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowAssetModal(false)}>
                  <Ionicons name="chevron-down" size={28} color="#333" />
                </TouchableOpacity>
                {/* Optional Title - currently empty */}
                <Text style={styles.modalTitle}></Text>
                {/* Favorite Button */}
                <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(selectedAsset.id)}>
                  <Ionicons
                    name={selectedAsset.favorite ? "star" : "star-outline"}
                    size={24}
                    color={selectedAsset.favorite ? "#FFC700" : "#BBBBBB"}
                  />
                </TouchableOpacity>
              </View>

              {/* Scrollable Content Area */}
              <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps='handled'>
                {/* Asset Header in Modal: Symbol, Name, Category */}
                <View style={styles.assetPriceHeader}>
                   <Text style={styles.assetSymbol}>{selectedAsset.symbol}</Text>
                   <Text style={styles.assetName} numberOfLines={1}>{selectedAsset.name}</Text>
                   {/* Category Tag */}
                   <View style={[styles.categoryTag, getCategoryStyle(selectedAsset.category)]}>
                     <Text style={[styles.categoryText, { color: getCategoryStyle(selectedAsset.category).textColor }]}>
                       {selectedAsset.category}
                     </Text>
                   </View>
                   {/* Current Price and Change */}
                   <Text style={styles.assetDetailPrice}>£{selectedAsset.currentPrice.toFixed(2)}</Text>
                   <Text style={[
                       styles.assetDetailPriceChange,
                       selectedAsset.priceChangePercentage24h >= 0 ? styles.positiveChange : styles.negativeChange
                   ]}>
                       {selectedAsset.priceChangePercentage24h >= 0 ? '+' : ''}{selectedAsset.priceChange24h.toFixed(2)}
                       ({selectedAsset.priceChangePercentage24h.toFixed(2)}%) 24h
                   </Text>
                </View>

                {/* Historical Price Chart */}
                <View style={styles.cleanChartContainer}>
                  {hasChartData ? (
                    <LineChart
                      data={assetChartData}
                      width={screenWidth - 44} // Adjust width for container padding
                      height={180} // Smaller height for modal chart
                      chartConfig={{ // Specific config for modal chart
                        ...chartConfig,
                        backgroundGradientFrom: "#ffffff",
                        backgroundGradientTo: "#ffffff",
                        color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.5})`, // Lighter labels
                        propsForDots: { r: "0" }, // No dots
                        strokeWidth: 1.5, // Thinner line
                        fillShadowGradientFrom: "#006a4d",
                        fillShadowGradientTo: "#ffffff",
                        fillShadowGradientOpacity: 0.1, // Subtle fill
                        propsForBackgroundLines: { strokeWidth: 0 } // Hide background lines
                      }}
                      bezier
                      withDots={false}
                      withShadow={true}
                      withInnerLines={false} // No inner lines
                      withOuterLines={false} // No outer lines
                      withVerticalLabels={false} // Hide X-axis labels
                      withHorizontalLabels={false} // Hide Y-axis labels
                      style={styles.cleanChart}
                    />
                  ) : (
                    // Show loading or no data message for chart
                    <View style={styles.chartLoadingContainer}>
                      <ActivityIndicator size="small" color="#006a4d" />
                      <Text style={styles.chartLoadingText}>Loading chart data...</Text>
                    </View>
                  )}
                </View>

                {/* Key Statistics */}
                <View style={styles.compactStatsContainer}>
                  <View style={styles.assetStat}><Text style={styles.assetStatLabel}>Market Cap</Text><Text style={styles.assetStatValue}>£{(selectedAsset.marketCap / 1000000000).toFixed(2)}B</Text></View>
                  <View style={styles.assetStat}><Text style={styles.assetStatLabel}>Volume (24h)</Text><Text style={styles.assetStatValue}>£{(selectedAsset.volume24h / 1000000).toFixed(1)}M</Text></View>
                  {/* Add more stats if available, e.g., P/E Ratio, Dividend Yield */}
                </View>

                {/* Asset Description */}
                {selectedAsset.description && (
                  <Text style={styles.compactAssetDescription}>{selectedAsset.description}</Text>
                )}

              </ScrollView>

              {/* Buy/Sell Buttons Footer */}
              <View style={styles.compactTransactionButtons}>
                <TouchableOpacity
                  style={[styles.transactionButton, styles.buyButton]}
                  onPress={() => openTransactionModal('buy')}
                >
                  <Text style={styles.transactionButtonText}>Buy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.transactionButton, styles.sellButton]}
                  onPress={() => openTransactionModal('sell')}
                >
                  <Text style={styles.transactionButtonText}>Sell</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </Modal>
    );
  };

  /** Renders the modal for executing a buy or sell transaction. */
  const renderTransactionModal = () => {
    if (!selectedAsset) return null; // Don't render if no asset selected

    // Estimate the quantity of asset based on the entered amount
    const amountValue = parseFloat(transactionAmount);
    const estimatedQuantity = (isNaN(amountValue) || amountValue <= 0 || selectedAsset.currentPrice <= 0)
      ? 0
      : amountValue / selectedAsset.currentPrice;

    // Determine max sellable quantity if selling
    const maxSellQuantity = portfolio.assets[selectedAsset.id]?.quantity || 0;
    const maxSellAmount = maxSellQuantity * selectedAsset.currentPrice;

    return (
      <Modal
        visible={showTransactionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTransactionModal(false)}
      >
        {/* KeyboardAvoidingView to push content up when keyboard appears */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer} // Use modalContainer for overlay effect
          keyboardVerticalOffset={10} // Adjust offset as needed
        >
          {/* TouchableWithoutFeedback to dismiss keyboard when tapping outside input */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowTransactionModal(false)}>
                  <Ionicons name="chevron-down" size={28} color="#333" />
                </TouchableOpacity>
                {/* Title indicating action and asset */}
                <Text style={styles.modalTitle}>
                  {transactionType === 'buy' ? 'Buy' : 'Sell'} {selectedAsset.symbol}
                </Text>
                {/* Placeholder for potential right-side element */}
                <View style={{ width: 28 }} />
              </View>

              {/* Transaction Form Content */}
              <View style={styles.transactionForm}>
                {/* Asset Info: Current Price */}
                <View style={styles.assetInfoContainer}>
                  <Text style={styles.assetInfoLabel}>Current Price</Text>
                  <Text style={styles.assetInfoValue}>£{selectedAsset.currentPrice.toFixed(2)}</Text>
                </View>
                {/* Asset Info: Available Balance or Holdings */}
                <View style={styles.assetInfoContainer}>
                  <Text style={styles.assetInfoLabel}>
                    {transactionType === 'buy' ? 'Available Balance' : 'Owned Quantity'}
                  </Text>
                  <Text style={styles.assetInfoValue}>
                    {transactionType === 'buy'
                      ? `£${portfolio.balance.toFixed(2)}`
                      : `${maxSellQuantity.toFixed(maxSellQuantity < 1 ? 6 : 4)} ${selectedAsset.symbol}`
                    }
                  </Text>
                </View>

                {/* Amount Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Amount (£)</Text>
                  <View style={styles.improvedInputWrapper}>
                    <TextInput
                      style={styles.improvedAmountInput}
                      value={transactionAmount}
                      onChangeText={(text) => {
                        // Allow only numbers and one decimal point
                        const numericValue = text.replace(/[^0-9.]/g, '');
                        const parts = numericValue.split('.');
                        if (parts.length > 2) return; // Prevent multiple decimal points
                        if (parts[1] && parts[1].length > 2) return; // Limit to 2 decimal places
                        setTransactionAmount(numericValue);
                      }}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor="#bbb"
                      autoFocus={true} // Focus input on modal open
                    />
                  </View>
                  {/* Button to set max amount when selling */}
                  {transactionType === 'sell' && maxSellAmount > 0 && (
                     <TouchableOpacity onPress={() => setTransactionAmount(maxSellAmount.toFixed(2))}>
                       <Text style={styles.maxButtonText}>Sell Max: £{maxSellAmount.toFixed(2)}</Text>
                     </TouchableOpacity>
                  )}
                </View>

                {/* Estimated Quantity */}
                <View style={styles.estimatedContainer}>
                  <Text style={styles.estimatedLabel}>Estimated Quantity</Text>
                  <Text style={styles.estimatedValue}>
                    {estimatedQuantity.toFixed(estimatedQuantity < 0.01 ? 6 : 4)} {selectedAsset.symbol}
                  </Text>
                </View>

                {/* Confirm Transaction Button */}
                <TouchableOpacity
                  style={styles.improvedTransactionButton}
                  onPress={processTransaction}
                  // Disable button if amount is invalid or exceeds limits
                  disabled={isNaN(amountValue) || amountValue <= 0 || (transactionType === 'buy' && amountValue > portfolio.balance) || (transactionType === 'sell' && amountValue > maxSellAmount + 0.001)} // Add tolerance for float comparison
                >
                  <Text style={styles.improvedTransactionButtonText}>
                    Confirm {transactionType === 'buy' ? 'Buy' : 'Sell'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  /** Renders the horizontal category filter buttons. */
  const renderCategoryFilter = () => {
    const categories: (AssetCategory | 'All')[] = ['All', 'Stocks', 'ETFs', 'Crypto', 'Bonds', 'Real Estate'];
    return (
      <View style={styles.categoryFilterWrapper}>
        <ScrollView
          ref={categoryScrollViewRef} // Assign ref
          horizontal // Enable horizontal scrolling
          showsHorizontalScrollIndicator={false} // Hide scrollbar
          contentContainerStyle={styles.categoryFilterContainer} // Style for scroll content
          onScroll={handleCategoryScroll} // Handle scroll events
          scrollEventThrottle={16} // Optimize scroll event frequency
        >
          {/* Map through categories to create buttons */}
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              // Apply active style if this category is selected
              style={[
                styles.categoryFilterButton,
                selectedCategory === category && styles.categoryFilterButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)} // Set selected category on press
            >
              <Text
                // Apply active text style if selected
                style={[
                  styles.categoryFilterText,
                  selectedCategory === category && styles.categoryFilterTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Right Arrow Indicator (shown if not scrolled to end) */}
        {showCategoryIndicator && (
          <View style={styles.scrollIndicator}>
            <Ionicons name="chevron-forward" size={20} color="#aaaaaa" />
          </View>
        )}
      </View>
    );
  };

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.container}>
      {/* Screen Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Investments</Text>
        <Text style={styles.subtitle}>Explore assets and manage your portfolio</Text>
      </View>

      {/* Main Tab Navigation: Assets / Portfolio */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assets' && styles.activeTab]}
          onPress={() => setActiveTab('assets')}
        >
          <Text style={[styles.tabText, activeTab === 'assets' && styles.activeTabText]}>Assets</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'portfolio' && styles.activeTab]}
          onPress={() => setActiveTab('portfolio')}
        >
          <Text style={[styles.tabText, activeTab === 'portfolio' && styles.activeTabText]}>Portfolio</Text>
        </TouchableOpacity>
      </View>

      {/* Conditional Content based on Active Tab */}
      {activeTab === 'assets' ? (
        // --- Assets Tab Content ---
        <View style={styles.contentContainer}>
          {/* Search and Sort Filters */}
          <View style={styles.filtersContainer}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#777" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name or symbol..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {/* Clear search button */}
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              ) : null}
            </View>
            {/* Sort Button (Example - could open a modal for more options) */}
            <TouchableOpacity style={styles.sortButton} onPress={() => {
              // Cycle through sort options
              const nextSort = sortOption === 'name' ? 'price' : sortOption === 'price' ? 'change' : 'name';
              setSortOption(nextSort);
            }}>
              <Ionicons name="swap-vertical" size={20} color="#333" />
              <Text style={styles.sortLabel}>
                {sortOption === 'name' ? 'Name' : sortOption === 'price' ? 'Price' : 'Change'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category Filter Buttons */}
          {renderCategoryFilter()}

          {/* Asset List */}
          {loading ? (
            // Loading Indicator
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#006a4d" />
              <Text style={styles.loadingText}>Loading Assets...</Text>
            </View>
          ) : (
            // Actual List
            <FlatList
              data={filteredAssets}
              renderItem={renderAssetItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.assetList}
              refreshControl={ // Pull-to-refresh
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#006a4d"]} />
              }
              ListEmptyComponent={ // Message when no assets match filters
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color="#BBBBBB" />
                  <Text style={styles.emptyStateText}>No Assets Found</Text>
                  <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters.</Text>
                </View>
              }
            />
          )}
        </View>
      ) : (
        // --- Portfolio Tab Content ---
        <FlatList
          data={generatePortfolioListData()} // Use combined data source
          renderItem={renderPortfolioItem} // Use combined render function
          keyExtractor={(item) => item.id} // Use unique ID from generated data
          ListHeaderComponent={renderPortfolioHeader} // Render summary and charts as header
          contentContainerStyle={styles.portfolioListContainer} // Style for the list container
          refreshControl={ // Pull-to-refresh
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#006a4d"]} />
          }
        />
      )}

      {/* Render Modals */}
      {renderAssetDetailModal()}
      {renderTransactionModal()}
    </SafeAreaView>
  );
};

// --- Helper Functions ---

/** Returns specific background and text color based on asset category. */
const getCategoryStyle = (category: AssetCategory): { backgroundColor: string; textColor: string } => {
  switch (category) {
    case 'Stocks': return { backgroundColor: '#4A90E2', textColor: '#FFFFFF' }; // Blue
    case 'ETFs': return { backgroundColor: '#50E3C2', textColor: '#004D40' }; // Teal
    case 'Crypto': return { backgroundColor: '#F5A623', textColor: '#FFFFFF' }; // Orange
    case 'Bonds': return { backgroundColor: '#7ED321', textColor: '#004D40' }; // Green
    case 'Real Estate': return { backgroundColor: '#9013FE', textColor: '#FFFFFF' }; // Purple
    default: return { backgroundColor: '#BD10E0', textColor: '#FFFFFF' }; // Default Pink/Magenta
  }
};

// --- Styles ---
const styles = StyleSheet.create({
  // --- Main Containers ---
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8', // Light background for the whole screen
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f4f6f8', // Background for the main content area (Assets tab)
  },
  loadingContainer: { // Centered loading indicator
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6f8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#777',
  },
  emptyState: { // Style for empty list messages
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#777',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyStateCard: { // Specific style for empty holdings card in portfolio
    paddingVertical: 30,
    backgroundColor: '#ffffff', // White background
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 16, // Add horizontal margin
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  // --- Header ---
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#ffffff', // White header background
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },

  // --- Tab Navigation ---
  tabContainer: { // Container for main Assets/Portfolio tabs
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  tab: { // Individual tab button
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: { // Style for the active main tab
    borderBottomWidth: 3,
    borderBottomColor: '#006a4d', // Bankable green underline
  },
  tabText: { // Text style for inactive tab
    fontSize: 16,
    color: '#777',
  },
  activeTabText: { // Text style for active tab
    color: '#006a4d',
    fontWeight: '600',
  },
  pillTabContainer: { // Container for sub-tabs (Holdings/Transactions) in Portfolio
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12, // Increased padding
    paddingHorizontal: 16,
    backgroundColor: '#f4f6f8', // Match screen background
    marginTop: 8, // Add margin top
  },
  pillTabWrapper: { // Wrapper for the pill buttons
    flexDirection: 'row',
    backgroundColor: '#e9ecef', // Lighter background for the wrapper
    borderRadius: 20,
    overflow: 'hidden',
    padding: 4, // Inner padding
  },
  pillTab: { // Individual pill button
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16, // Slightly less rounded
  },
  activePillTab: { // Style for the active pill button
    backgroundColor: '#015F45', // Bankable green background
    shadowColor: '#000', // Add shadow to active pill
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  pillTabText: { // Text style for inactive pill
    fontSize: 14, // Smaller font size
    fontWeight: '500',
    color: '#015F45', // Bankable green text
  },
  activePillTabText: { // Text style for active pill
    color: '#ffffff', // White text
    fontWeight: '600',
  },

  // --- Filters (Assets Tab) ---
  filtersContainer: { // Container for search and sort
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  searchContainer: { // Search input container
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0', // Light gray background
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8, // Adjust padding for platform
    marginRight: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333', // Darker text color
  },
  sortButton: { // Sort button container
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8, // Match search input padding
    backgroundColor: '#f0f0f0', // Match search background
    borderRadius: 8,
  },
  sortLabel: { // Text label for sort button
    marginLeft: 5,
    fontSize: 14,
    color: '#333',
  },
  categoryFilterWrapper: { // Wrapper for category ScrollView and indicator
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 16, // Add left padding
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  categoryFilterContainer: { // Content container for category ScrollView
    paddingRight: 16, // Add right padding inside scroll
    flexGrow: 0, // Prevent container from growing vertically
  },
  categoryFilterButton: { // Individual category button
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#e9ecef', // Default background
    borderWidth: 1,
    borderColor: '#dee2e6', // Add subtle border
  },
  categoryFilterButtonActive: { // Style for active category button
    backgroundColor: '#006a4d', // Bankable green background
    borderColor: '#005c41', // Darker border for active
  },
  categoryFilterText: { // Text style for inactive category
    fontSize: 14,
    color: '#015F45', // Bankable green text
    fontWeight: '500',
  },
  categoryFilterTextActive: { // Text style for active category
    color: '#ffffff', // White text
    fontWeight: '600',
  },
  scrollIndicator: { // Container for the right arrow indicator
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#fff', // Match background
    height: '100%', // Ensure it takes full height
  },

  // --- Asset List (Assets Tab) ---
  assetList: { // Style for the FlatList content container
    paddingHorizontal: 16, // Horizontal padding for the list
    paddingBottom: 16, // Bottom padding
    paddingTop: 4,
  },
  assetCard: { // Style for each asset card
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12, // Space between cards
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // Subtle shadow
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  assetHeader: { // Top section of the asset card
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align items to the top
    marginBottom: 12,
  },
  assetTitleContainer: { // Container for symbol, name, category
    flex: 1, // Take available space
    marginRight: 8, // Space before favorite button
  },
  assetSymbol: {
    fontSize: 16,
    fontWeight: '700', // Bold symbol
    color: '#333',
  },
  assetName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  categoryTag: { // Small tag showing asset category
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start', // Align tag to the left
    marginTop: 4, // Space above tag
  },
  categoryText: { // Text inside the category tag
    fontSize: 12,
    fontWeight: '500',
    // Text color is set dynamically by getCategoryStyle
  },
  favoriteButton: { // Favorite star button
    padding: 4, // Touch area
  },
  assetDetails: { // Middle section of the asset card (price, market info)
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end', // Align items to bottom
    marginTop: 8,
  },
  priceContainer: { // Container for price and 24h change
    alignItems: 'flex-start', // Align text to left
  },
  assetPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  priceChange: { // Text for 24h price change percentage
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2, // Space above change text
  },
  positiveChange: { // Style for positive price change
    color: '#00B16A', // Green
  },
  negativeChange: { // Style for negative price change
    color: '#FF5454', // Red
  },
  marketInfoContainer: { // Container for market cap and volume
    alignItems: 'flex-end', // Align text to right
  },
  marketInfoItem: { // Individual market info item (e.g., Market Cap)
    alignItems: 'flex-end',
    marginTop: 4, // Space between market info items
  },
  marketInfoLabel: { // Label text (e.g., "Market Cap")
    fontSize: 12,
    color: '#999',
  },
  marketInfoValue: { // Value text (e.g., "£1.23B")
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  holdingInfo: { // Bottom section of asset card (shown if user holds the asset)
    marginTop: 12, // Space above holding info
    paddingTop: 10, // Space inside the border
    borderTopWidth: 1,
    borderTopColor: '#eee', // Separator line
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  holdingText: { // Text showing quantity owned
    fontSize: 14,
    color: '#666',
  },
  holdingValue: { // Text showing current value of holding
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // --- Portfolio Tab ---
  portfolioListContainer: { // Style for the Portfolio FlatList content
     paddingBottom: 16,
     backgroundColor: '#f4f6f8', // Match screen background
  },
  portfolioSummary: { // Card showing overall portfolio summary
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16, // Add horizontal margin
    marginTop: 16, // Add top margin
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  portfolioValueContainer: { // Left side of summary card (Total Value)
    flex: 2, // Take more space
    borderRightWidth: 1,
    borderRightColor: '#eaeaea',
    paddingRight: 16,
  },
  portfolioLabel: { // Label text (e.g., "Total Value")
    fontSize: 14,
    color: '#777',
  },
  portfolioTotalValue: { // Main value text (e.g., "£12,345.67")
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  portfolioPerformanceContainer: { // Container for performance % and timeframe
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolioPerformance: { // Performance percentage text
    fontSize: 16,
    fontWeight: '600',
    // Color is set dynamically (positive/negative)
  },
  portfolioTimeframe: { // Text like "All time"
    marginLeft: 8,
    fontSize: 14,
    color: '#777',
  },
  portfolioCashContainer: { // Right side of summary card (Available Cash)
    flex: 1, // Take less space
    paddingLeft: 16,
    justifyContent: 'center', // Center cash vertically
  },
  portfolioCashValueAdjusted: { // Adjusted cash value text style
    fontSize: 20, // Slightly smaller than total value
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  portfolioChartContainer: { // Container for charts in portfolio view
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16, // Add horizontal margin
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: { // Title above charts (e.g., "Portfolio Performance")
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chartLoadingContainer: { // Container for chart loading state
    height: 220, // Match chart height
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLoadingText: { // Text shown while chart is loading
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  improvedChart: { // Specific style for the performance line chart
    marginVertical: 8,
    borderRadius: 16, // Match container radius
  },
  pieChartStyle: { // Specific style for the allocation pie chart
    borderRadius: 12, // Match container radius
    marginVertical: 8,
  },
  holdingCard: { // Card for displaying a single holding in the portfolio list
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16, // Add horizontal margin
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  holdingHeader: { // Top section of holding card (Symbol, Name)
    marginBottom: 12,
  },
  holdingSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  holdingName: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  holdingDetails: { // Bottom section of holding card (Quantity, Value, Profit)
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  holdingQuantity: { // Container for quantity info
    flex: 1,
  },
  holdingCurrentValue: { // Container for current value info
    flex: 1,
  },
  holdingProfit: { // Container for profit/loss info
    flex: 1.5, // Take slightly more space
    alignItems: 'flex-end', // Align profit to the right
  },
  holdingLabel: { // Label text (e.g., "Quantity")
    fontSize: 12,
    color: '#777',
  },
  holdingValueText: { // Value text within holding details
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2, // Space below label
  },
  transactionCard: { // Card for displaying a single transaction
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16, // Add horizontal margin
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: { // Top section of transaction card
    marginBottom: 12,
  },
  transactionTitleContainer: { // Container for type/symbol and date
    flex: 1,
  },
  transactionTitle: { // Main title (e.g., "Bought AAPL")
    fontSize: 16, // Slightly smaller than holding symbol
    fontWeight: 'bold',
    color: '#333',
  },
  transactionSubtitle: { // Date and time text
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  transactionDetailsRow: { // Row for quantity, price, total
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionDetail: { // Container for one detail item (e.g., Quantity)
    flex: 1, // Distribute space evenly
    alignItems: 'flex-start', // Align items left by default
  },
  transactionDetailLabel: { // Label text (e.g., "Quantity")
    fontSize: 12,
    color: '#777',
  },
  transactionDetailValue: { // Value text (e.g., "10.5 AAPL")
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2, // Space below label
    // Text color for total amount is set dynamically
  },

  // --- Modals ---
  modalContainer: { // Semi-transparent overlay for modals
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay
    justifyContent: 'flex-end', // Position modal at the bottom
  },
  modalContent: { // Main content area of the modal
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20, // Rounded top corners
    borderTopRightRadius: 20,
    overflow: 'hidden', // Clip content to rounded corners
    maxHeight: '90%', // Limit modal height
  },
  modalHeader: { // Header section of the modal
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12, // Vertical padding
    paddingHorizontal: 16, // Horizontal padding
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  modalTitle: { // Title text in the modal header
    fontSize: 18,
    fontWeight: '600', // Semi-bold
    color: '#333',
    textAlign: 'center', // Center title
    flex: 1, // Allow title to take space
    marginHorizontal: 8, // Add margin around title
  },
  closeButton: { // Close button (chevron down)
    padding: 4, // Touch area
  },
  modalScroll: { // ScrollView inside the asset detail modal
    // MaxHeight is implicitly handled by modalContent maxHeight
  },

  // --- Asset Detail Modal Specific Styles ---
  assetPriceHeader: { // Section showing symbol, name, price in detail modal
    alignItems: 'center',
    paddingVertical: 16, // More vertical padding
    paddingHorizontal: 16,
  },
  assetDetailPrice: { // Price text in detail modal
    fontSize: 28, // Larger price
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8, // Space above price
  },
  assetDetailPriceChange: { // Price change text in detail modal
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    // Color is set dynamically
  },
  cleanChartContainer: { // Container for the chart in detail modal
    backgroundColor: "#ffffff", // White background
    borderRadius: 12,
    paddingVertical: 8, // Vertical padding
    marginHorizontal: 16, // Horizontal margin
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden', // Clip chart if needed
  },
  cleanChart: { // Style for the chart itself in detail modal
    marginVertical: 4,
    borderRadius: 8,
    paddingLeft: 0, // No extra padding inside chart
    marginRight: 0,
  },
  compactStatsContainer: { // Container for key stats in detail modal
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow stats to wrap
    paddingHorizontal: 16,
    paddingVertical: 12, // Vertical padding
    borderTopWidth: 1, // Separator line above stats
    borderTopColor: '#eee',
  },
  assetStat: { // Style for a single stat item
    width: '50%', // Two stats per row
    paddingVertical: 6, // Vertical padding for each stat
  },
  assetStatLabel: { // Label text for stat (e.g., "Market Cap")
    fontSize: 12,
    color: '#777',
  },
  assetStatValue: { // Value text for stat
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  compactAssetDescription: { // Description text in detail modal
    padding: 16,
    paddingTop: 12, // Less padding top
    fontSize: 14,
    color: '#555',
    lineHeight: 20, // Improve readability
    borderTopWidth: 1, // Separator line above description
    borderTopColor: '#eee',
  },
  compactTransactionButtons: { // Container for Buy/Sell buttons in detail modal footer
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12, // Vertical padding
    paddingHorizontal: 16, // Horizontal padding
    borderTopWidth: 1,
    borderTopColor: '#eaeaea', // Separator line
    backgroundColor: '#f8f9fa', // Slightly different background for footer
  },
  transactionButton: { // General style for Buy/Sell buttons
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Take equal width
    marginHorizontal: 8, // Space between buttons
    shadowColor: '#000', // Add shadow to buttons
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buyButton: { // Specific style for Buy button
    backgroundColor: '#006a4d', // Bankable green
  },
  sellButton: { // Specific style for Sell button
    backgroundColor: '#D9534F', // Red for sell
  },
  transactionButtonText: { // Text inside Buy/Sell buttons
    fontSize: 16, // Slightly smaller text
    fontWeight: 'bold',
    color: '#fff',
  },

  // --- Transaction Modal Specific Styles ---
  transactionForm: { // Padding for the form content inside transaction modal
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, // Adjust bottom padding for platforms
  },
  assetInfoContainer: { // Row displaying asset info (price, balance)
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12, // Vertical padding
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  assetInfoLabel: { // Label text (e.g., "Current Price")
    fontSize: 16,
    color: '#777',
  },
  assetInfoValue: { // Value text (e.g., "£123.45")
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  inputContainer: { // Container for the amount input field
    marginTop: 20,
  },
  inputLabel: { // Label above the amount input
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  improvedInputWrapper: { // Wrapper around the TextInput for styling
    borderWidth: 1,
    borderColor: '#ccc', // Slightly darker border
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 16, // Add horizontal padding
  },
  improvedAmountInput: { // Style for the amount TextInput
    fontSize: 24, // Larger font size for amount
    paddingVertical: 12,
    textAlign: 'left', // Align text left
    minHeight: 50, // Ensure minimum height
    fontWeight: '500',
    color: '#333',
  },
  maxButtonText: { // Text for the "Sell Max" button
     color: '#006a4d',
     textAlign: 'right',
     paddingVertical: 4,
     fontWeight: '500',
  },
  estimatedContainer: { // Row displaying estimated quantity
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 12, // Vertical padding
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  estimatedLabel: { // Label text ("Estimated Quantity")
    fontSize: 16,
    color: '#777',
  },
  estimatedValue: { // Value text for estimated quantity
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  improvedTransactionButton: { // Style for the confirm transaction button
    backgroundColor: '#006a4d', // Bankable green
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24, // More space above button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  improvedTransactionButtonText: { // Text inside confirm button
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default InvestmentsScreen; // Export the component