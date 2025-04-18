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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import financial tips from JSON file
import FINANCIAL_TIPS_DATA from '../data/reels.json';

// Types
interface FinancialTip {
  id: string;
  title: string;
  content: string;
  category: string;
  isFavorite: boolean;
}

// Get screen dimensions
const { width, height } = Dimensions.get('window');

const EducationalReels: React.FC = () => {
  // State
  const [tips, setTips] = useState<FinancialTip[]>(FINANCIAL_TIPS_DATA);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSavedTips, setShowSavedTips] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [headerShadowVisible, setHeaderShadowVisible] = useState(false);
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const favoriteAnimation = useRef(new Animated.Value(1)).current;
  const savedTipsScrollY = useRef<number>(0);

  // Load saved favorites on component mount
  useEffect(() => {
    loadFavorites();
  }, []);

  // Load favorites from AsyncStorage
  const loadFavorites = async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem('@bankable_favorites');
      if (favoritesJson) {
        const favoritesIds = JSON.parse(favoritesJson);
        
        setTips(prevTips => 
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

  // Save favorites to AsyncStorage
  const saveFavorites = async (updatedTips: FinancialTip[]) => {
    try {
      const favoriteIds = updatedTips
        .filter(tip => tip.isFavorite)
        .map(tip => tip.id);
      
      await AsyncStorage.setItem('@bankable_favorites', JSON.stringify(favoriteIds));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(tips.map(tip => tip.category)))];

  // Derived state
  const savedTips = tips.filter(tip => tip.isFavorite);
  
  // Filter tips by selected category
  const filteredTips = selectedCategory === 'All' 
    ? tips 
    : tips.filter(tip => tip.category === selectedCategory);

  // Toggle favorite status for a tip
  const toggleFavorite = (id: string) => {
    setTips(prevTips => {
      const updatedTips = prevTips.map(tip =>
        tip.id === id ? { ...tip, isFavorite: !tip.isFavorite } : tip
      );
      
      // Save favorites to AsyncStorage
      saveFavorites(updatedTips);
      
      return updatedTips;
    });

    // Animate heart icon
    Animated.sequence([
      Animated.timing(favoriteAnimation, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(favoriteAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Share functionality (placeholder)
  const shareTip = (tip: FinancialTip) => {
    // Implement your sharing logic here
    console.log(`Sharing tip: ${tip.title}`);
  };

  // Render individual tip item
  const renderItem = ({ item, index }: { item: FinancialTip; index: number }) => {
    return (
      <View style={styles.tipContainer}>
        <View style={styles.tipCard}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          
          <Text style={styles.tipTitle}>{item.title}</Text>
          <Text style={styles.tipContent}>{item.content}</Text>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleFavorite(item.id)}
              accessibilityLabel={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
              accessibilityRole="button"
            >
              <Animated.View style={{ transform: [{ scale: item.isFavorite ? favoriteAnimation : 1 }] }}>
                <Ionicons
                  name={item.isFavorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color="#015f45"
                />
              </Animated.View>
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
            
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

  // Render saved tip item
  const renderSavedTip = ({ item }: { item: FinancialTip }) => {
    return (
      <View style={styles.savedTipItem}>
        <View style={styles.savedTipContent}>
          <View style={styles.smallCategoryTag}>
            <Text style={styles.smallCategoryText}>{item.category}</Text>
          </View>
          <Text style={styles.savedTipTitle}>{item.title}</Text>
          <Text style={styles.savedTipDescription} numberOfLines={2}>{item.content}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => toggleFavorite(item.id)}
          style={styles.savedTipAction}
          accessibilityLabel="Remove from favorites"
          accessibilityRole="button"
        >
          <Ionicons name="heart" size={24} color="#015f45" />
        </TouchableOpacity>
      </View>
    );
  };

  // Track viewable items to update current index
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  // Configuration for viewability
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  // Reset to first item when category changes
  useEffect(() => {
    if (flatListRef.current && filteredTips.length > 0) {
      flatListRef.current.scrollToIndex({
        index: 0,
        animated: false,
      });
      setCurrentIndex(0);
    }
  }, [selectedCategory]);

  // Handle scroll for saved tips header shadow
  const handleSavedTipsScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    savedTipsScrollY.current = scrollY;
    
    // Show shadow if scrolled down
    if (scrollY > 2 && !headerShadowVisible) {
      setHeaderShadowVisible(true);
    } else if (scrollY <= 2 && headerShadowVisible) {
      setHeaderShadowVisible(false);
    }
  };

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header with shadow */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Financial Reels</Text>
          <TouchableOpacity 
            style={styles.savedButton}
            onPress={() => setShowSavedTips(true)}
            accessibilityLabel="View saved tips"
            accessibilityRole="button"
          >
            <Ionicons name="bookmark-outline" size={20} color="#fff" />
            <Text style={styles.savedText}>Saved</Text>
          </TouchableOpacity>
        </View>
        
        {/* Subtitle */}
        <Text style={styles.headerSubtitle}>Swipe to learn financial wisdom</Text>
      </View>
      
      {/* Main Content - Financial Tips Reels */}
      <View style={styles.reelsContainer}>
        <FlatList
          ref={flatListRef}
          data={filteredTips}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          snapToInterval={height * 0.65} // Card height
          snapToAlignment="start"
          decelerationRate="fast"
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          pagingEnabled
          contentContainerStyle={styles.flatListContent}
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
        visible={showSavedTips}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSavedTips(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.savedTipsContainer}>
            <View style={[
              styles.savedTipsHeader, 
              headerShadowVisible && styles.savedTipsHeaderWithShadow
            ]}>
              <Text style={styles.savedTipsTitle}>Saved Tips</Text>
              <TouchableOpacity 
                onPress={() => setShowSavedTips(false)}
                style={styles.closeButton}
                accessibilityLabel="Close saved tips"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color="#015f45" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.savedTipsContent}>
              {savedTips.length > 0 ? (
                <FlatList
                  data={savedTips}
                  renderItem={renderSavedTip}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.savedTipsList}
                  showsVerticalScrollIndicator={false}
                  onScroll={handleSavedTipsScroll}
                  scrollEventThrottle={16}
                />
              ) : (
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

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 4, // Android shadow
    zIndex: 1, // Ensure shadow is visible
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryFilterContainer: {
    backgroundColor: '#fff',
    zIndex: 0,
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
    backgroundColor: '#f0f0f0',
  },
  categoryFilterItemActive: {
    backgroundColor: '#015f45',
  },
  categoryFilterText: {
    color: '#666',
    fontWeight: '500',
  },
  categoryFilterTextActive: {
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 15,
    marginTop: 4,
  },
  savedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#015f45',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  savedText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '500',
  },
  reelsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flatListContent: {
    paddingBottom: 20,
  },
  tipContainer: {
    width,
    height: height * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tipCard: {
    width: '100%',
    height: '90%',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3fee8', // Light mint green background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTag: {
    backgroundColor: '#015f45',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    marginBottom: 30,
  },
  categoryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  tipTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  tipContent: {
    fontSize: 18,
    color: '#555',
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 30,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },
  actionButton: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  actionText: {
    color: '#015f45',
    marginTop: 6,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    height: height * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedTipsContainer: {
    width: '90%',
    height: '70%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  savedTipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  savedTipsHeaderWithShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 4, // Android shadow
  },
  closeButton: {
    padding: 4,
  },
  savedTipsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  savedTipsContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  savedTipsList: {
    padding: 16,
  },
  savedTipItem: {
    backgroundColor: '#f3fee8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  savedTipContent: {
    flex: 1,
    marginRight: 12,
  },
  smallCategoryTag: {
    backgroundColor: '#015f45',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  smallCategoryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  savedTipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  savedTipDescription: {
    fontSize: 14,
    color: '#555',
  },
  savedTipAction: {
    padding: 4,
  },
  noSavedTips: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noSavedTipsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  noSavedTipsSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default EducationalReels;