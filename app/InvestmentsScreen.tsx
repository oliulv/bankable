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
  Image,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get('window').width;

// Types
interface Asset {
  id: string;
  name: string;
  symbol: string;
  category: AssetCategory;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap: number;
  volume24h: number;
  favorite: boolean;
  description?: string;
  historicalData?: {
    labels: string[];
    prices: number[];
  };
}

interface Transaction {
  id: string;
  assetId: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  date: Date;
  quantity: number;
}

interface Portfolio {
  balance: number;
  assets: {
    [assetId: string]: {
      quantity: number;
      averagePrice: number;
    };
  };
  transactions: Transaction[];
}

type AssetCategory = 'Stocks' | 'ETFs' | 'Crypto' | 'Bonds' | 'Real Estate';

// Chart configuration
const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
  decimalPlaces: 2,
  style: {
    borderRadius: 16
  },
};

// Initial dummy data for assets
const initialAssets: Asset[] = [
  {
    id: '1',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    category: 'Stocks',
    currentPrice: 185.92,
    priceChange24h: 2.54,
    priceChangePercentage24h: 1.38,
    marketCap: 2892000000000,
    volume24h: 58249000,
    favorite: false,
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
    historicalData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      prices: [170.33, 178.61, 175.48, 173.50, 189.84, 185.92],
    },
  },
  {
    id: '2',
    name: 'Microsoft Corporation',
    symbol: 'MSFT',
    category: 'Stocks',
    currentPrice: 417.12,
    priceChange24h: -3.21,
    priceChangePercentage24h: -0.76,
    marketCap: 3100000000000,
    volume24h: 22456000,
    favorite: false,
    description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
    historicalData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      prices: [390.27, 402.16, 415.58, 406.32, 418.45, 417.12],
    },
  },
  {
    id: '3',
    name: 'Vanguard S&P 500 ETF',
    symbol: 'VOO',
    category: 'ETFs',
    currentPrice: 473.48,
    priceChange24h: 1.05,
    priceChangePercentage24h: 0.22,
    marketCap: 352000000000,
    volume24h: 3958000,
    favorite: false,
    description: 'The Vanguard S&P 500 ETF tracks the performance of the S&P 500 Index, which consists of 500 large-cap U.S. stocks.',
    historicalData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      prices: [455.22, 457.18, 464.36, 462.89, 470.55, 473.48],
    },
  },
  {
    id: '4',
    name: 'Bitcoin',
    symbol: 'BTC',
    category: 'Crypto',
    currentPrice: 67254.12,
    priceChange24h: 1245.32,
    priceChangePercentage24h: 1.89,
    marketCap: 1320000000000,
    volume24h: 35726000000,
    favorite: false,
    description: 'Bitcoin is a decentralized digital currency, without a central bank or single administrator, that can be sent from user to user on the peer-to-peer bitcoin network without intermediaries.',
    historicalData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      prices: [42000.15, 51245.87, 58932.45, 63214.78, 68421.36, 67254.12],
    },
  },
  {
    id: '5',
    name: 'Ethereum',
    symbol: 'ETH',
    category: 'Crypto',
    currentPrice: 3472.86,
    priceChange24h: 87.32,
    priceChangePercentage24h: 2.58,
    marketCap: 415000000000,
    volume24h: 18592000000,
    favorite: false,
    description: 'Ethereum is a decentralized, open-source blockchain with smart contract functionality. Ether is the native cryptocurrency of the platform.',
    historicalData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      prices: [2550.18, 2845.36, 3125.89, 3320.15, 3410.45, 3472.86],
    },
  },
  {
    id: '6',
    name: 'iShares Core U.S. Aggregate Bond ETF',
    symbol: 'AGG',
    category: 'Bonds',
    currentPrice: 98.54,
    priceChange24h: 0.18,
    priceChangePercentage24h: 0.18,
    marketCap: 85000000000,
    volume24h: 6752000,
    favorite: false,
    description: 'The iShares Core U.S. Aggregate Bond ETF seeks to track the investment results of an index composed of the total U.S. investment-grade bond market.',
    historicalData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      prices: [97.32, 96.85, 97.14, 97.98, 98.32, 98.54],
    },
  },
  {
    id: '7',
    name: 'Vanguard Real Estate ETF',
    symbol: 'VNQ',
    category: 'Real Estate',
    currentPrice: 84.12,
    priceChange24h: -0.42,
    priceChangePercentage24h: -0.50,
    marketCap: 32000000000,
    volume24h: 4982000,
    favorite: false,
    description: 'Vanguard Real Estate ETF seeks to provide a high level of income and moderate long-term capital appreciation by tracking the performance of the MSCI US Investable Market Real Estate 25/50 Index.',
    historicalData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      prices: [80.25, 81.36, 82.47, 83.58, 84.69, 84.12],
    },
  },
];

// Initial portfolio state
const initialPortfolio: Portfolio = {
  balance: 1000,
  assets: {},
  transactions: [],
};

const InvestmentsScreen: React.FC = () => {
  // States
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>(initialAssets);
  const [portfolio, setPortfolio] = useState<Portfolio>(initialPortfolio);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAssetModal, setShowAssetModal] = useState<boolean>(false);
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy');
  const [transactionAmount, setTransactionAmount] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'assets' | 'portfolio'>('assets');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'All'>('All');
  const [sortOption, setSortOption] = useState<'name' | 'price' | 'change'>('name');

  // Load portfolio data from storage on mount
  useEffect(() => {
    loadPortfolio();
    
    // Simulate API fetch delay
    setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    // Setup periodic price updates (every 30 seconds)
    const updateInterval = setInterval(() => {
      updateAssetPrices();
    }, 30000);
    
    return () => clearInterval(updateInterval);
  }, []);

  // Filter assets based on category and search query
  useEffect(() => {
    let result = [...assets];
    
    // Apply category filter
    if (selectedCategory !== 'All') {
      result = result.filter(asset => asset.category === selectedCategory);
    }
    
    // Apply search filter
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
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        result.sort((a, b) => b.currentPrice - a.currentPrice);
        break;
      case 'change':
        result.sort((a, b) => b.priceChangePercentage24h - a.priceChangePercentage24h);
        break;
    }
    
    setFilteredAssets(result);
  }, [assets, selectedCategory, searchQuery, sortOption]);

  // Load portfolio data from AsyncStorage
  const loadPortfolio = async () => {
    try {
      const portfolioData = await AsyncStorage.getItem('portfolio');
      if (portfolioData) {
        const parsedData = JSON.parse(portfolioData);
        
        // Convert string dates back to Date objects
        if (parsedData.transactions) {
          parsedData.transactions = parsedData.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          }));
        }
        
        setPortfolio(parsedData);
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    }
  };

  // Save portfolio data to AsyncStorage
  const savePortfolio = async (newPortfolio: Portfolio) => {
    try {
      await AsyncStorage.setItem('portfolio', JSON.stringify(newPortfolio));
    } catch (error) {
      console.error('Failed to save portfolio:', error);
    }
  };

  // Update asset prices periodically
  const updateAssetPrices = () => {
    // In a real app, this would fetch fresh prices from an API
    // For demo purposes, we'll simulate small random price changes
    const updatedAssets = assets.map(asset => {
      const changePercent = (Math.random() * 2 - 1) * 0.5; // Random change between -0.5% and +0.5%
      const priceChange = asset.currentPrice * (changePercent / 100);
      
      return {
        ...asset,
        currentPrice: parseFloat((asset.currentPrice + priceChange).toFixed(2)),
        priceChange24h: parseFloat((asset.priceChange24h + priceChange).toFixed(2)),
        priceChangePercentage24h: parseFloat((asset.priceChangePercentage24h + changePercent).toFixed(2))
      };
    });
    
    setAssets(updatedAssets);
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    updateAssetPrices();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Toggle asset favorite status
  const toggleFavorite = (assetId: string) => {
    const updatedAssets = assets.map(asset => 
      asset.id === assetId ? { ...asset, favorite: !asset.favorite } : asset
    );
    setAssets(updatedAssets);
  };

  // Open asset details modal
  const openAssetDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowAssetModal(true);
  };

  // Open transaction modal
  const openTransactionModal = (type: 'buy' | 'sell') => {
    if (!selectedAsset) return;
    
    // Check if selling is possible
    if (type === 'sell') {
      const assetHolding = portfolio.assets[selectedAsset.id];
      if (!assetHolding || assetHolding.quantity <= 0) {
        Alert.alert(
          "Cannot Sell",
          "You don't own any shares of this asset to sell.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    
    setTransactionType(type);
    setTransactionAmount('');
    setShowTransactionModal(true);
  };

  // Process transaction
  const processTransaction = () => {
    if (!selectedAsset || !transactionAmount) return;
    
    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive amount.");
      return;
    }
    
    const currentPrice = selectedAsset.currentPrice;
    const quantity = amount / currentPrice;
    
    // Copy current portfolio
    const newPortfolio = { ...portfolio };
    
    if (transactionType === 'buy') {
      // Check if user has enough balance
      if (amount > newPortfolio.balance) {
        Alert.alert("Insufficient Funds", "You don't have enough balance for this transaction.");
        return;
      }
      
      // Subtract from balance
      newPortfolio.balance -= amount;
      
      // Add to assets
      if (!newPortfolio.assets[selectedAsset.id]) {
        newPortfolio.assets[selectedAsset.id] = {
          quantity: 0,
          averagePrice: 0
        };
      }
      
      // Update average price
      const currentQuantity = newPortfolio.assets[selectedAsset.id].quantity;
      const currentTotalValue = currentQuantity * newPortfolio.assets[selectedAsset.id].averagePrice;
      const newTotalValue = currentTotalValue + amount;
      const newTotalQuantity = currentQuantity + quantity;
      
      newPortfolio.assets[selectedAsset.id].quantity = newTotalQuantity;
      newPortfolio.assets[selectedAsset.id].averagePrice = newTotalValue / newTotalQuantity;
    } else {
      // Sell transaction
      const assetHolding = newPortfolio.assets[selectedAsset.id];
      
      // Check if user owns enough of the asset
      if (!assetHolding || assetHolding.quantity < quantity) {
        Alert.alert("Insufficient Assets", "You don't own enough of this asset to sell.");
        return;
      }
      
      // Add to balance
      newPortfolio.balance += amount;
      
      // Subtract from assets
      assetHolding.quantity -= quantity;
      
      // If quantity is zero, consider removing the asset entry
      if (assetHolding.quantity <= 0) {
        delete newPortfolio.assets[selectedAsset.id];
      }
    }
    
    // Add transaction record
    const transaction: Transaction = {
      id: Date.now().toString(),
      assetId: selectedAsset.id,
      type: transactionType,
      amount: amount,
      price: currentPrice,
      date: new Date(),
      quantity: quantity
    };
    
    newPortfolio.transactions = [transaction, ...newPortfolio.transactions];
    
    // Update portfolio state and save to storage
    setPortfolio(newPortfolio);
    savePortfolio(newPortfolio);
    
    // Close modals
    setShowTransactionModal(false);
    
    // Show confirmation
    Alert.alert(
      "Transaction Successful",
      `You ${transactionType === 'buy' ? 'bought' : 'sold'} ${quantity.toFixed(6)} ${selectedAsset.symbol} for £${amount.toFixed(2)}.`,
      [{ text: "OK" }]
    );
  };

  // Calculate total portfolio value
  const calculateTotalPortfolioValue = () => {
    let totalValue = portfolio.balance;
    
    Object.entries(portfolio.assets).forEach(([assetId, holding]) => {
      const asset = assets.find(a => a.id === assetId);
      if (asset) {
        totalValue += asset.currentPrice * holding.quantity;
      }
    });
    
    return totalValue;
  };

  // Calculate portfolio performance
  const calculatePortfolioPerformance = () => {
    let totalInvested = 0;
    let totalCurrentValue = 0;
    
    Object.entries(portfolio.assets).forEach(([assetId, holding]) => {
      const asset = assets.find(a => a.id === assetId);
      if (asset) {
        totalInvested += holding.averagePrice * holding.quantity;
        totalCurrentValue += asset.currentPrice * holding.quantity;
      }
    });
    
    if (totalInvested === 0) return 0;
    
    return ((totalCurrentValue - totalInvested) / totalInvested) * 100;
  };

  // Get portfolio allocation data for charts
  const getPortfolioAllocationData = () => {
    const categoryMap: Record<string, number> = {};
    let totalValue = 0;
    
    // Calculate total value by category
    Object.entries(portfolio.assets).forEach(([assetId, holding]) => {
      const asset = assets.find(a => a.id === assetId);
      if (asset) {
        const value = asset.currentPrice * holding.quantity;
        totalValue += value;
        
        if (categoryMap[asset.category]) {
          categoryMap[asset.category] += value;
        } else {
          categoryMap[asset.category] = value;
        }
      }
    });
    
    // Prepare data for pie chart
    const chartData = Object.entries(categoryMap).map(([category, value], index) => {
      const colors = ['#48A665', '#3498DB', '#9B59B6', '#F1C40F', '#E74C3C', '#16A085'];
      return {
        name: category,
        value: value,
        percentage: (value / totalValue) * 100,
        color: colors[index % colors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      };
    });
    
    return chartData;
  };

  // Get data for portfolio performance chart
  const getPortfolioPerformanceData = () => {
    // In a real app, this would come from historical data
    // For demo, we'll create a simple trending line
    
    // Get last 6 transactions to create a simple trend
    const transactions = portfolio.transactions.slice(0, 6).reverse();
    const labels = transactions.map(t => {
      const date = new Date(t.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    
    if (labels.length === 0) {
      return {
        labels: ['Start'],
        datasets: [{ data: [portfolio.balance] }]
      };
    }
    
    // Create a simple increasing trend based on portfolio balance
    const startValue = portfolio.balance;
    const endValue = calculateTotalPortfolioValue();
    const difference = endValue - startValue;
    
    const data = transactions.map((t, i) => {
      return startValue + (difference * (i / transactions.length));
    });
    
    if (data.length === 0) {
      data.push(portfolio.balance);
    }
    
    return {
      labels: labels.length > 0 ? labels : ['Start'],
      datasets: [{ data }]
    };
  };

  // Render asset list item
  const renderAssetItem = ({ item }: { item: Asset }) => (
    <TouchableOpacity 
      style={styles.assetCard}
      onPress={() => openAssetDetails(item)}
    >
      <View style={styles.assetHeader}>
        <View style={styles.assetInfo}>
          <Text style={styles.assetSymbol}>{item.symbol}</Text>
          <Text style={styles.assetName}>{item.name}</Text>
        </View>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.id)}
        >
          <Ionicons 
            name={item.favorite ? "star" : "star-outline"} 
            size={20} 
            color={item.favorite ? "#FFC700" : "#BBBBBB"}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.assetDetails}>
        <View style={styles.priceContainer}>
          <Text style={styles.assetPrice}>£{item.currentPrice.toFixed(2)}</Text>
          <Text 
            style={[
              styles.priceChange,
              item.priceChangePercentage24h >= 0 ? styles.positiveChange : styles.negativeChange
            ]}
          >
            {item.priceChangePercentage24h >= 0 ? '+' : ''}
            {item.priceChangePercentage24h.toFixed(2)}%
          </Text>
        </View>
        
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      
      {portfolio.assets[item.id] && (
        <View style={styles.holdingInfo}>
          <Text style={styles.holdingText}>
            You own: {portfolio.assets[item.id].quantity.toFixed(6)} {item.symbol}
          </Text>
          <Text style={styles.holdingValue}>
            Value: £{(portfolio.assets[item.id].quantity * item.currentPrice).toFixed(2)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render transaction list item
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const asset = assets.find(a => a.id === item.assetId);
    if (!asset) return null;
    
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType}>
            {item.type === 'buy' ? 'Bought' : 'Sold'} {asset.symbol}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}
          </Text>
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionQuantity}>
            {item.quantity.toFixed(6)} {asset.symbol}
          </Text>
          <Text 
            style={[
              styles.transactionAmount,
              item.type === 'buy' ? styles.negativeChange : styles.positiveChange
            ]}
          >
            {item.type === 'buy' ? '-' : '+'}£{item.amount.toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  // Render portfolio holdings
  const renderHoldings = () => {
    const holdings = Object.entries(portfolio.assets)
      .map(([assetId, holding]) => {
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return null;
        
        const currentValue = asset.currentPrice * holding.quantity;
        const investedValue = holding.averagePrice * holding.quantity;
        const profit = currentValue - investedValue;
        const profitPercentage = (profit / investedValue) * 100;
        
        return (
          <View key={assetId} style={styles.holdingCard}>
            <View style={styles.holdingHeader}>
              <Text style={styles.holdingSymbol}>{asset.symbol}</Text>
              <Text style={styles.holdingName}>{asset.name}</Text>
            </View>
            <View style={styles.holdingDetails}>
              <View style={styles.holdingQuantity}>
                <Text style={styles.holdingLabel}>Quantity</Text>
                <Text style={styles.holdingValue}>{holding.quantity.toFixed(6)}</Text>
              </View>
              <View style={styles.holdingCurrentValue}>
                <Text style={styles.holdingLabel}>Current Value</Text>
                <Text style={styles.holdingValue}>£{currentValue.toFixed(2)}</Text>
              </View>
              <View style={styles.holdingProfit}>
                <Text style={styles.holdingLabel}>Profit/Loss</Text>
                <Text 
                  style={[
                    styles.holdingValue,
                    profit >= 0 ? styles.positiveChange : styles.negativeChange
                  ]}
                >
                  {profit >= 0 ? '+' : ''}£{profit.toFixed(2)} ({profitPercentage.toFixed(2)}%)
                </Text>
              </View>
            </View>
          </View>
        );
      })
      .filter(Boolean);
    
    if (holdings.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="finance" size={48} color="#BBBBBB" />
          <Text style={styles.emptyStateText}>You don't have any investments yet.</Text>
          <Text style={styles.emptyStateSubtext}>Start investing by exploring assets!</Text>
        </View>
      );
    }
    
    return holdings;
  };

  // Asset detail modal
  const renderAssetDetailModal = () => {
    if (!selectedAsset) return null;
    
    return (
      <Modal
        visible={showAssetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssetModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAssetModal(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedAsset.name}</Text>
              <TouchableOpacity 
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(selectedAsset.id)}
              >
                <Ionicons 
                  name={selectedAsset.favorite ? "star" : "star-outline"} 
                  size={24} 
                  color={selectedAsset.favorite ? "#FFC700" : "#BBBBBB"}
                />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <View style={styles.assetPriceHeader}>
                <Text style={styles.assetDetailPrice}>£{selectedAsset.currentPrice.toFixed(2)}</Text>
                <Text 
                  style={[
                    styles.assetDetailPriceChange,
                    selectedAsset.priceChangePercentage24h >= 0 ? styles.positiveChange : styles.negativeChange
                  ]}
                >
                  {selectedAsset.priceChangePercentage24h >= 0 ? '+' : ''}
                  {selectedAsset.priceChangePercentage24h.toFixed(2)}% (24h)
                </Text>
              </View>
              
              <View style={styles.chartContainer}>
                {selectedAsset.historicalData && (
                  <LineChart
                    data={{
                      labels: selectedAsset.historicalData.labels,
                      datasets: [
                        {
                          data: selectedAsset.historicalData.prices,
                          color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`,
                          strokeWidth: 2
                        }
                      ]
                    }}
                    width={screenWidth - 40}
                    height={220}
                    yAxisLabel="£"
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                )}
              </View>
              
              <View style={styles.assetStatsContainer}>
                <View style={styles.assetStat}>
                  <Text style={styles.assetStatLabel}>Market Cap</Text>
                  <Text style={styles.assetStatValue}>
                    £{(selectedAsset.marketCap / 1000000000).toFixed(2)}B
                  </Text>
                </View>
                <View style={styles.assetStat}>
                  <Text style={styles.assetStatLabel}>24h Volume</Text>
                  <Text style={styles.assetStatValue}>
                    £{(selectedAsset.volume24h / 1000000).toFixed(2)}M
                  </Text>
                </View>
                <View style={styles.assetStat}>
                  <Text style={styles.assetStatLabel}>Category</Text>
                </View>
              </View>
              
              <Text style={styles.assetDescription}>{selectedAsset.description}</Text>
              
              <View style={styles.transactionButtons}>
                <TouchableOpacity 
                  style={[styles.transactionButton, styles.buyButton]}
                  activeOpacity={0.8}
                  onPress={() => openTransactionModal('buy')}
                >
                  <Text style={styles.transactionButtonText}>Buy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.transactionButton, styles.sellButton]}
                  activeOpacity={0.8}
                  onPress={() => openTransactionModal('sell')}
                >
                  <Text style={styles.transactionButtonText}>Sell</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  // Transaction modal
  const renderTransactionModal = () => {
    if (!selectedAsset) return null;
    
    return (
      <Modal
        visible={showTransactionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTransactionModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowTransactionModal(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {transactionType === 'buy' ? 'Buy' : 'Sell'} {selectedAsset.symbol}
              </Text>
              <View style={{ width: 24 }} />
            </View>
            
            <View style={styles.transactionForm}>
              <View style={styles.assetInfoContainer}>
                <Text style={styles.assetInfoLabel}>Current Price:</Text>
                <Text style={styles.assetInfoValue}>£{selectedAsset.currentPrice.toFixed(2)}</Text>
              </View>
              
              <View style={styles.assetInfoContainer}>
                <Text style={styles.assetInfoLabel}>Available Balance:</Text>
                <Text style={styles.assetInfoValue}>£{portfolio.balance.toFixed(2)}</Text>
              </View>
              
              {transactionType === 'sell' && portfolio.assets[selectedAsset.id] && (
                <View style={styles.assetInfoContainer}>
                  <Text style={styles.assetInfoLabel}>Available {selectedAsset.symbol}:</Text>
                  <Text style={styles.assetInfoValue}>
                    {portfolio.assets[selectedAsset.id].quantity.toFixed(6)} {selectedAsset.symbol}
                  </Text>
                </View>
              )}
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Amount to {transactionType} (£):</Text>
                <TextInput
                  style={styles.amountInput}
                  value={transactionAmount}
                  onChangeText={setTransactionAmount}
                  placeholder="Enter amount"
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>
              
              {parseFloat(transactionAmount) > 0 && (
                <View style={styles.estimatedContainer}>
                  <Text style={styles.estimatedLabel}>Estimated {selectedAsset.symbol}:</Text>
                  <Text style={styles.estimatedValue}>
                    {(parseFloat(transactionAmount || '0') / selectedAsset.currentPrice).toFixed(6)} {selectedAsset.symbol}
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                style={[
                  styles.transactionButton,
                  { backgroundColor: transactionType === 'buy' ? '#006a4d' : '#555555' }
                ]}
                activeOpacity={0.8} // Add this for better touch feedback
                onPress={processTransaction}
              >
                <Text style={styles.transactionButtonText}>
                  {transactionType === 'buy' ? 'Buy' : 'Sell'} {selectedAsset.symbol}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  // Asset categories filter
  const renderCategoryFilter = () => {
    const categories: (AssetCategory | 'All')[] = ['All', 'Stocks', 'ETFs', 'Crypto', 'Bonds', 'Real Estate'];
    
    return (
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFilterContainer}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryFilterButton,
              selectedCategory === category && styles.categoryFilterButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text 
              style={[
                styles.categoryFilterText,
                selectedCategory === category && styles.categoryFilterTextActive
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  // Portfolio analytics
  const renderPortfolioAnalytics = () => {
    const totalValue = calculateTotalPortfolioValue();
    const performance = calculatePortfolioPerformance();
    const allocationData = getPortfolioAllocationData();
    const performanceData = getPortfolioPerformanceData();
    
    return (
      <View style={styles.portfolioAnalyticsContainer}>
        <View style={styles.portfolioSummary}>
          <View style={styles.portfolioValueContainer}>
            <Text style={styles.portfolioLabel}>Total Value</Text>
            <Text style={styles.portfolioTotalValue}>£{totalValue.toFixed(2)}</Text>
            <View style={styles.portfolioPerformanceContainer}>
              <Text 
                style={[
                  styles.portfolioPerformance,
                  performance >= 0 ? styles.positiveChange : styles.negativeChange
                ]}
              >
                {performance >= 0 ? '+' : ''}{performance.toFixed(2)}%
              </Text>
              <Text style={styles.portfolioTimeframe}>All time</Text>
            </View>
          </View>
          
          <View style={styles.portfolioCashContainer}>
            <Text style={styles.portfolioLabel}>Available Cash</Text>
            <Text style={styles.portfolioCashValue}>£{portfolio.balance.toFixed(2)}</Text>
          </View>
        </View>
        
        {/* Portfolio Performance Chart */}
        <View style={styles.portfolioChartContainer}>
          <Text style={styles.chartTitle}>Portfolio Performance</Text>
          {performanceData.datasets[0].data.length > 0 && (
            <LineChart
              data={performanceData}
              width={screenWidth - 40}
              height={220}
              yAxisLabel="£"
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          )}
        </View>
        
        {/* Asset Allocation Chart */}
        {allocationData.length > 0 && (
          <View style={styles.portfolioChartContainer}>
            <Text style={styles.chartTitle}>Asset Allocation</Text>
            <PieChart
              data={allocationData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}
        
        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {portfolio.transactions.length > 0 ? (
            <FlatList
              data={portfolio.transactions.slice(0, 5)}
              renderItem={renderTransactionItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyStateSubtext}>No transactions yet</Text>
          )}
        </View>
      </View>
    );
  };

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#48A665', '#38805E']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Investments</Text>
      </LinearGradient>
      
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assets' && styles.activeTab]}
          onPress={() => setActiveTab('assets')}
        >
          <Text style={[styles.tabText, activeTab === 'assets' && styles.activeTabText]}>
            Assets
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'portfolio' && styles.activeTab]}
          onPress={() => setActiveTab('portfolio')}
        >
          <Text style={[styles.tabText, activeTab === 'portfolio' && styles.activeTabText]}>
            Portfolio
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Search and Sort Options */}
      {activeTab === 'assets' && (
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#777" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search assets..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => {
              // Cycle through sort options
              const options: ('name' | 'price' | 'change')[] = ['name', 'price', 'change'];
              const currentIndex = options.indexOf(sortOption);
              const nextIndex = (currentIndex + 1) % options.length;
              setSortOption(options[nextIndex]);
            }}
          >
            <MaterialCommunityIcons 
              name="sort" 
              size={24} 
              color="#333"
            />
            <Text style={styles.sortLabel}>
              {sortOption === 'name' ? 'Name' : 
               sortOption === 'price' ? 'Price' : 'Change'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#48A665" />
          <Text style={styles.loadingText}>Loading assets...</Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {activeTab === 'assets' ? (
            /* Assets Content Container */
            <View style={{ flex: 1 }}>
              {/* Category Filter (fixed height) */}
              <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eaeaea' }}>
                {renderCategoryFilter()}
              </View>
              
              {/* Assets List (takes remaining space) */}
              <FlatList
                data={filteredAssets}
                renderItem={renderAssetItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.assetList}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="search" size={48} color="#BBBBBB" />
                    <Text style={styles.emptyStateText}>No assets found</Text>
                    <Text style={styles.emptyStateSubtext}>Try adjusting your filters</Text>
                  </View>
                }
              />
            </View>
          ) : (
            /* Portfolio View */
            <ScrollView
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {renderPortfolioAnalytics()}
              <View style={styles.holdingsContainer}>
                <Text style={styles.sectionTitle}>Your Holdings</Text>
                {renderHoldings()}
              </View>
            </ScrollView>
          )}
        </View>
      )}
      
      {/* Modals */}
      {renderAssetDetailModal()}
      {renderTransactionModal()}
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#48A665',
  },
  tabText: {
    fontSize: 16,
    color: '#777',
  },
  activeTabText: {
    color: '#48A665',
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  sortLabel: {
    marginLeft: 5,
    fontSize: 14,
    color: '#333',
  },
  categoryFilterContainer: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    flexGrow: 0, // Prevent growing
  },
  categoryFilterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  categoryFilterButtonActive: {
    backgroundColor: '#48A665',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#555',
  },
  categoryFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9', // Match the filter background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#777',
  },
  assetList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4, // Reduced padding
  },
  assetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetInfo: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  assetName: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  favoriteButton: {
    padding: 6,
  },
  assetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  priceContainer: {
    flex: 1,
  },
  assetPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  priceChange: {
    fontSize: 14,
    marginTop: 2,
  },
  positiveChange: {
    color: '#48A665',
  },
  negativeChange: {
    color: '#E74C3C',
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  categoryText: {
    fontSize: 12,
    color: '#555',
  },
  holdingInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  holdingText: {
    fontSize: 14,
    color: '#555',
  },
  holdingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', // Center vertically
    paddingHorizontal: 10, // Give some side padding
    paddingTop: 40, // Space from top
    paddingBottom: 80, // Leave space for footer
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20, // Apply radius to ALL corners
    overflow: 'hidden',
    marginTop: 75,
    marginBottom: 50
    // Remove the marginTop that was pushing it down
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 1000, // Set a reasonable max height
  },
  assetPriceHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  assetDetailPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  assetDetailPriceChange: {
    fontSize: 18,
    marginTop: 4,
  },
  chartContainer: {
    marginHorizontal: 20,
    marginVertical: 5, // Reduced from 10
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 5, // Reduced from 8
  },
  assetStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10, // Reduced from 16
    paddingHorizontal: 20,
  },
  assetStat: {
    width: '50%',
    paddingVertical: 6, // Reduced from 10
  },
  assetStatLabel: {
    fontSize: 14,
    color: '#777',
  },
  assetStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  transactionForm: {
    padding: 20,
  },
  assetInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  assetInfoLabel: {
    fontSize: 16,
    color: '#777',
  },
  assetInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  inputContainer: {
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  estimatedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  estimatedLabel: {
    fontSize: 16,
    color: '#777',
  },
  estimatedValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionButton: {
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  portfolioAnalyticsContainer: {
    padding: 16,
  },
  portfolioSummary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  portfolioValueContainer: {
    flex: 2,
    borderRightWidth: 1,
    borderRightColor: '#eaeaea',
    paddingRight: 16,
  },
  portfolioLabel: {
    fontSize: 14,
    color: '#777',
  },
  portfolioTotalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  portfolioPerformanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolioPerformance: {
    fontSize: 16,
    fontWeight: '600',
  },
  portfolioTimeframe: {
    marginLeft: 8,
    fontSize: 14,
    color: '#777',
  },
  portfolioCashContainer: {
    flex: 1,
    paddingLeft: 16,
  },
  portfolioCashValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  portfolioChartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  transactionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionDate: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  transactionDetails: {
    alignItems: 'flex-end',
  },
  transactionQuantity: {
    fontSize: 14,
    color: '#555',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  holdingsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  holdingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  holdingHeader: {
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
  holdingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  holdingQuantity: {
    flex: 1,
  },
  holdingCurrentValue: {
    flex: 1,
  },
  holdingProfit: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  holdingLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
  },
  assetDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingVertical: 10, // Reduced from 16
  },
  transactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10, // Reduced from 16
    marginBottom: 20, // Reduced from 30
  },
  buyButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#006a4d', // Updated to match footer color
  },
  sellButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#555555', // Changed to dark grey
  },
});

export default InvestmentsScreen;