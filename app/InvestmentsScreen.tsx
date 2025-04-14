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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import yahooFinance from 'yahoo-finance2';

const screenWidth = Dimensions.get('window').width;

// Polyfill for React Native fetch Headers
if (typeof Headers !== 'undefined' && !Headers.prototype.getSetCookie) {
  Headers.prototype.getSetCookie = function () {
    const setCookie = this.get('set-cookie');
    return setCookie ? [setCookie] : [];
  };
}

// Optional: suppress Yahoo Finance survey notice
yahooFinance.suppressNotices(['yahooSurvey']);

// --- Types & Interfaces ---

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

// Add this type definition near your other interfaces
interface HoldingDataItem {
  assetId: string;
  asset: Asset;
  holding: {
    quantity: number;
    averagePrice: number;
  };
  value: number;
}

// --- Chart configuration ---
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

// --- Dummy initial data ---
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

const initialPortfolio: Portfolio = {
  balance: 1000,
  assets: {},
  transactions: [],
};

// --- Component State ---
const InvestmentsScreen: React.FC = () => {
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
  const categoryScrollViewRef = React.useRef<ScrollView>(null);
  const [showCategoryIndicator, setShowCategoryIndicator] = useState(true);

  interface ChartData {
    isLoading: boolean;
    labels: string[];
    prices: number[];
  }

  const [chartData, setChartData] = useState<ChartData>({
    isLoading: false,
    labels: [],
    prices: []
  });

  // --- Load portfolio and favorites on mount ---
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadPortfolio(),
          loadFavorites()
        ]);
        await updateAssetPrices();
        setLoading(false);
      } catch (error) {
        console.error('Error initializing data:', error);
        setLoading(false);
      }
    };

    initialize();

    // Auto-refresh every 60 seconds if modals are closed
    const refreshInterval = setInterval(() => {
      if (!showAssetModal && !showTransactionModal) {
        updateAssetPrices();
      }
    }, 60000);
    return () => clearInterval(refreshInterval);
  }, []);

  // --- Category scroll bounce animation ---
  useEffect(() => {
    setTimeout(() => {
      if (categoryScrollViewRef.current) {
        categoryScrollViewRef.current.scrollTo({ x: 50, animated: true });
        setTimeout(() => {
          categoryScrollViewRef.current?.scrollTo({ x: 0, animated: true });
        }, 800);
      }
    }, 500);
  }, []);

  // --- Handle category scroll indicator ---
  const handleCategoryScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isScrolledToEnd = layoutMeasurement.width + contentOffset.x >= contentSize.width - 20;
    setShowCategoryIndicator(!isScrolledToEnd);
  };

  // --- Filter assets based on category, search, and sort ---
  useEffect(() => {
    let result = [...assets];
    if (selectedCategory !== 'All') {
      result = result.filter(asset => asset.category === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(asset =>
        asset.name.toLowerCase().includes(query) ||
        asset.symbol.toLowerCase().includes(query)
      );
    }
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

  // --- Portfolio persistence ---
  const loadPortfolio = async () => {
    try {
      const portfolioData = await AsyncStorage.getItem('portfolio');
      if (portfolioData) {
        const parsedData = JSON.parse(portfolioData);
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

  const savePortfolio = async (newPortfolio: Portfolio) => {
    try {
      await AsyncStorage.setItem('portfolio', JSON.stringify(newPortfolio));
    } catch (error) {
      console.error('Failed to save portfolio:', error);
    }
  };

  // --- Favorites persistence ---
  const saveFavorites = (assetsList: Asset[]) => {
    try {
      const favoriteIds = assetsList.filter(asset => asset.favorite).map(asset => asset.id);
      AsyncStorage.setItem('favoriteAssets', JSON.stringify(favoriteIds));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const favoritesData = await AsyncStorage.getItem('favoriteAssets');
      if (favoritesData) {
        const favoriteIds = JSON.parse(favoritesData) as string[];
        const updatedAssets = assets.map(asset => ({
          ...asset,
          favorite: favoriteIds.includes(asset.id)
        }));
        setAssets(updatedAssets);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  // --- Update asset prices using Yahoo Finance ---
  const updateAssetPrices = async () => {
    try {
      setRefreshing(true);
      // First, get the USD to GBP conversion rate (for non-crypto assets)
      let usdToGbpConversion = 1.0;
      try {
        const conversionQuote = await yahooFinance.quote("GBPUSD=X");
        if (conversionQuote && conversionQuote.regularMarketPrice) {
          usdToGbpConversion = conversionQuote.regularMarketPrice;
        }
      } catch (err) {
        console.error("Error fetching conversion rate:", err);
      }

      const updatedAssets = await Promise.all(assets.map(async (asset) => {
        try {
          let querySymbol = "";
          // For crypto, request the GBP pair; for others, use the standard ticker (assumed in USD)
          if (asset.category === 'Crypto') {
            querySymbol = `${asset.symbol}-GBP`;
          } else {
            querySymbol = asset.symbol;
          }
          const quote = await yahooFinance.quote(querySymbol);
          let price = quote.regularMarketPrice ?? asset.currentPrice;
          let change = quote.regularMarketChange ?? 0;
          let changePercent = quote.regularMarketChangePercent ?? 0;
          let volume = quote.regularMarketVolume ?? asset.volume24h;
          let marketCap = quote.marketCap ?? asset.marketCap;

          // Convert to GBP for non-crypto tickers (which are in USD)
          if (asset.category !== 'Crypto') {
            price = price / usdToGbpConversion;
            change = change / usdToGbpConversion;
            marketCap = marketCap / usdToGbpConversion;
          }

          // Fetch 30-day historical data
          const history = await yahooFinance.historical(querySymbol, {
            period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            interval: '1d',
          });
          const labels = history.map((h) => {
            const d = new Date(h.date);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          });
          const histPrices = history.map((h) => {
            let p = h.close ?? price;
            if (asset.category !== 'Crypto') {
              p = p / usdToGbpConversion;
            }
            return p;
          });

          return {
            ...asset,
            currentPrice: price,
            priceChange24h: change,
            priceChangePercentage24h: changePercent,
            volume24h: volume,
            marketCap: marketCap,
            historicalData: { labels, prices: histPrices }
          };
        } catch (err) {
          console.error(`Failed to update asset ${asset.name}:`, err);
          return asset;
        }
      }));

      setAssets(updatedAssets);
      const filtered = updatedAssets.filter(asset => {
        const matchesCategory = selectedCategory === 'All' || asset.category === selectedCategory;
        const matchesSearch = !searchQuery ||
          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      });
      setFilteredAssets(filtered);
      setRefreshing(false);
    } catch (error) {
      console.error('Failed to update asset prices:', error);
      setRefreshing(false);
    }
  };

  // --- Pull-to-refresh ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    updateAssetPrices();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // --- Toggle favorite ---
  const toggleFavorite = (assetId: string) => {
    const updatedAssets = assets.map(asset =>
      asset.id === assetId ? { ...asset, favorite: !asset.favorite } : asset
    );
    setAssets(updatedAssets);
    if (selectedAsset && selectedAsset.id === assetId) {
      setSelectedAsset({ ...selectedAsset, favorite: !selectedAsset.favorite });
    }
    saveFavorites(updatedAssets);
  };

  // --- Refresh historical data for a specific asset using Yahoo Finance ---
  const refreshAssetHistoricalData = async (asset: Asset) => {
    try {
      let querySymbol = "";
      if (asset.category === 'Crypto') {
        querySymbol = `${asset.symbol}-GBP`;
      } else {
        querySymbol = asset.symbol;
      }
      // For non-crypto assets, get conversion rate again
      let usdToGbpConversion = 1.0;
      if (asset.category !== 'Crypto') {
        try {
          const conversionQuote = await yahooFinance.quote("GBPUSD=X");
          if (conversionQuote && conversionQuote.regularMarketPrice) {
            usdToGbpConversion = conversionQuote.regularMarketPrice;
          }
        } catch (err) {
          console.error("Error fetching conversion rate:", err);
        }
      }
      const history = await yahooFinance.historical(querySymbol, {
        period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        interval: '1d',
      });
      const labels = history.map((h) => {
        const d = new Date(h.date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      });
      const histPrices = history.map((h) => {
        let p = h.close ?? asset.currentPrice;
        if (asset.category !== 'Crypto') {
          p = p / usdToGbpConversion;
        }
        return p;
      });
      return { labels, prices: histPrices };
    } catch (err) {
      console.error(`Failed to fetch historical data for ${asset.name}:`, err);
      return asset.historicalData;
    }
  };

  // --- Open asset detail modal ---
  const openAssetDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowAssetModal(true);

    (async () => {
      try {
        if (!asset.historicalData || asset.historicalData.prices.length === 0) {
          const updatedAsset = { ...asset, historicalData: { labels: [], prices: [] } };
          setSelectedAsset(updatedAsset);
        }
        const histData = await refreshAssetHistoricalData(asset);
        const freshAsset = { ...asset, historicalData: histData };
        setSelectedAsset(freshAsset);
        setAssets(prev => prev.map(a => a.id === asset.id ? freshAsset : a));
      } catch (error) {
        console.error('Error refreshing asset data:', error);
      }
    })();
  };

  // --- Open transaction modal ---
  const openTransactionModal = (type: 'buy' | 'sell') => {
    if (!selectedAsset) return;
    if (type === 'sell') {
      const assetHolding = portfolio.assets[selectedAsset.id];
      if (!assetHolding || assetHolding.quantity <= 0) {
        Alert.alert("Cannot Sell", "You don't own any shares of this asset to sell.", [{ text: "OK" }]);
        return;
      }
    }
    
    // Store the selected asset in a temporary variable
    const asset = selectedAsset;
    
    // Close the first modal
    setShowAssetModal(false);
    
    // Open the transaction modal with a delay
    setTimeout(() => {
      setSelectedAsset(asset); // Restore the selected asset
      setTransactionType(type);
      setTransactionAmount('');
      setShowTransactionModal(true);
    }, 300);
  };

  // --- Process transaction ---
  const processTransaction = () => {
    if (!selectedAsset || !transactionAmount) return;
    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive amount.");
      return;
    }
    const currentPrice = selectedAsset.currentPrice;
    const quantity = amount / currentPrice;
    const newPortfolio = { ...portfolio };
    if (transactionType === 'buy') {
      if (amount > newPortfolio.balance) {
        Alert.alert("Insufficient Funds", "You don't have enough balance for this transaction.");
        return;
      }
      newPortfolio.balance -= amount;
      if (!newPortfolio.assets[selectedAsset.id]) {
        newPortfolio.assets[selectedAsset.id] = { quantity: 0, averagePrice: 0 };
      }
      const currentQuantity = newPortfolio.assets[selectedAsset.id].quantity;
      const currentTotalValue = currentQuantity * newPortfolio.assets[selectedAsset.id].averagePrice;
      const newTotalValue = currentTotalValue + amount;
      const newTotalQuantity = currentQuantity + quantity;
      newPortfolio.assets[selectedAsset.id].quantity = newTotalQuantity;
      newPortfolio.assets[selectedAsset.id].averagePrice = newTotalValue / newTotalQuantity;
    } else {
      const assetHolding = newPortfolio.assets[selectedAsset.id];
      if (!assetHolding || assetHolding.quantity < quantity) {
        Alert.alert("Insufficient Assets", "You don't own enough of this asset to sell.");
        return;
      }
      newPortfolio.balance += amount;
      assetHolding.quantity -= quantity;
      if (assetHolding.quantity <= 0) {
        delete newPortfolio.assets[selectedAsset.id];
      }
    }
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
    setPortfolio(newPortfolio);
    savePortfolio(newPortfolio);
    setShowTransactionModal(false);
    Alert.alert(
      "Transaction Successful",
      `You ${transactionType === 'buy' ? 'bought' : 'sold'} ${quantity.toFixed(6)} ${selectedAsset.symbol} for £${amount.toFixed(2)}.`,
      [{ text: "OK" }]
    );
  };

  // --- Portfolio calculations ---
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

  const getPortfolioAllocationData = () => {
    const categoryMap: Record<string, number> = {};
    let totalValue = 0;
    
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
    
    const chartData = Object.entries(categoryMap).map(([category, value], index) => {
      const colors = ['#006a4d', '#3498DB', '#9B59B6', '#F1C40F', '#E74C3C', '#16A085'];
      const percentage = (value / totalValue) * 100;
      
      return {
        name: `${category}: ${percentage.toFixed(1)}%`,  // Show category and percentage in chart label
        value: percentage,
        legend: `${category}: ${percentage.toFixed(1)}%`, // Format with colon and 1 decimal
        percentage: percentage,
        color: colors[index % colors.length],
        legendFontColor: '#333333',
        legendFontSize: 12
      };
    });
    
    return chartData;
  };

  const getPortfolioPerformanceData = () => {
    // Create historical portfolio value data based on transactions
    
    if (portfolio.transactions.length === 0) {
      return {
        labels: ['Today'],
        datasets: [{ 
          data: [portfolio.balance],
          color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`,
          strokeWidth: 2.5
        }]
      };
    }
  
    // Calculate estimated portfolio value at different points in time
    const dataPoints: {date: Date, value: number}[] = [];
    let runningBalance = portfolio.balance;
    let runningAssets: {[assetId: string]: {quantity: number, averagePrice: number}} = {};
    
    // Start with current state and work backwards
    dataPoints.push({
      date: new Date(),
      value: calculateTotalPortfolioValue()
    });
  
    // Generate points based on transaction history (last 6 transactions max)
    const recentTransactions = portfolio.transactions.slice(0, 6);
    for (let i = 0; i < recentTransactions.length; i++) {
      const transaction = recentTransactions[i];
      const asset = assets.find(a => a.id === transaction.assetId);
      if (!asset) continue;
      
      // Approximate the portfolio value right before this transaction
      let estimatedValue = dataPoints[dataPoints.length - 1].value;
      
      if (transaction.type === 'buy') {
        estimatedValue -= asset.currentPrice * transaction.quantity;
      } else {
        estimatedValue += asset.currentPrice * transaction.quantity;
      }
      
      dataPoints.push({
        date: new Date(transaction.date),
        value: Math.max(estimatedValue, 0) // Ensure non-negative value
      });
    }
    
    // Sort by date (oldest first)
    dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Format for chart
    const labels = dataPoints.map(dp => {
      const d = new Date(dp.date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    
    const values = dataPoints.map(dp => dp.value);
    
    return {
      labels,
      datasets: [{ 
        data: values,
        color: (opacity = 1) => `rgba(0, 106, 77, ${opacity})`,
        strokeWidth: 2.5
      }]
    };
  };

  // --- Render functions ---
  const renderAssetItem = ({ item: asset }: { item: Asset }) => {
    const holding = portfolio.assets[asset.id];
    const hasHolding = holding && holding.quantity > 0;
    const holdingValue = hasHolding ? holding.quantity * asset.currentPrice : 0;
    return (
      <TouchableOpacity style={styles.assetCard} onPress={() => openAssetDetails(asset)}>
        <View style={styles.assetHeader}>
          <View style={styles.assetTitleContainer}>
            <Text style={styles.assetSymbol}>{asset.symbol}</Text>
            <Text style={styles.assetName}>{asset.name}</Text>
            <View style={[styles.categoryTag, getCategoryStyle(asset.category)]}>
              <Text style={styles.categoryText}>{asset.category}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(asset.id)}>
            <Ionicons name={asset.favorite ? 'star' : 'star-outline'} size={20} color={asset.favorite ? '#FFC700' : '#BBBBBB'} />
          </TouchableOpacity>
        </View>
        <View style={styles.assetDetails}>
          <View style={styles.priceContainer}>
            <Text style={styles.assetPrice}>£{asset.currentPrice.toFixed(2)}</Text>
            <Text style={[styles.priceChange, asset.priceChangePercentage24h >= 0 ? styles.positiveChange : styles.negativeChange]}>
              {asset.priceChangePercentage24h >= 0 ? '↑' : '↓'} {Math.abs(asset.priceChangePercentage24h).toFixed(2)}%
            </Text>
          </View>
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
        {hasHolding && (
          <View style={styles.holdingInfo}>
            <Text style={styles.holdingText}>
              You own: {holding.quantity.toFixed(holding.quantity < 1 ? 6 : 2)} {asset.symbol}
            </Text>
            <Text style={styles.holdingValue}>£{holdingValue.toFixed(2)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
          <Text style={[styles.transactionAmount, item.type === 'buy' ? styles.negativeChange : styles.positiveChange]}>
            {item.type === 'buy' ? '-' : '+'}£{item.amount.toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  const renderPortfolioAnalytics = () => {
    const totalValue = calculateTotalPortfolioValue();
    const performance = calculatePortfolioPerformance();
    const allocationData = getPortfolioAllocationData();
    const performanceData = getPortfolioPerformanceData();
    
    // Get holdings data for the list
    const holdingsData = Object.entries(portfolio.assets)
      .map(([assetId, holding]): HoldingDataItem | null => {
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return null;
        const currentValue = asset.currentPrice * holding.quantity;
        return { assetId, asset, holding, value: currentValue };
      })
      .filter((item): item is HoldingDataItem => item !== null)
      .sort((a, b) => b.value - a.value); // Sort by value (highest first)
    
    return (
      <View style={styles.portfolioAnalyticsContainer}>
        {/* Portfolio Summary section */}
        <View style={styles.portfolioSummary}>
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
          <View style={styles.portfolioCashContainer}>
            <Text style={styles.portfolioLabel}>Available Cash</Text>
            <Text style={styles.portfolioCashValueAdjusted}>£{portfolio.balance.toFixed(2)}</Text>
          </View>
        </View>

        {/* Portfolio Performance section */}
        <View style={styles.portfolioChartContainer}>
          <Text style={styles.chartTitle}>Portfolio Performance</Text>
          {performanceData.datasets[0].data.length > 0 && (
            <LineChart
              data={performanceData}
              width={screenWidth - 40}
              height={220}
              yAxisLabel="£"
              chartConfig={{
                ...chartConfig,
                propsForDots: { r: "0" }, // Remove dots
                strokeWidth: 2.5,
                fillShadowGradientFrom: "#006a4d",
                fillShadowGradientTo: "#ffffff",
                fillShadowGradientOpacity: 0.2,
              }}
              bezier
              withDots={false}
              withShadow={true}
              style={styles.improvedChart}
            />
          )}
        </View>
        
        {/* Asset Allocation section */}
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

        {/* Holdings section - modified to be scrollable and show top 3 */}
        <View style={styles.holdingsContainer}>
          <Text style={styles.sectionTitle}>Your Holdings</Text>
          {holdingsData.length > 0 ? (
            <FlatList
              data={holdingsData}
              renderItem={({ item }) => {
                const { assetId, asset, holding } = item;
                const currentValue = asset.currentPrice * holding.quantity;
                const investedValue = holding.averagePrice * holding.quantity;
                const profit = currentValue - investedValue;
                const profitPercentage = (profit / investedValue) * 100;
                
                return (
                  <TouchableOpacity 
                    key={assetId} 
                    style={styles.holdingCard} 
                    onPress={() => openAssetDetails(asset)}
                  >
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
                        <Text style={[styles.holdingValue, profit >= 0 ? styles.positiveChange : styles.negativeChange]}>
                          {profit >= 0 ? '+' : ''}£{profit.toFixed(2)} ({profitPercentage.toFixed(2)}%)
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={item => item?.assetId || 'unknown'}
              style={styles.holdingsList}
              scrollEnabled={true}
              nestedScrollEnabled={true}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="finance" size={48} color="#BBBBBB" />
              <Text style={styles.emptyStateText}>You don't have any investments yet.</Text>
              <Text style={styles.emptyStateSubtext}>Start investing by exploring assets!</Text>
            </View>
          )}
        </View>
        
        {/* Transactions section - modified to show top 3 instead of 4 */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {portfolio.transactions.length > 0 ? (
            <FlatList
              data={portfolio.transactions.slice(0, 3)}
              renderItem={renderTransactionItem}
              keyExtractor={item => item.id}
              style={styles.transactionsList}
              scrollEnabled={true}
              nestedScrollEnabled={true}
            />
          ) : (
            <Text style={styles.emptyStateSubtext}>No transactions yet</Text>
          )}
        </View>
      </View>
    );
  };

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
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowAssetModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedAsset.name}</Text>
              <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(selectedAsset.id)}>
                <Ionicons
                  name={selectedAsset.favorite ? "star" : "star-outline"}
                  size={24}
                  color={selectedAsset.favorite ? "#FFC700" : "#BBBBBB"}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps='always'>
              <View style={styles.assetPriceHeader}>
                <Text style={styles.assetDetailPrice}>£{selectedAsset.currentPrice.toFixed(2)}</Text>
                <Text style={[styles.assetDetailPriceChange, selectedAsset.priceChangePercentage24h >= 0 ? styles.positiveChange : styles.negativeChange]}>
                  {selectedAsset.priceChangePercentage24h >= 0 ? '+' : ''}{selectedAsset.priceChangePercentage24h.toFixed(2)}% (24h)
                </Text>
              </View>
              <View style={styles.chartContainer}>
                {selectedAsset.historicalData && selectedAsset.historicalData.prices.length > 0 ? (
                  <View style={styles.chartWrapper}>
                    <LineChart
                      data={{
                        labels: [],
                        datasets: [
                          {
                            data: selectedAsset.historicalData.prices,
                            color: (opacity = 1) =>
                              selectedAsset.priceChangePercentage24h >= 0
                                ? `rgba(0, 177, 106, ${opacity})`
                                : `rgba(255, 84, 84, ${opacity})`,
                            strokeWidth: 2
                          }
                        ]
                      }}
                      width={screenWidth - 40}
                      height={220}
                      yAxisLabel="£"
                      chartConfig={{
                        backgroundColor: "#fafafa",
                        backgroundGradientFrom: "#fafafa",
                        backgroundGradientTo: "#ffffff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        propsForDots: { r: "0", strokeWidth: "0" },
                        propsForBackgroundLines: { strokeWidth: 1, stroke: "rgba(0,0,0,0.1)" },
                        formatYLabel: (value) => {
                          const num = parseFloat(value);
                          return num >= 1000 ? `${Math.round(num/1000)}k` : `${Math.round(num)}`;
                        }
                      }}
                      bezier
                      withDots={false}
                      style={styles.chart}
                    />
                    <Text style={styles.chartTimeframe}>Last 30 days</Text>
                  </View>
                ) : (
                  <View style={styles.chartLoadingContainer}>
                    <ActivityIndicator size="large" color="#006a4d" />
                    <Text style={styles.chartLoadingText}>Loading chart data...</Text>
                  </View>
                )}
              </View>
              <View style={styles.assetStatsContainer}>
                <View style={styles.assetStat}>
                  <Text style={styles.assetStatLabel}>Market Cap</Text>
                  <Text style={styles.assetStatValue}>£{(selectedAsset.marketCap / 1000000000).toFixed(2)}B</Text>
                </View>
                <View style={styles.assetStat}>
                  <Text style={styles.assetStatLabel}>24h Volume</Text>
                  <Text style={styles.assetStatValue}>£{(selectedAsset.volume24h / 1000000).toFixed(2)}M</Text>
                </View>
                <View style={styles.assetStat}>
                  <Text style={styles.assetStatLabel}>Category</Text>
                  <Text style={styles.assetStatValue}>{selectedAsset.category}</Text>
                </View>
              </View>
              <Text style={styles.assetDescription}>{selectedAsset.description}</Text>
              <View style={styles.transactionButtons}>
                <TouchableOpacity style={[styles.transactionButton, styles.buyButton]} activeOpacity={0.8} onPress={() => openTransactionModal('buy')}>
                  <Text style={styles.transactionButtonText}>Buy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.transactionButton, styles.sellButton]} activeOpacity={0.8} onPress={() => openTransactionModal('sell')}>
                  <Text style={styles.transactionButtonText}>Sell</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderTransactionModal = () => {
    if (!selectedAsset) return null;
    return (
      <Modal
        visible={showTransactionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTransactionModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={50} // Give more space
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setShowTransactionModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>{transactionType === 'buy' ? 'Buy' : 'Sell'} {selectedAsset.symbol}</Text>
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
                      <Text style={styles.assetInfoValue}>{portfolio.assets[selectedAsset.id].quantity.toFixed(6)} {selectedAsset.symbol}</Text>
                    </View>
                  )}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Amount to {transactionType} (£):</Text>
                    <View style={styles.improvedInputWrapper}>
                      <TextInput
                        style={styles.improvedAmountInput}
                        value={transactionAmount}
                        onChangeText={setTransactionAmount}
                        placeholder="Enter amount"
                        keyboardType="decimal-pad"
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                      />
                    </View>
                  </View>
                  {parseFloat(transactionAmount) > 0 && (
                    <View style={styles.estimatedContainer}>
                      <Text style={styles.estimatedLabel}>Estimated {selectedAsset.symbol}:</Text>
                      <Text style={styles.estimatedValue}>
                        {(parseFloat(transactionAmount) / selectedAsset.currentPrice).toFixed(6)} {selectedAsset.symbol}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.improvedTransactionButton}
                    activeOpacity={0.8}
                    onPress={processTransaction}
                  >
                    <Text style={styles.improvedTransactionButtonText}>
                      {transactionType === 'buy' ? 'Buy' : 'Sell'} {selectedAsset.symbol}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderCategoryFilter = () => {
    const categories: (AssetCategory | 'All')[] = ['All', 'Stocks', 'ETFs', 'Crypto', 'Bonds', 'Real Estate'];
    return (
      <View style={styles.categoryFilterWrapper}>
        <ScrollView
          ref={categoryScrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.categoryFilterContainer}
          onScroll={handleCategoryScroll}
          scrollEventThrottle={16}
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
              <Text style={[
                styles.categoryFilterText,
                selectedCategory === category && styles.categoryFilterTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {showCategoryIndicator && (
          <View style={styles.scrollIndicator}>
            <Ionicons name="chevron-forward" size={20} color="#006a4d" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Investments</Text>
        <Text style={styles.subtitle}>Take control of your financial future.</Text>
      </View>
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006a4d" />
          <Text style={styles.loadingText}>Loading assets...</Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {activeTab === 'assets' ? (
            <View style={{ flex: 1 }}>
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
                    const options: ('name' | 'price' | 'change')[] = ['name', 'price', 'change'];
                    const currentIndex = options.indexOf(sortOption);
                    const nextIndex = (currentIndex + 1) % options.length;
                    setSortOption(options[nextIndex]);
                  }}
                >
                  <MaterialCommunityIcons name="sort" size={24} color="#333" />
                  <Text style={styles.sortLabel}>
                    {sortOption === 'name' ? 'Name' : sortOption === 'price' ? 'Price' : 'Change'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eaeaea' }}>
                {renderCategoryFilter()}
              </View>
              <FlatList
                data={filteredAssets}
                renderItem={renderAssetItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.assetList}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
              {renderPortfolioAnalytics()}
            </ScrollView>
          )}
        </View>
      )}
      {renderAssetDetailModal()}
      {renderTransactionModal()}
    </SafeAreaView>
  );
};

// --- Helper for category styles ---
const getCategoryStyle = (category: AssetCategory) => {
  switch (category) {
    case 'Stocks':
      return { backgroundColor: '#3498DB' };
    case 'ETFs':
      return { backgroundColor: '#9B59B6' };
    case 'Crypto':
      return { backgroundColor: '#F1C40F' };
    case 'Bonds':
      return { backgroundColor: '#16A085' };
    case 'Real Estate':
      return { backgroundColor: '#E74C3C' };
    default:
      return { backgroundColor: '#CCCCCC' };
  }
};

// --- Styles ---
const styles = StyleSheet.create({
  chartWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buyButton: {
    backgroundColor: '#006a4d',
  },
  sellButton: {
    backgroundColor: '#555555',
  },
  categoryFilterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  headerContainer: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  assetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderBottomColor: '#006a4d',
  },
  tabText: {
    fontSize: 16,
    color: '#777',
  },
  activeTabText: {
    color: '#006a4d',
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
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
    paddingVertical: 4,
    paddingBottom: 6,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    flexGrow: 0,
  },
  categoryFilterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  categoryFilterButtonActive: {
    backgroundColor: '#006a4d',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#555',
  },
  categoryFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
    paddingTop: 4,
  },
  assetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assetTitleContainer: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  assetName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  priceContainer: {
    marginBottom: 8,
  },
  assetPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  positiveChange: {
    color: '#00B16A',
  },
  negativeChange: {
    color: '#FF5454',
  },
  marketInfoContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  marketInfoItem: {
    marginRight: 16,
  },
  marketInfoLabel: {
    fontSize: 12,
    color: '#999',
  },
  marketInfoValue: {
    fontSize: 14,
    color: '#333',
  },
  holdingInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  holdingText: {
    fontSize: 14,
    color: '#666',
  },
  holdingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: 40,
    paddingBottom: 80,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 65, // Adjust to give more space
    marginBottom: 30,
    maxHeight: '80%', // Limit max height
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
    maxHeight: 1000,
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
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  assetStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  assetStat: {
    width: '50%',
    paddingVertical: 6,
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
  assetDescription: {
    padding: 16,
    fontSize: 14,
    color: '#555',
  },
  transactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  transactionButton: {
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  transactionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  transactionForm: {
    padding: 20,
    paddingBottom: 30, // Add more padding at the bottom
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
    flex: 1,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chartTimeframe: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  chartLoadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLoadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
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
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  },
  improvedTransactionButton: {
    backgroundColor: '#006a4d',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  improvedTransactionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  portfolioCashValueAdjusted: {
    fontSize: 20, // Reduced from 24
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  improvedChart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  transactionsList: {
    maxHeight: 250, // Set a fixed height for scrolling
  },
    // In your StyleSheet
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  doneButtonText: {
    fontSize: 16,
    color: '#006a4d',
    fontWeight: '600',
  },
  improvedInputWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  improvedAmountInput: {
    fontSize: 28, // Larger font
    paddingVertical: 16, // More vertical padding
    paddingHorizontal: 16,
    textAlign: 'center',
    minHeight: 70, // Ensure enough height
  },
  holdingsList: {
    maxHeight: 300, // Set a fixed height for scrolling
  },
});

export default InvestmentsScreen;