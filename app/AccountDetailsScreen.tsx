import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useUser } from '../context/UserContext';
import { getAccountTransactions } from '../api/userData';
import { Ionicons } from "@expo/vector-icons";

// Enhanced icon mapping for transaction categories
// Maps category names (lowercase) to Ionicons names.
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

/**
 * Helper function to determine the appropriate Ionicons icon for a given transaction category.
 * Performs case-insensitive matching and attempts partial matches before falling back to a default icon.
 * @param category - The transaction category string.
 * @returns The name of the Ionicons icon.
 */
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

// Interface defining the structure of a transaction object
interface Transaction {
  transaction_id: string;
  account_id: string;
  transaction_date: string;
  transaction_amount: number;
  transaction_category: string;
  transaction_reference: string;
}

/**
 * Account Details Screen Component.
 * Displays the details of a specific bank account, including its name,
 * current balance, and a list of recent transactions.
 * Fetches transaction data based on the account ID passed via navigation parameters.
 */
export default function AccountDetailsScreen() {
  // Get accountId from navigation parameters
  const { accountId } = useLocalSearchParams();
  // Access user accounts from context
  const { accounts } = useUser();
  // State for storing transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // State to manage loading indicator
  const [loading, setLoading] = useState(true);

  // Find the specific account details using the accountId
  const account = accounts.find(a => a.account_id === accountId);

  // Effect hook to fetch transactions when the accountId changes
  useEffect(() => {
    async function loadTransactions() {
      if (accountId) {
        try {
          setLoading(true);
          // Fetch transactions for the given accountId
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
  }, [accountId]); // Dependency array ensures this runs when accountId changes

  /**
   * Formats a number as a currency string (e.g., £123.45).
   * @param amount - The numerical amount.
   * @returns The formatted currency string.
   */
  const formatCurrency = (amount: number) => {
    return `£${Math.abs(amount).toFixed(2)}`;
  };

  // Render error message if the account is not found
  if (!account) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Account not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section: Displays the account product name */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{account.product.product_name}</Text>
      </View>

      {/* Balance Section: Displays the current account balance */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>
          {typeof account.starting_balance === 'number' 
            ? `£${account.starting_balance.toFixed(2)}`
            : '£0.00'}
        </Text>
      </View>
      {/* Transactions Section: Displays a list of transactions or loading/empty state */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Transactions</Text>

        {loading ? (
          // Show loading indicator while fetching data
          <ActivityIndicator size="large" color="#006a4d" style={styles.loader} />
        ) : transactions.length === 0 ? (
          // Show message if no transactions are found
          <Text style={styles.emptyText}>No transactions found</Text>
        ) : (
          // Render the list of transactions
          <FlatList
            data={transactions}
            keyExtractor={item => item.transaction_id}
            renderItem={({ item }) => (
              <View style={styles.transactionItem}>
                {/* Transaction details: Icon, Reference, Category, Date */}
                <View style={styles.transactionInfo}>
                  <Ionicons
                    name={getIconForCategory(item.transaction_category)}
                    size={24}
                    color="#015F45"
                    style={styles.transactionIcon}
                  />
                  {/* Wrap text details in a View */}
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
                {/* Transaction amount, styled based on positive/negative value */}
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

// Styles for the AccountDetailsScreen component
const styles = StyleSheet.create({
  // Main container for the screen
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  // Container for the header section (account name)
  headerContainer: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: '#ffffff',
  },
  // Style for the main title (account name)
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  // Container for the balance section
  balanceContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  // Style for the "Current Balance" label
  balanceLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  // Style for the balance amount text
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  // Container for the transactions list section
  transactionsContainer: {
    flex: 1, // Takes remaining vertical space
    padding: 16,
    paddingBottom: 0, // Avoid extra padding at the bottom
  },
  // Style for the "Transactions" section title
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  // Style for the loading indicator
  loader: {
    marginTop: 40,
  },
  // Style for the text shown when there are no transactions
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
  // Style for the error text when an account isn't found
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'red',
    marginTop: 40,
  },
  // Style for each individual transaction item card
  transactionItem: {
    backgroundColor: '#f3fee8', // Light green background
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row', // Arrange icon/info and amount horizontally
    justifyContent: 'space-between', // Push amount to the right
    alignItems: 'center', // Vertically align items
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2, // Android shadow
  },
  // Container for the transaction icon and text details
  transactionInfo: {
    flexDirection: 'row', // Arrange icon and text horizontally
    alignItems: 'center', // Vertically align icon and text block
  },
  // Style for the transaction category icon
  transactionIcon: {
    marginRight: 12, // Space between icon and text
  },
  // Style for the transaction reference text
  transactionReference: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  // Style for the transaction category text
  transactionCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  // Style for the transaction date text
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  // Style for the transaction amount text
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Style for positive transaction amounts (credits)
  positive: {
    color: '#015F45', // Bankable green
  },
  // Style for negative transaction amounts (debits)
  negative: {
    color: '#000000', // Black color for debits
  },
});