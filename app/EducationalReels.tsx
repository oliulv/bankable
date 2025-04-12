import React, { useState, useRef } from 'react';
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
    content: 'Start investing early. $1,000 invested at 8% annual return becomes $10,063 in 30 years.',
    category: 'Investing',
    isFavorite: false,
  },
  {
    id: '5',
    title: 'Credit Score Hack',
    content: 'Keep credit card utilization under 30% of your total limit to boost your credit score.',
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

const { width, height } = Dimensions.get('window');

const FinancialTipsReels: React.FC = () => {
  const [tips, setTips] = useState<FinancialTip[]>(FINANCIAL_TIPS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSavedTips, setShowSavedTips] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const favoriteAnimation = useRef(new Animated.Value(1)).current;

  const savedTips = tips.filter(tip => tip.isFavorite);

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

  const renderItem = ({ item, index }: { item: FinancialTip; index: number }) => {
    return (
      <View style={styles.tipContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          
          <Text style={styles.tipTitle}>{item.title}</Text>
          <Text style={styles.tipContent}>{item.content}</Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Animated.View style={{ transform: [{ scale: item.isFavorite ? favoriteAnimation : 1 }] }}>
              <Ionicons
                name={item.isFavorite ? 'heart' : 'heart-outline'}
                size={28}
                color="white"
              />
            </Animated.View>
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={28} color="white" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSavedTip = ({ item }: { item: FinancialTip }) => (
    <View style={styles.savedTipItem}>
      <View>
        <View style={styles.smallCategoryTag}>
          <Text style={styles.smallCategoryText}>{item.category}</Text>
        </View>
        <Text style={styles.savedTipTitle}>{item.title}</Text>
        <Text style={styles.savedTipContent} numberOfLines={2}>{item.content}</Text>
      </View>
      <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
        <Ionicons name="heart" size={24} color="#015f45" />
      </TouchableOpacity>
    </View>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  return (
    <View style={styles.container}>
      {/* Financial Tips Title and Saved Button */}
      <View style={styles.titleContainer}>
        <Text style={styles.reelsTitle}>Financial Tips</Text>
        <TouchableOpacity 
          style={styles.savedButton}
          onPress={() => setShowSavedTips(true)}
        >
          <Ionicons name="bookmark" size={20} color="#fff" />
          <Text style={styles.savedText}>Saved</Text>
        </TouchableOpacity>
      </View>
      
      {/* Main Content - Financial Tips Reels */}
      <FlatList
        ref={flatListRef}
        data={tips}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        snapToInterval={height - 200} // Adjusted for your screen size
        snapToAlignment="start"
        decelerationRate="fast"
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        pagingEnabled
      />
      
      {/* Saved Tips Modal */}
      <Modal
        visible={showSavedTips}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowSavedTips(false)}
      >
        <SafeAreaView style={styles.savedTipsContainer}>
          <View style={styles.savedTipsHeader}>
            <TouchableOpacity onPress={() => setShowSavedTips(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.savedTipsTitle}>Saved Tips</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.savedTipsContent}>
            {savedTips.length > 0 ? (
              <FlatList
                data={savedTips}
                renderItem={renderSavedTip}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.savedTipsList}
              />
            ) : (
              <View style={styles.noSavedTips}>
                <Ionicons name="bookmark-outline" size={60} color="#777" />
                <Text style={styles.noSavedTipsText}>No saved tips yet</Text>
                <Text style={styles.noSavedTipsSubtext}>Save tips by tapping the heart icon</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reelsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  savedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  savedText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '500',
  },
  tipContainer: {
    width,
    height: height - 200, // Adjusted for spacing in your app
    position: 'relative',
    backgroundColor: '#121212',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    // Shifted content upward to have more space from bottom buttons
    paddingTop: 0,
    paddingBottom: 140, // Increased bottom padding for more space from buttons
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 50,
    marginBottom: 70, // More space before title
    marginTop: -60, // Move tag up higher on screen
  },
  categoryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  tipTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  tipContent: {
    fontSize: 18,
    color: 'white',
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: 20,
    maxWidth: '90%', // Limit content width for better readability
  },
  actions: {
    position: 'absolute',
    right: 20,
    bottom: 90, // Slightly higher from bottom
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionText: {
    color: 'white',
    marginTop: 6,
  },
  savedTipsContainer: {
    flex: 1,
    backgroundColor: '#015f45',
  },
  savedTipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  savedTipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  savedTipsContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 1,
  },
  savedTipsList: {
    padding: 16,
  },
  savedTipItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  smallCategoryTag: {
    backgroundColor: '#2196F3',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  savedTipContent: {
    fontSize: 14,
    color: '#555',
    width: '90%',
  },
  noSavedTips: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noSavedTipsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#444',
    marginTop: 16,
  },
  noSavedTipsSubtext: {
    fontSize: 16,
    color: '#777',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default FinancialTipsReels;