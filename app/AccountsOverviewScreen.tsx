import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Image
} from 'react-native';
import { useUser } from '../context/UserContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';

// Define card colors for different account types
const accountTypeColors: Record<string, string[]> = {
  "Personal Current Account": ["#006a4d", "#00472e"],
  "Savings": ["#4285F4", "#2a64b9"],
  "Credit Card": ["#9C27B0", "#7B1FA2"],
  "Overdraft": ["#FF5722", "#E64A19"],
};

// Default gradient
const defaultGradient = ["#607D8B", "#455A64"];

export default function AccountsOverviewScreen() {
  const router = useRouter();
  const { accounts, customerId, fetchAccountsData, isLoading } = useUser();

  // Fetch accounts when screen loads
  useEffect(() => {
    if (customerId) {
      fetchAccountsData(customerId);
    }
  }, [customerId]);

  // Navigate to account details
  const handleAccountPress = (accountId: string) => {
    router.push({
      pathname: '/AccountDetailsScreen',
      params: { accountId }
    });
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const rendercarddesign = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => handleAccountPress(item.account_id)}
        activeOpacity={0.8}
      >
        <ExpoImage
          source={require('../assets/images/carddesign.png')}
          style={styles.cardImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <View style={styles.overlay} />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.accountType}>{item.product.product_type}</Text>
              <Text style={styles.accountName}>{item.product.product_name}</Text>
            </View>
          </View>
          
          <View style={styles.cardBody}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceAmount}>
              {typeof item.starting_balance === 'number' ? 
                formatCurrency(item.starting_balance) : 
                '£0.00'}
            </Text>
          </View>
          
          <View style={styles.cardFooter}>
            <Text style={styles.accountId}>Account ID: {item.account_id}</Text>
            <Text style={styles.accountSince}>Since: {formatDate(item.since)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render empty state when no accounts
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="wallet-outline" size={60} color="#ccc" />
      <Text style={styles.emptyStateText}>No accounts found</Text>
      <Text style={styles.emptyStateSubText}>
        Any accounts linked to your profile will appear here
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006a4d" />
        <Text style={styles.loadingText}>Loading your accounts...</Text>
      </View>
    );
  }

  // Update the static header to include the dynamic subtitle
  return (
    <View style={styles.container}>
      {/* Static Header with dynamic subtitle */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Accounts Overview</Text>
        <Text style={styles.subtitle}>
          {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} available
        </Text>
      </View>
      
      <FlatList
        data={accounts}
        renderItem={rendercarddesign}
        keyExtractor={(item) => item.account_id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Changed from #f5f5f7
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
  listContainer: {
    padding: 16,
    paddingTop: 8, // Reduced padding since the header is now part of the scroll content
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    overflow: 'hidden',
    height: 200, // Fixed height for consistency
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0)",
  },
  cardContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  accountType: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cardBody: {
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 6,
  },
  accountId: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  accountSince: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // Changed from #f5f5f7
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
// Update the headerContainer style to match the page background
headerContainer: {
  padding: 16,
  paddingTop: 14,
  paddingBottom: 14,
  backgroundColor: '#ffffff', // Changed from '#fff' to match container background
},
});