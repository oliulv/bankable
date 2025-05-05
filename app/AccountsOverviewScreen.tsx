import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';

/**
 * Accounts Overview Screen Component.
 * Displays a list of the user's bank accounts in a card format.
 * Allows navigation to the details screen for each account.
 * Fetches account data using the UserContext.
 */
export default function AccountsOverviewScreen() {
  const router = useRouter();
  // Access user accounts, customer ID, fetch function, and loading state from context
  const { accounts, customerId, fetchAccountsData, isLoading } = useUser();

  // Effect hook to fetch accounts data when the component mounts or customerId changes
  useEffect(() => {
    if (customerId) {
      fetchAccountsData(customerId);
    }
  }, [customerId]); // Dependency array ensures this runs when customerId is available/changes

  /**
   * Navigates to the Account Details screen for the selected account.
   * @param accountId - The ID of the account to view details for.
   */
  const handleAccountPress = (accountId: string) => {
    router.push({
      pathname: '/AccountDetailsScreen',
      params: { accountId }
    });
  };

  /**
   * Formats a number as a currency string in GBP (e.g., £1,234.56).
   * @param amount - The numerical amount.
   * @returns The formatted currency string.
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  /**
   * Formats a date string into a more readable format (e.g., 5 May 2025).
   * @param dateString - The date string to format.
   * @returns The formatted date string.
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  /**
   * Renders a single account card item for the FlatList.
   * Includes account details, balance, and uses an image background.
   * @param item - The account data object for the current item.
   */
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

  /**
   * Renders a message and icon when the user has no accounts.
   */
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="wallet-outline" size={60} color="#ccc" />
      <Text style={styles.emptyStateText}>No accounts found</Text>
      <Text style={styles.emptyStateSubText}>
        Any accounts linked to your profile will appear here
      </Text>
    </View>
  );

  // Display loading indicator while fetching data
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006a4d" />
        <Text style={styles.loadingText}>Loading your accounts...</Text>
      </View>
    );
  }

  // Main component render
  return (
    <View style={styles.container}>
      {/* Static Header displaying title and account count */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Accounts Overview</Text>
        <Text style={styles.subtitle}>
          {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} available
        </Text>
      </View>

      {/* List of account cards */}
      <FlatList
        data={accounts}
        renderItem={rendercarddesign} // Use the card design renderer
        keyExtractor={(item) => item.account_id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState} // Show empty state if no accounts
      />
    </View>
  );
}

// Styles for the AccountsOverviewScreen component
const styles = StyleSheet.create({
  // Main container style
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Changed from #f5f5f7
  },
  // Style for the main title
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  // Style for the subtitle (account count)
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  // Style for the FlatList container
  listContainer: {
    padding: 16,
    paddingTop: 8, // Reduced padding since the header is now part of the scroll content
    paddingBottom: 32,
  },
  // Style for individual account cards
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
  // Style for the card background image
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  // Style for the overlay on the card (currently transparent)
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0)",
  },
  // Style for the content container positioned over the card image
  cardContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: "space-between",
  },
  // Style for the header section within the card
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  // Style for the account type text (e.g., "Personal Current Account")
  accountType: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  // Style for the account name text
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Style for the body section of the card (balance)
  cardBody: {
    marginBottom: 16,
  },
  // Style for the "Balance" label
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  // Style for the balance amount text
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Style for the footer section of the card (account ID, since date)
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 6,
  },
  // Style for the account ID text
  accountId: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  // Style for the "Since" date text
  accountSince: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  // Style for the loading container shown during data fetch
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // Changed from #f5f5f7
  },
  // Style for the text accompanying the loading indicator
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  // Style for the container shown when there are no accounts
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  // Style for the main text in the empty state view
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
  },
  // Style for the secondary text in the empty state view
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Style for the static header container at the top of the screen
  headerContainer: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#ffffff', // Changed from '#fff' to match container background
  },
});