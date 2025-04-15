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

// Import dummy data
import initialAssetsData from '../data/assets.json';
import initialPortfolioData from '../data/initialPortfolio.json';

const screenWidth = Dimensions.get('window').width;

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

interface HoldingDataItem {
  assetId: string;
  asset: Asset;
  holding: {
    quantity: number;
    averagePrice: number;
  };
  value: number;
}

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

const InvestmentsScreen: React.FC = () => {
  // Initialize with data from JSON files
  const [assets, setAssets] = useState<Asset[]>(initialAssetsData as Asset[]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>(initialAssetsData as Asset[]);
  const [portfolio, setPortfolio] = useState<Portfolio>(initialPortfolioData);
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

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadPortfolio(),
          loadFavorites()
        ]);
        // Simulate API fetch with a delay
        setTimeout(() => {
          simulateAssetUpdate();
          setLoading(false);
        }, 200);
      } catch (error) {
        console.error('Error initializing data:', error);
        setLoading(false);
      }
    };

    initialize();

    // Simulate periodic updates
    const refreshInterval = setInterval(() => {
      if (!showAssetModal && !showTransactionModal) {
        simulateAssetUpdate();
      }
    }, 60000);
    return () => clearInterval(refreshInterval);
  }, []);

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

  const handleCategoryScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isScrolledToEnd = layoutMeasurement.width + contentOffset.x >= contentSize.width - 20;
    setShowCategoryIndicator(!isScrolledToEnd);
  };

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

  // Simulate updating asset data
  const simulateAssetUpdate = () => {
    setRefreshing(true);
    
    // Create a small random fluctuation for asset prices
    const updatedAssets = assets.map(asset => {
      // Random change between -2% and +2%
      const randomPercentageChange = (Math.random() * 4 - 2) / 100;
      const priceChange = asset.currentPrice * randomPercentageChange;
      const newPrice = asset.currentPrice + priceChange;
      
      // New historical prices: drop the first and add the new price
      const newHistoricalPrices = asset.historicalData?.prices.slice(1) || [];
      newHistoricalPrices.push(newPrice);
      
      return {
        ...asset,
        currentPrice: newPrice,
        priceChange24h: priceChange,
        priceChangePercentage24h: randomPercentageChange * 100,
        historicalData: {
          labels: asset.historicalData?.labels || [],
          prices: newHistoricalPrices
        }
      };
    });
    
    setAssets(updatedAssets);
    
    // Filter and sort the updated assets
    const filtered = updatedAssets.filter(asset => {
      const matchesCategory = selectedCategory === 'All' || asset.category === selectedCategory;
      const matchesSearch = !searchQuery ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    
    setFilteredAssets(filtered);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    simulateAssetUpdate();
    // Simulate a delay for better UX
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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

  const refreshAssetHistoricalData = async (asset: Asset) => {
    // Simulate API call with some delay
    return new Promise<{labels: string[], prices: number[]}>(resolve => {
      setTimeout(() => {
        resolve(asset.historicalData || { labels: [], prices: [] });
      }, 500);
    });
  };

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

  const openTransactionModal = (type: 'buy' | 'sell') => {
    if (!selectedAsset) return;
    if (type === 'sell') {
      const assetHolding = portfolio.assets[selectedAsset.id];
      if (!assetHolding || assetHolding.quantity <= 0) {
        Alert.alert("Cannot Sell", "You don't own any shares of this asset to sell.", [{ text: "OK" }]);
        return;
      }
    }
    
    const asset = selectedAsset;
    setShowAssetModal(false);
    setTimeout(() => {
      setSelectedAsset(asset);
      setTransactionType(type);
      setTransactionAmount('');
      setShowTransactionModal(true);
    }, 300);
  };

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
    
    const chartData = Object.entries(categoryMap).map(([category, value]) => {
      const colorStyle = getCategoryStyle(category as AssetCategory);
      const backgroundColor = colorStyle.backgroundColor;
      const percentage = (value / totalValue) * 100;
      const roundedPercentage = percentage.toFixed(1);
      return {
        name: `% ${category}`,
        value: parseFloat(roundedPercentage),
        legend: `% ${category}`,
        color: backgroundColor,
        legendFontColor: '#333333',
        legendFontSize: 12
      };
    });
    
    return chartData;
  };

  const getPortfolioPerformanceData = () => {
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
  
    const dataPoints: {date: Date, value: number}[] = [];
    let runningBalance = portfolio.balance;
    let runningAssets: {[assetId: string]: {quantity: number, averagePrice: number}} = {};
    
    dataPoints.push({
      date: new Date(),
      value: calculateTotalPortfolioValue()
    });
  
    const recentTransactions = portfolio.transactions.slice(0, 6);
    for (let i = 0; i < recentTransactions.length; i++) {
      const transaction = recentTransactions[i];
      const asset = assets.find(a => a.id === transaction.assetId);
      if (!asset) continue;
      
      let estimatedValue = dataPoints[dataPoints.length - 1].value;
      if (transaction.type === 'buy') {
        estimatedValue -= asset.currentPrice * transaction.quantity;
      } else {
        estimatedValue += asset.currentPrice * transaction.quantity;
      }
      
      dataPoints.push({
        date: new Date(transaction.date),
        value: Math.max(estimatedValue, 0)
      });
    }
    
    dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
    
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
    
    const holdingsData = Object.entries(portfolio.assets)
      .map(([assetId, holding]): HoldingDataItem | null => {
        // Only include assets with positive quantity
        if (holding.quantity <= 0) return null;
        
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return null;
        
        const currentValue = asset.currentPrice * holding.quantity;
        return { assetId, asset, holding, value: currentValue };
      })
      .filter((item): item is HoldingDataItem => item !== null)
      .sort((a, b) => b.value - a.value);
    
    return (
      <View style={styles.portfolioAnalyticsContainer}>
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
                propsForDots: { r: "0" },
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

        <View style={styles.holdingsContainer}>
          <Text style={styles.sectionTitle}>Your Holdings</Text>
          {holdingsData.length > 0 ? (
            <View style={styles.holdingsListContainer}>
              <FlatList
                data={holdingsData}
                keyExtractor={(item) => item.assetId}
                renderItem={({ item }) => {
                  const { assetId, asset, holding } = item;
                  const currentValue = asset.currentPrice * holding.quantity;
                  const investedValue = holding.averagePrice * holding.quantity;
                  const profit = currentValue - investedValue;
                  const profitPercentage = (profit / investedValue) * 100;
                  
                  return (
                    <TouchableOpacity 
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
                initialNumToRender={3}
                maxToRenderPerBatch={5}
                showsVerticalScrollIndicator={true}
                style={styles.holdingsList}
                contentContainerStyle={styles.holdingsListContent}
              />
              {holdingsData.length > 3 && (
                <Text style={styles.scrollIndicatorText}>Scroll for more</Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="finance" size={48} color="#BBBBBB" />
              <Text style={styles.emptyStateText}>You don't have any investments yet.</Text>
              <Text style={styles.emptyStateSubtext}>Start investing by exploring assets!</Text>
            </View>
          )}
        </View>
        
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {portfolio.transactions.length > 0 ? (
            <View style={styles.transactionsListContainer}>
              <FlatList
                data={portfolio.transactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => renderTransactionItem({ item })}
                initialNumToRender={3}
                maxToRenderPerBatch={5}
                showsVerticalScrollIndicator={true}
                style={styles.transactionsList}
                contentContainerStyle={styles.transactionsListContent}
              />
              {portfolio.transactions.length > 3 && (
                <Text style={styles.scrollIndicatorText}>Scroll for more</Text>
              )}
            </View>
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
              
              {selectedAsset.historicalData && selectedAsset.historicalData.prices.length > 0 ? (
                <View style={styles.cleanChartContainer}>
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
                          strokeWidth: 2.5
                        }
                      ]
                    }}
                    width={screenWidth - 38}
                    height={220}
                    yAxisLabel="£"
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: "#ffffff",
                      backgroundGradientFrom: "#ffffff",
                      backgroundGradientTo: "#ffffff",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.5})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.5})`,
                      propsForDots: { r: "0" },
                      strokeWidth: 2.5,
                      propsForBackgroundLines: { 
                        strokeWidth: 0.5, 
                        stroke: "rgba(0,0,0,0.05)",
                        strokeDasharray: "5, 5"
                      },
                      propsForLabels: {
                        fontSize: 10,
                        opacity: 0.8,
                        fill: "#666"
                      },
                      formatYLabel: (value) => {
                        const num = parseFloat(value);
                        if (num >= 1000000) return `£${(num/1000000).toFixed(1)}M`;
                        if (num >= 1000) return `£${(num/1000).toFixed(1)}k`;
                        return `£${Math.round(num)}`;
                      }
                    }}
                    bezier
                    withDots={false}
                    withInnerLines={false}
                    withOuterLines={true}
                    withVerticalLines={false}
                    withVerticalLabels={false}
                    withHorizontalLabels={true}
                    withHorizontalLines={true}
                    horizontalLabelRotation={0}
                    yLabelsOffset={5}
                    segments={4}
                    style={styles.cleanChart}
                    fromZero={false}
                  />
                  <Text style={styles.chartTimeframe}>Last 30 days</Text>
                </View>
              ) : (
                <View style={styles.chartLoadingContainer}>
                  <ActivityIndicator size="large" color="#006a4d" />
                  <Text style={styles.chartLoadingText}>Loading chart data...</Text>
                </View>
              )}
              
              <View style={styles.compactStatsContainer}>
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
              
              <Text style={styles.compactAssetDescription}>{selectedAsset.description}</Text>
              
              <View style={styles.compactTransactionButtons}>
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
          keyboardVerticalOffset={10}
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
                  
                  {transactionType === 'buy' ? (
                    <View style={styles.assetInfoContainer}>
                      <Text style={styles.assetInfoLabel}>Available Balance:</Text>
                      <Text style={styles.assetInfoValue}>£{portfolio.balance.toFixed(2)}</Text>
                    </View>
                  ) : (
                    portfolio.assets[selectedAsset.id] && (
                      <>
                        <View style={styles.assetInfoContainer}>
                          <Text style={styles.assetInfoLabel}>Available {selectedAsset.symbol}:</Text>
                          <Text style={styles.assetInfoValue}>{portfolio.assets[selectedAsset.id].quantity.toFixed(6)} {selectedAsset.symbol}</Text>
                        </View>
                        <View style={styles.assetInfoContainer}>
                          <Text style={styles.assetInfoLabel}>Total Value:</Text>
                          <Text style={styles.assetInfoValue}>
                            £{(portfolio.assets[selectedAsset.id].quantity * selectedAsset.currentPrice).toFixed(2)}
                          </Text>
                        </View>
                      </>
                    )
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
                    style={[
                      styles.improvedTransactionButton,
                      transactionType === 'sell' ? styles.sellButton : null,
                      { marginTop: 15 }
                    ]}
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
  assetDetailPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  assetDetailPriceChange: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
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
    marginTop: 10,
    marginBottom: 10,
    maxHeight: '90%',
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
    maxHeight: 600,
  },
  assetPriceHeader: {
    alignItems: 'center',
    paddingVertical: 12,
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
    width: '33%',
    paddingVertical: 4,
  },
  assetStatLabel: {
    fontSize: 12,
    color: '#777',
  },
  assetStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
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
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 14,
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
    paddingBottom: 30,
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
    fontSize: 12,
    color: '#888',
    marginTop: 4,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  improvedChart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  transactionsList: {
    maxHeight: 250,
  },
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
    fontSize: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    textAlign: 'center',
    minHeight: 50,
  },
  holdingsList: {
    maxHeight: 350,
  },
  cleanChartContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 8,
    paddingLeft: 0,
    paddingRight: 12,
    marginHorizontal: 0,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  cleanChart: {
    marginVertical: 4,
    borderRadius: 8,
    paddingLeft: 10,
    marginRight: -10,
  },
  compactStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 0,
  },
  compactAssetDescription: {
    padding: 16,
    paddingTop: 8,
    fontSize: 14,
    color: '#555',
    maxHeight: 120,
  },
  compactTransactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  holdingsListContainer: {
    height: 350, // Set a fixed height for the container
    borderRadius: 12,
    overflow: 'hidden',
  },
  holdingsListContent: {
    paddingVertical: 4,
  },
  scrollIndicatorText: {
    textAlign: 'center',
    color: '#777',
    fontSize: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(245, 245, 245, 0.9)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  transactionsListContainer: {
    height: 250, // Set a fixed height for the container
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionsListContent: {
    paddingVertical: 4,
  },
});

export default InvestmentsScreen;