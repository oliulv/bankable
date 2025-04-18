import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useUser } from '../context/UserContext';
import { getAccountTransactions } from '../api/userData';
import { Ionicons } from "@expo/vector-icons";

// Enhanced icon mapping with more fallbacks and case-insensitive matching
const categoryToIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  "food": "fast-food-outline",
  "shopping": "cart-outline",
  "monthly income": "trending-up-outline",
  "leisure": "videocam-outline",
  "saving": "wallet-outline",
  "utility": "flash-outline",
  "withdrawal": "cash-outline",
  "interest": "trending-up-outline",
  "health": "fitness-outline",
  "transfer": "swap-horizontal-outline",
  "clothing": "shirt-outline",
  "mortgage": "home-outline",
  "gambling": "game-controller-outline",
};

// Helper function to get appropriate icon
const getIconForCategory = (category: string): keyof typeof Ionicons.glyphMap => {
  // Normalize category to lowercase for case-insensitive matching
  const normalizedCategory = category?.toLowerCase()?.trim() || '';
  
  // Try direct match
  if (categoryToIcon[normalizedCategory]) {
    return categoryToIcon[normalizedCategory];
  }
  
  // Try to find partial matches
  for (const [key, icon] of Object.entries(categoryToIcon)) {
    if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
      return icon;
    }
  }
  
  // Default fallback
  return "card-outline";
};

interface Transaction {
  transaction_id: string;
  account_id: string;
  transaction_date: string;
  transaction_amount: number;
  transaction_category: string;
  transaction_reference: string;
}

export default function AccountDetailsScreen() {
  const { accountId } = useLocalSearchParams();
  const { accounts } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Find the account from context
  const account = accounts.find(a => a.account_id === accountId);

  useEffect(() => {
    async function loadTransactions() {
      if (accountId) {
        try {
          setLoading(true);
          const data = await getAccountTransactions(accountId as string);
          setTransactions(data);
        } catch (error) {
          console.error('Error fetching transactions:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    loadTransactions();
  }, [accountId]);

  const formatCurrency = (amount: number) => {
    return `£${Math.abs(amount).toFixed(2)}`;
  };

  if (!account) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Account not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Static Header - only show account name */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{account.product.product_name}</Text>
      </View>

      {/* Simple Balance Display */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>
          {typeof account.starting_balance === 'number' 
            ? `£${account.starting_balance.toFixed(2)}`
            : '£0.00'}
        </Text>
      </View>
      {/* Transactions Section */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Transactions</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#006a4d" style={styles.loader} />
        ) : transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions found</Text>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={item => item.transaction_id}
            renderItem={({ item }) => (
              <View style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Ionicons
                    name={getIconForCategory(item.transaction_category)}
                    size={24}
                    color="#015F45"
                    style={styles.transactionIcon}
                  />
                  <View>
                    <Text style={styles.transactionReference}>
                      {item.transaction_reference}
                    </Text>
                    <Text style={styles.transactionCategory}>
                      {item.transaction_category}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(item.transaction_date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    item.transaction_amount < 0 ? styles.negative : styles.positive,
                  ]}
                >
                  {item.transaction_amount < 0 ? '-' : '+'}
                  {formatCurrency(item.transaction_amount)}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Changed from #f5f5f7
  },
  headerContainer: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: '#ffffff', // Changed from #f5f5f7
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  balanceContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#ffffff', // Changed from #f5f5f7
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  separator: {
    height: 1,
    backgroundColor: '#eaeaea',
    marginHorizontal: 16,
  },
  transactionsContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'red',
    marginTop: 40,
  },
  transactionItem: {
    backgroundColor: '#f3fee8', // Changed from #ffffff
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionReference: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  transactionCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positive: {
    color: '#015F45', // Changed from '#4caf50' to '#015F45'
  },
  negative: {
    color: '#000000', // Changed from '#f44336' (red) to black
  },
});