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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Types
interface FinancialTip {
  id: string;
  title: string;
  content: string;
  category: string;
  isFavorite: boolean;
}

// Sample data
const FINANCIAL_TIPS: FinancialTip[] = [
  {
    id: '1',
    title: 'Emergency Fund',
    content: 'Save 3-6 months of expenses in an easily accessible account for emergencies.',
    category: 'Saving',
    isFavorite: false,
  },
  {
    id: '2',
    title: 'Debt Snowball',
    content: 'Pay minimum on all debts, but put extra money on smallest debt first for quick wins.',
    category: 'Debt',
    isFavorite: false,
  },
  {
    id: '3',
    title: '50/30/20 Rule',
    content: 'Allocate 50% of income to needs, 30% to wants, and 20% to savings and debt repayment.',
    category: 'Budgeting',
    isFavorite: false,
  },
  {
    id: '4',
    title: 'Compound Interest',
    content: 'Start investing early. £1,000 invested at 8% annual return becomes £10,063 in 30 years.',
    category: 'Investing',
    isFavorite: false,
  },
  {
    id: '5',
    title: 'Credit Score Hack',
    content: 'Keep credit card utilisation under 30% of your total limit to boost your credit score.',
    category: 'Credit',
    isFavorite: false,
  },
  {
    id: '6',
    title: 'Automation',
    content: 'Set up automatic transfers to savings on payday so you never see the money in checking.',
    category: 'Saving',
    isFavorite: false,
  },
  {
    id: '7',
    title: 'Pay Yourself First',
    content: 'Allocate money to savings before spending on discretionary items.',
    category: 'Saving',
    isFavorite: false,
  },
  {
    id: '8',
    title: '401(k) Match',
    content: 'Always contribute enough to get full employer match - it\'s free money!',
    category: 'Investing',
    isFavorite: false,
  },
];

// Get screen dimensions
const { width, height } = Dimensions.get('window');

const EducationalReels: React.FC = () => {
  // State
  const [tips, setTips] = useState<FinancialTip[]>(FINANCIAL_TIPS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSavedTips, setShowSavedTips] = useState(false);
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const favoriteAnimation = useRef(new Animated.Value(1)).current;

  // Derived state
  const savedTips = tips.filter(tip => tip.isFavorite);

  // Toggle favorite status for a tip
  const toggleFavorite = (id: string) => {
    setTips(prevTips =>
      prevTips.map(tip =>
        tip.id === id ? { ...tip, isFavorite: !tip.isFavorite } : tip
      )
    );

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

  // Render pagination dots
  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {tips.map((_, index) => (
          <TouchableOpacity 
            key={index} 
            style={[
              styles.paginationDot,
              currentIndex === index && styles.paginationDotActive
            ]}
            onPress={() => {
              flatListRef.current?.scrollToIndex({
                index,
                animated: true,
              });
            }}
            accessibilityLabel={`Go to tip ${index + 1} of ${tips.length}`}
            accessibilityRole="button"
          />
        ))}
      </View>
    );
  };

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Educational Reels</Text>
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
      
      {/* Main Content - Financial Tips Reels */}
      <View style={styles.reelsContainer}>
        <FlatList
          ref={flatListRef}
          data={tips}
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
        />
        
        {/* Pagination Dots */}
        {renderPaginationDots()}
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
            <View style={styles.savedTipsHeader}>
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
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 15,
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
    // Gradient-like background using a linear gradient from dark green to light green
    // In React Native, you'd use a LinearGradient component, but for simplicity:
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
  paginationContainer: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -50 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginVertical: 4,
  },
  paginationDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#015f45',
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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