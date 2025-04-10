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
import { LinearGradient } from 'expo-linear-gradient';

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

  // Get appropriate gradient colors based on account type
  const getAccountGradient = (type: string): [string, string, ...string[]] => {
    return (accountTypeColors[type] as [string, string, ...string[]]) || defaultGradient;
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

  // Render each account card
  const renderAccountCard = ({ item }: { item: any }) => {
    const gradientColors = getAccountGradient(item.product.product_type);
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => handleAccountPress(item.account_id)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.accountType}>{item.product.product_type}</Text>
              <Text style={styles.accountName}>{item.product.product_name}</Text>
            </View>
            <View style={styles.accountIconContainer}>
              <Ionicons 
                name={
                  item.product.product_type === "Credit Card" ? "card" :
                  item.product.product_type === "Savings" ? "wallet" :
                  "cash"
                } 
                size={24} 
                color="#ffffff" 
              />
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
        </LinearGradient>
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

  // Create a header component that will be part of the scrollable content
  const renderListHeader = () => (
    <View style={styles.scrollableHeader}>
      <Text style={styles.title}>Accounts Overview</Text>
      <Text style={styles.subtitle}>
        {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} available
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

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        renderItem={renderAccountCard}
        keyExtractor={(item) => item.account_id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  // Remove the old header styles
  // header: { ... },
  
  // Add this new style for the scrollable header
  scrollableHeader: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 16,
    marginBottom: 4,
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
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  accountIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingTop: 12,
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
    backgroundColor: '#f5f5f7',
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
  }
});