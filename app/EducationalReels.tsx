import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import financial tips data from a local JSON file
import FINANCIAL_TIPS_DATA from '../data/reels.json';

// --- Types ---

/** Defines the structure for a single financial tip object. */
interface FinancialTip {
  id: string;         // Unique identifier for the tip
  title: string;      // Title of the tip
  content: string;    // Main content/explanation of the tip
  category: string;   // Category the tip belongs to (e.g., Budgeting, Investing)
  isFavorite: boolean; // Flag indicating if the user has saved this tip
}

// --- Constants ---

// Get screen dimensions for layout calculations
const { width, height } = Dimensions.get('window');

// Constants for pagination (loading tips in batches)
const INITIAL_BATCH_SIZE = 15; // Number of tips to load initially
const LOAD_MORE_BATCH_SIZE = 10; // Number of tips to load when scrolling near the end

// --- Utility Functions ---

/**
 * Shuffles an array in place using the Fisher-Yates (Knuth) algorithm.
 * @param array The array to shuffle.
 * @returns A new array with the elements shuffled.
 */
const shuffleArray = <T extends any>(array: T[]): T[] => {
  const shuffled = [...array]; // Create a copy to avoid modifying the original array
  // Iterate from the last element downwards
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements at indices i and j
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Educational Reels Screen Component.
 * Displays financial tips in a vertical scrolling "reel" format, similar to social media apps.
 * Allows users to save favorite tips, refresh for new content, and view saved tips.
 * Implements pagination for efficient loading of a potentially large number of tips.
 */
const EducationalReels: React.FC = () => {
  // --- State Variables ---
  const [allTips, setAllTips] = useState<FinancialTip[]>([]); // Holds all tips (shuffled, with favorite status)
  const [visibleTips, setVisibleTips] = useState<FinancialTip[]>([]); // Subset of tips currently rendered in the FlatList for pagination
  const [currentIndex, setCurrentIndex] = useState(0); // Index of the currently visible tip in the FlatList
  const [showSavedTips, setShowSavedTips] = useState(false); // Controls visibility of the saved tips modal
  const [selectedCategory, setSelectedCategory] = useState<string>('All'); // Currently selected category filter (not implemented in UI yet)
  const [headerShadowVisible, setHeaderShadowVisible] = useState(false); // Controls shadow visibility for the saved tips modal header
  const [refreshing, setRefreshing] = useState(false); // Indicates if a pull-to-refresh action is in progress
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Indicates if more tips are being loaded at the bottom
  const [isRefreshLocked, setIsRefreshLocked] = useState(false); // Prevents rapid consecutive refresh actions

  // --- Refs ---
  const flatListRef = useRef<FlatList>(null); // Ref to the main FlatList for scrolling control
  const favoriteAnimation = useRef(new Animated.Value(1)).current; // Animation value for the heart icon bounce effect
  const savedTipsScrollY = useRef<number>(0); // Stores the scroll position of the saved tips list

  // --- Effects ---

  // Initial data load and setup when the component mounts
  useEffect(() => {
    initializeData();
  }, []);

  // --- Data Handling Functions ---

  /**
   * Initializes the component's data.
   * Shuffles the imported tips, loads saved favorite statuses from AsyncStorage,
   * and sets up the initial visible batch of tips for pagination.
   */
  const initializeData = async () => {
    // Shuffle the raw data from the JSON file
    const shuffledData = shuffleArray(FINANCIAL_TIPS_DATA);

    try {
      // Attempt to load saved favorite tip IDs from AsyncStorage
      const favoritesJson = await AsyncStorage.getItem('@bankable_favorites');
      let tipsWithFavorites: FinancialTip[];

      if (favoritesJson) {
        // If favorites exist, parse the IDs
        const favoritesIds = JSON.parse(favoritesJson);
        // Map through the shuffled data and apply the isFavorite status based on saved IDs
        tipsWithFavorites = shuffledData.map(tip => ({
          ...tip,
          isFavorite: favoritesIds.includes(tip.id)
        }));
      } else {
        // If no favorites saved, use the shuffled data as is (all isFavorite: false initially)
        tipsWithFavorites = shuffledData.map(tip => ({ ...tip, isFavorite: false })); // Ensure isFavorite is present
      }

      // Store the complete, processed list of tips
      setAllTips(tipsWithFavorites);
      // Set the initially visible subset of tips for the FlatList
      setVisibleTips(tipsWithFavorites.slice(0, INITIAL_BATCH_SIZE));

    } catch (error) {
      console.error('Error loading favorites during initialization:', error);
      // Fallback: Use shuffled data without favorites if loading fails
      const fallbackTips = shuffledData.map(tip => ({ ...tip, isFavorite: false }));
      setAllTips(fallbackTips);
      setVisibleTips(fallbackTips.slice(0, INITIAL_BATCH_SIZE));
    }
  };

  /**
   * Handles the pull-to-refresh action.
   * Reshuffles all tips while preserving the favorite status of previously saved tips.
   * Resets the view to the beginning of the list.
   * Includes locking and delays for a better user experience.
   */
  const onRefresh = async () => {
    // Prevent triggering refresh if already refreshing or locked
    if (isRefreshLocked) return;

    try {
      setIsRefreshLocked(true); // Lock refresh to prevent multiple triggers
      setRefreshing(true); // Show the refresh indicator

      // Get the IDs of currently favorited tips before reshuffling
      const favoriteIds = allTips
        .filter(tip => tip.isFavorite)
        .map(tip => tip.id);

      // Reshuffle the original data source and re-apply favorite status
      const shuffledData = shuffleArray(FINANCIAL_TIPS_DATA).map(tip => ({
        ...tip,
        isFavorite: favoriteIds.includes(tip.id)
      }));

      // Simulate network delay or processing time for a smoother feel
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update the state with the newly shuffled data
      setAllTips(shuffledData);
      setVisibleTips(shuffledData.slice(0, INITIAL_BATCH_SIZE)); // Reset visible tips to the initial batch

      // Scroll the FlatList back to the top without animation
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({
          offset: 0,
          animated: false,
        });
        setCurrentIndex(0); // Reset the current index tracker
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      // Ensure refreshing state is turned off
      setRefreshing(false);

      // Keep refresh locked briefly after completion to avoid accidental double pulls
      setTimeout(() => {
        setIsRefreshLocked(false);
      }, 500);
    }
  };

  /**
   * Loads the next batch of tips when the user scrolls near the end of the `visibleTips` list.
   * Appends the new batch to the `visibleTips` state.
   */
  const loadMoreItems = () => {
    // Prevent loading if already loading or if all tips are already visible
    if (isLoadingMore || visibleTips.length >= allTips.length) {
      return;
    }

    try {
      setIsLoadingMore(true); // Show loading indicator at the bottom

      // Simulate loading delay
      setTimeout(() => {
        // Calculate the start and end indices for the next batch in the `allTips` array
        const nextBatchStart = visibleTips.length;
        const nextBatchEnd = Math.min(nextBatchStart + LOAD_MORE_BATCH_SIZE, allTips.length);

        // Get the next batch of tips
        const nextBatch = allTips.slice(nextBatchStart, nextBatchEnd);

        // Append the new batch to the currently visible tips if any new tips were found
        if (nextBatch.length > 0) {
          setVisibleTips(prev => [...prev, ...nextBatch]);
        }

        setIsLoadingMore(false); // Hide loading indicator
      }, 800); // Artificial delay
    } catch (error) {
      console.error('Error loading more items:', error);
      setIsLoadingMore(false); // Ensure loading state is reset on error
    }
  };

  /**
   * Loads favorite tip IDs from AsyncStorage and updates the `isFavorite` status
   * in both `allTips` and `visibleTips` states.
   * Note: This might be redundant if `initializeData` handles it correctly, but can be useful
   * if favorites need to be reloaded separately (e.g., on focus).
   */
  const loadFavorites = async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem('@bankable_favorites');
      if (favoritesJson) {
        const favoritesIds = JSON.parse(favoritesJson);

        // Update the main source of truth (`allTips`)
        setAllTips(prevTips =>
          prevTips.map(tip => ({
            ...tip,
            isFavorite: favoritesIds.includes(tip.id)
          }))
        );

        // Update the currently rendered list (`visibleTips`)
        setVisibleTips(prevTips =>
          prevTips.map(tip => ({
            ...tip,
            isFavorite: favoritesIds.includes(tip.id)
          }))
        );
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  /**
   * Saves the IDs of currently favorited tips to AsyncStorage.
   * @param updatedTips The array of tips (usually `allTips`) reflecting the latest favorite statuses.
   */
  const saveFavorites = async (updatedTips: FinancialTip[]) => {
    try {
      // Extract IDs of tips marked as favorite
      const favoriteIds = updatedTips
        .filter(tip => tip.isFavorite)
        .map(tip => tip.id);

      // Store the array of favorite IDs as a JSON string
      await AsyncStorage.setItem('@bankable_favorites', JSON.stringify(favoriteIds));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  // --- Derived State & Variables ---

  // Get unique category names from the currently visible tips for potential filtering UI
  // Includes 'All' as the default option.
  const categories = ['All', ...Array.from(new Set(visibleTips.map(tip => tip.category)))];

  // Filter the `allTips` array to get only the tips marked as favorite.
  const savedTips = allTips.filter(tip => tip.isFavorite);

  // Filter the `visibleTips` array based on the `selectedCategory` state.
  // Currently, the UI for selecting categories is not implemented, so this defaults to 'All'.
  const filteredTips = selectedCategory === 'All'
    ? visibleTips
    : visibleTips.filter(tip => tip.category === selectedCategory);

  // --- Event Handlers & Actions ---

  /**
   * Toggles the `isFavorite` status for a specific tip by its ID.
   * Updates both `allTips` and `visibleTips` states for consistency.
   * Persists the changes to AsyncStorage.
   * Triggers a small animation on the heart icon.
   * @param id The ID of the tip to toggle.
   */
  const toggleFavorite = (id: string) => {
    // Update the main `allTips` state
    setAllTips(prevTips => {
      const updatedTips = prevTips.map(tip =>
        tip.id === id ? { ...tip, isFavorite: !tip.isFavorite } : tip
      );
      // Save the updated list of favorites to storage
      saveFavorites(updatedTips);
      return updatedTips;
    });

    // Update the `visibleTips` state to reflect the change immediately in the UI
    setVisibleTips(prevTips => {
      return prevTips.map(tip =>
        tip.id === id ? { ...tip, isFavorite: !tip.isFavorite } : tip
      );
    });

    // Trigger the heart bounce animation
    Animated.sequence([
      Animated.timing(favoriteAnimation, {
        toValue: 1.3, // Scale up
        duration: 200,
        useNativeDriver: true, // Use native driver for performance
      }),
      Animated.timing(favoriteAnimation, {
        toValue: 1, // Scale back down
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Placeholder function for sharing a tip.
   * In a real app, this would integrate with the native sharing capabilities.
   * @param tip The `FinancialTip` object to share.
   */
  const shareTip = (tip: FinancialTip) => {
    // TODO: Implement native sharing functionality (e.g., using Share API)
    console.log(`Sharing tip: ${tip.title}`);
    // Example using Share API (needs import from 'react-native'):
    // Share.share({ message: `${tip.title}\n\n${tip.content}` });
  };

  /**
   * Callback function for the FlatList's `onViewableItemsChanged` prop.
   * Updates the `currentIndex` state based on the currently visible item.
   */
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    // Check if there are any viewable items
    if (viewableItems.length > 0) {
      // Update the current index based on the first viewable item
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  /**
   * Configuration for the FlatList's viewability tracking.
   * Defines that an item is considered "viewable" when at least 50% of it is visible.
   */
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  /**
   * Effect to scroll the FlatList to the top when the `selectedCategory` changes.
   * Ensures the user sees the beginning of the filtered list.
   */
  useEffect(() => {
    // Check if the FlatList ref exists and if there are tips to display for the category
    if (flatListRef.current && filteredTips.length > 0) {
      // Scroll to the first item (index 0) without animation
      flatListRef.current.scrollToIndex({
        index: 0,
        animated: false,
      });
      setCurrentIndex(0); // Reset the current index tracker
    }
  }, [selectedCategory]); // Dependency: run only when selectedCategory changes

  /**
   * Handles the scroll event for the saved tips list within the modal.
   * Updates the `headerShadowVisible` state to show/hide a shadow under the modal header.
   * @param event The scroll event object.
   */
  const handleSavedTipsScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    savedTipsScrollY.current = scrollY; // Store current scroll position

    // Show shadow if scrolled down slightly, hide if scrolled back to top
    if (scrollY > 2 && !headerShadowVisible) {
      setHeaderShadowVisible(true);
    } else if (scrollY <= 2 && headerShadowVisible) {
      setHeaderShadowVisible(false);
    }
  };

  // --- Render Functions ---

  /**
   * Renders a single financial tip item within the main FlatList (reel view).
   * @param item The `FinancialTip` object for the current item.
   * @param index The index of the current item.
   */
  const renderItem = ({ item, index }: { item: FinancialTip; index: number }) => {
    return (
      // Container for the reel item, sized to fit the screen
      <View style={styles.tipContainer}>
        {/* Card containing the tip content and actions */}
        <View style={styles.tipCard}>
          {/* Category tag */}
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>

          {/* Tip title */}
          <Text style={styles.tipTitle}>{item.title}</Text>
          {/* Tip content */}
          <Text style={styles.tipContent}>{item.content}</Text>

          {/* Action buttons (Save/Share) */}
          <View style={styles.actions}>
            {/* Save/Favorite Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleFavorite(item.id)}
              accessibilityLabel={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
              accessibilityRole="button"
            >
              {/* Animated heart icon */}
              <Animated.View style={{ transform: [{ scale: item.isFavorite ? favoriteAnimation : 1 }] }}>
                <Ionicons
                  name={item.isFavorite ? 'heart' : 'heart-outline'} // Filled or outline heart
                  size={24}
                  color="#015f45" // Bankable green
                />
              </Animated.View>
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => shareTip(item)}
              accessibilityLabel="Share this tip"
              accessibilityRole="button"
            >
              <Ionicons name="share-social-outline" size={24} color="#015f45" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Renders a single saved tip item within the saved tips modal's FlatList.
   * @param item The `FinancialTip` object for the current saved item.
   */
  const renderSavedTip = ({ item }: { item: FinancialTip }) => {
    return (
      // Container for the saved tip row
      <View style={styles.savedTipItem}>
        {/* Content area (category, title, description) */}
        <View style={styles.savedTipContent}>
          <View style={styles.smallCategoryTag}>
            <Text style={styles.smallCategoryText}>{item.category}</Text>
          </View>
          <Text style={styles.savedTipTitle}>{item.title}</Text>
          <Text style={styles.savedTipDescription} numberOfLines={2}>{item.content}</Text>
        </View>
        {/* Action button (remove from favorites) */}
        <TouchableOpacity
          onPress={() => toggleFavorite(item.id)} // Reuses toggleFavorite to remove
          style={styles.savedTipAction}
          accessibilityLabel="Remove from favorites"
          accessibilityRole="button"
        >
          <Ionicons name="heart" size={24} color="#015f45" /> {/* Always filled heart */}
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Renders the footer component for the main FlatList.
   * Displays an ActivityIndicator while loading more items.
   */
  const renderFooter = () => {
    // Don't render anything if not currently loading more
    if (!isLoadingMore) return null;

    // Show loading indicator and text
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="large" color="#015f45" />
        <Text style={styles.loadingMoreText}>Loading more wisdom...</Text>
      </View>
    );
  };

  // --- Main Component Return ---
  return (
    // Use SafeAreaView to avoid notches and system UI elements
    <SafeAreaView style={styles.container}>
      {/* Configure the status bar */}
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header Section */}
      <View style={styles.headerContainer}>
        {/* Main header row with title and saved button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Financial Reels</Text>
          <TouchableOpacity
            style={styles.savedButton}
            onPress={() => setShowSavedTips(true)} // Open the saved tips modal
            accessibilityLabel="View saved tips"
            accessibilityRole="button"
          >
            <Ionicons name="bookmark-outline" size={20} color="#fff" />
            <Text style={styles.savedText}>Saved</Text>
          </TouchableOpacity>
        </View>

        {/* Subtitle below the main header */}
        <Text style={styles.headerSubtitle}>Swipe to learn financial wisdom</Text>
      </View>

      {/* Main Content Area - Reels FlatList */}
      <View style={styles.reelsContainer}>
        <FlatList
          ref={flatListRef} // Assign ref for programmatic control
          data={filteredTips} // Use the filtered list of tips (currently shows all visible)
          renderItem={renderItem} // Function to render each tip
          keyExtractor={(item) => item.id} // Unique key for each item
          showsVerticalScrollIndicator={false} // Hide vertical scrollbar
          snapToInterval={height * 0.65} // Height of each reel item for snapping
          snapToAlignment="start" // Snap to the start of the item
          decelerationRate="fast" // Faster deceleration for snap effect
          viewabilityConfig={viewabilityConfig} // Configuration for viewability tracking
          onViewableItemsChanged={onViewableItemsChanged} // Callback when viewable items change
          pagingEnabled // Enable snapping page by page (iOS style)
          contentContainerStyle={styles.flatListContent} // Style for the content container
          // Pull-to-refresh configuration
          refreshControl={
            <RefreshControl
              refreshing={refreshing} // Current refreshing state
              onRefresh={onRefresh} // Callback when pulled
              colors={['#015f45']} // Spinner color (Android)
              tintColor="#015f45" // Spinner color (iOS)
              title="Pull to refresh" // Text shown during pull (iOS)
              titleColor="#015f45" // Color of the title text (iOS)
              progressViewOffset={10} // Offset for the spinner
            />
          }
          onEndReached={loadMoreItems} // Callback when end of list is reached
          onEndReachedThreshold={0.2} // How close to the end to trigger onEndReached (0.2 = 20% from end)
          ListFooterComponent={renderFooter} // Component to render at the bottom (loading indicator)
          // Performance optimizations
          removeClippedSubviews={true} // Unmount views that are off-screen
          maxToRenderPerBatch={5} // Render items in smaller batches
          updateCellsBatchingPeriod={100} // Delay between batch renders
          windowSize={7} // Render items within a certain window around the visible area
          initialNumToRender={INITIAL_BATCH_SIZE} // Render initial batch size quickly
          // Component to render if the list is empty
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No tips found for this category</Text>
            </View>
          }
        />
      </View>

      {/* Saved Tips Modal */}
      <Modal
        visible={showSavedTips} // Controlled by state
        animationType="slide" // Slide up animation
        transparent={true} // Allows overlay background
        onRequestClose={() => setShowSavedTips(false)} // Handle hardware back button (Android)
      >
        {/* Semi-transparent overlay */}
        <View style={styles.modalOverlay}>
          {/* Container for the modal content */}
          <View style={styles.savedTipsContainer}>
            {/* Modal Header with conditional shadow */}
            <View style={[
              styles.savedTipsHeader,
              headerShadowVisible && styles.savedTipsHeaderWithShadow // Apply shadow if scrolled
            ]}>
              <Text style={styles.savedTipsTitle}>Saved Tips</Text>
              <TouchableOpacity
                onPress={() => setShowSavedTips(false)} // Close button action
                style={styles.closeButton}
                accessibilityLabel="Close saved tips"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color="#015f45" />
              </TouchableOpacity>
            </View>

            {/* Content area of the modal (list or empty state) */}
            <View style={styles.savedTipsContent}>
              {savedTips.length > 0 ? (
                // If there are saved tips, show the list
                <FlatList
                  data={savedTips} // Use the derived savedTips array
                  renderItem={renderSavedTip} // Function to render each saved tip
                  keyExtractor={(item) => item.id} // Unique key
                  contentContainerStyle={styles.savedTipsList} // Padding for the list
                  showsVerticalScrollIndicator={false} // Hide scrollbar
                  onScroll={handleSavedTipsScroll} // Track scroll for header shadow
                  scrollEventThrottle={16} // Optimize scroll event frequency
                />
              ) : (
                // If no saved tips, show an empty state message
                <View style={styles.noSavedTips}>
                  <Ionicons name="bookmark-outline" size={60} color="#ccc" />
                  <Text style={styles.noSavedTipsText}>No saved tips yet</Text>
                  <Text style={styles.noSavedTipsSubtext}>Save tips by tapping the heart icon</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background
  },
  // Header container with potential shadow
  headerContainer: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 4, // Android shadow
    zIndex: 1, // Ensure header is above content for shadow visibility
  },
  // Main header row (Title + Saved Button)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff', // Ensure background is white
  },
  // Header title text
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333', // Dark text
  },
  // Subtitle text below the header
  headerSubtitle: {
    fontSize: 16,
    color: '#666', // Gray text
    paddingHorizontal: 20,
    marginBottom: 15, // Space below subtitle
    marginTop: 4, // Space above subtitle
  },
  // "Saved" button in the header
  savedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#015f45', // Bankable green background
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20, // Pill shape
  },
  // Text inside the "Saved" button
  savedText: {
    color: 'white', // White text
    marginLeft: 6, // Space between icon and text
    fontWeight: '500',
  },
  // Container for the main reels FlatList
  reelsContainer: {
    flex: 1, // Take remaining vertical space
    backgroundColor: '#fff', // Ensure background is white
  },
  // Content container style for the main FlatList
  flatListContent: {
    paddingBottom: 20, // Add padding at the bottom of the list
  },
  // Container for a single reel item (card)
  tipContainer: {
    width, // Full screen width
    height: height * 0.65, // Fixed height for each reel item
    justifyContent: 'center', // Center card vertically
    alignItems: 'center', // Center card horizontally
    paddingHorizontal: 20, // Horizontal padding for the card
  },
  // The card itself containing tip content
  tipCard: {
    width: '100%', // Full width within padding
    height: '90%', // Slightly smaller than the container height
    borderRadius: 20, // Rounded corners
    padding: 20, // Inner padding
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    backgroundColor: '#f3fee8', // Light mint green background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  // Category tag style
  categoryTag: {
    backgroundColor: '#015f45', // Bankable green
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50, // Fully rounded ends
    marginBottom: 30, // Space below tag
  },
  // Text inside the category tag
  categoryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  // Tip title text style
  tipTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333', // Dark text
    marginBottom: 20, // Space below title
    textAlign: 'center', // Center align title
  },
  // Tip content text style
  tipContent: {
    fontSize: 18,
    color: '#555', // Medium gray text
    lineHeight: 26, // Spacing between lines
    textAlign: 'center', // Center align content
    marginBottom: 30, // Space below content
  },
  // Container for action buttons (Save, Share)
  actions: {
    flexDirection: 'row',
    justifyContent: 'center', // Center buttons horizontally
    width: '100%', // Take full width
    marginTop: 20, // Space above buttons
  },
  // Individual action button style
  actionButton: {
    alignItems: 'center', // Center icon and text vertically
    marginHorizontal: 20, // Space between buttons
  },
  // Text below action button icons
  actionText: {
    color: '#015f45', // Bankable green
    marginTop: 6, // Space between icon and text
    fontSize: 14,
  },
  // Container shown when FlatList is empty
  emptyContainer: {
    flex: 1,
    height: height * 0.5, // Take up significant space
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Text shown when FlatList is empty
  emptyText: {
    fontSize: 18,
    color: '#666', // Gray text
    marginTop: 16, // Space below icon
    textAlign: 'center',
  },
  // Semi-transparent overlay for the modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark semi-transparent background
    justifyContent: 'center', // Center modal vertically
    alignItems: 'center', // Center modal horizontally
  },
  // Main container for the saved tips modal content
  savedTipsContainer: {
    width: '90%', // 90% of screen width
    height: '70%', // 70% of screen height
    backgroundColor: '#fff', // White background
    borderRadius: 20, // Rounded corners
    overflow: 'hidden', // Clip content to rounded corners
  },
  // Header section of the saved tips modal
  savedTipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff', // White background
    zIndex: 1, // Ensure header is above list content for shadow
  },
  // Style applied to modal header when scrolled
  savedTipsHeaderWithShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 4, // Android shadow
  },
  // Close button in the modal header
  closeButton: {
    padding: 4, // Increase touchable area
  },
  // Title text in the modal header
  savedTipsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333', // Dark text
  },
  // Container for the list of saved tips in the modal
  savedTipsContent: {
    flex: 1, // Take remaining space in the modal
    backgroundColor: '#fff', // Ensure white background
  },
  // Content container style for the saved tips FlatList
  savedTipsList: {
    padding: 16, // Padding around the list items
  },
  // Style for a single item in the saved tips list
  savedTipItem: {
    backgroundColor: '#f3fee8', // Light mint green background
    borderRadius: 12, // Rounded corners
    padding: 16, // Inner padding
    marginBottom: 12, // Space between items
    flexDirection: 'row', // Arrange content and action button horizontally
    justifyContent: 'space-between', // Push content and button apart
    alignItems: 'flex-start', // Align items to the top
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // Android shadow
  },
  // Container for the text content of a saved tip item
  savedTipContent: {
    flex: 1, // Allow content to take available space
    marginRight: 12, // Space before the action button
  },
  // Smaller category tag used in the saved tips list
  smallCategoryTag: {
    backgroundColor: '#015f45', // Bankable green
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12, // Rounded corners
    marginBottom: 8, // Space below tag
    alignSelf: 'flex-start', // Prevent tag from stretching
  },
  // Text inside the small category tag
  smallCategoryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  // Title text style for saved tips
  savedTipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333', // Dark text
    marginBottom: 4, // Space below title
  },
  // Description text style for saved tips
  savedTipDescription: {
    fontSize: 14,
    color: '#555', // Medium gray text
  },
  // Action button (remove favorite) style in saved tips list
  savedTipAction: {
    padding: 4, // Increase touchable area
  },
  // Container shown in the modal when there are no saved tips
  noSavedTips: {
    flex: 1, // Take full space within the content area
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    padding: 20,
  },
  // Main text for the "no saved tips" message
  noSavedTipsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333', // Dark text
    marginTop: 16, // Space below icon
  },
  // Subtext for the "no saved tips" message
  noSavedTipsSubtext: {
    fontSize: 14,
    color: '#666', // Gray text
    marginTop: 8, // Space below main text
    textAlign: 'center',
  },
  // Container for the loading indicator at the bottom of the main list
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100, // Fixed height for the loading area
  },
  // Text shown with the loading indicator
  loadingMoreText: {
    color: '#015f45', // Bankable green
    marginTop: 10, // Space below spinner
    fontSize: 16,
    fontWeight: '500',
  },
  // --- Styles not currently used but kept for potential future category filtering ---
  categoryFilterContainer: {
    backgroundColor: '#fff',
    zIndex: 0, // Ensure it doesn't overlap header shadow incorrectly
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryFilterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0', // Default background for category filter items
  },
  categoryFilterItemActive: {
    backgroundColor: '#015f45', // Active category background
  },
  categoryFilterText: {
    color: '#666',
    fontWeight: '500',
  },
  categoryFilterTextActive: {
    color: '#fff', // Active category text color
  },
});

export default EducationalReels;