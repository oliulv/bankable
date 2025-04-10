import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useUser } from '../context/UserContext';
import { getAccountTransactions } from '../api/userData';
import { Ionicons } from "@expo/vector-icons";

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
      <View style={styles.accountHeader}>
        <Text style={styles.accountType}>{account.product.product_type}</Text>
        <Text style={styles.accountName}>{account.product.product_name}</Text>
        <Text style={styles.balance}>£{account.starting_balance.toFixed(2)}</Text>
      </View>

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
                    name="card-outline"
                    size={24}
                    color="#006a4d"
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
    backgroundColor: '#f5f5f7',
  },
  accountHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#006a4d',
  },
  accountType: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  balance: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  transactionsContainer: {
    flex: 1,
    padding: 16,
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
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
    color: '#4caf50',
  },
  negative: {
    color: '#f44336',
  },
});