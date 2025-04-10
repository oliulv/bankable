import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AccountInfo } from '../context/UserContext';

interface AccountCardProps {
  account: AccountInfo;
}

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/AccountDetailsScreen',
      params: { accountId: account.account_id }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.accountType}>{account.product.product_type}</Text>
        <Text style={styles.accountName}>{account.product.product_name}</Text>
      </View>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={styles.balance}>{formatCurrency(account.starting_balance)}</Text>
      </View>
      
      {account.product.product_benefits && (
        <Text style={styles.benefits}>{account.product.product_benefits}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  accountType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceContainer: {
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balance: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  benefits: {
    marginTop: 8,
    fontSize: 14,
    color: '#4caf50',
  },
});

export default AccountCard;