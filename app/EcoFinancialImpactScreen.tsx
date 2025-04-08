import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

type Transaction = {
  id: string;
  merchant: string;
  amount: number;
  date: Date;
  category: string;
  carbonImpact: number;
  icon: string;
};

type EcoChallenge = {
  id: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  icon: string;
};

type EcoAction = {
  id: string;
  title: string;
  description: string;
  impact: string;
  icon: string;
};

const EcoFinancialImpactScreen: React.FC = () => {
  const [totalCarbonSaved, setTotalCarbonSaved] = useState<number>(247.8);
  const [monthlyImpact, setMonthlyImpact] = useState<number[]>([12, 19, 25, 32, 45, 52, 63]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('impact');
  const [impactDetails, setImpactDetails] = useState<{ trees: number; water: number; energy: number }>({
    trees: 5.2,
    water: 1280,
    energy: 95.4,
  });
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');

  const recentTransactions: Transaction[] = [
    {
      id: '1',
      merchant: "Local Farmer's Market", // Use double quotes when string contains apostrophe
      amount: 32.50,
      date: new Date('2025-04-05'),
      category: 'Groceries',
      carbonImpact: -2.4,
      icon: 'leaf',
    },
    {
      id: '2',
      merchant: 'EcoShare Ride',
      amount: 15.75,
      date: new Date('2025-04-04'),
      category: 'Transportation',
      carbonImpact: -1.8,
      icon: 'car-electric',
    },
    {
      id: '3',
      merchant: 'Green Energy Co-op',
      amount: 85.00,
      date: new Date('2025-04-03'),
      category: 'Utilities',
      carbonImpact: -12.5,
      icon: 'solar-power',
    },
  ];

  const ecoChallenges: EcoChallenge[] = [
    {
      id: '1',
      title: 'Zero Waste Month',
      description: 'Avoid single-use plastic purchases for 30 days',
      reward: '500 eco-points',
      progress: 0.65,
      icon: 'recycle',
    },
    {
      id: '2',
      title: 'Public Transport Hero',
      description: 'Use public transportation instead of car 10 times',
      reward: '300 eco-points',
      progress: 0.8,
      icon: 'bus',
    },
    {
      id: '3',
      title: 'Sustainable Shopping',
      description: 'Make 5 purchases from certified eco-friendly stores',
      reward: '400 eco-points',
      progress: 0.4,
      icon: 'shopping-bag',
    },
  ];

  const ecoActions: EcoAction[] = [
    {
      id: '1',
      title: 'Switch to paperless statements',
      description: 'Save paper and reduce your carbon footprint',
      impact: 'Saves 2.4kg CO2 per year',
      icon: 'file-document-outline',
    },
    {
      id: '2',
      title: 'Invest in our Renewable Energy Fund',
      description: 'Support clean energy projects with as little as $50',
      impact: 'Avg. 6.2% return while reducing CO2 emissions',
      icon: 'cash-multiple',
    },
    {
      id: '3',
      title: 'Round-up transactions for reforestation',
      description: 'Round up purchases to donate to tree planting initiatives',
      impact: 'Plant a tree with just $2 of round-ups',
      icon: 'tree',
    },
  ];

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(72, 166, 101, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    decimalPlaces: 0,
  };

  const impactData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        data: monthlyImpact,
        color: (opacity = 1) => `rgba(72, 166, 101, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const spendingCategoryData = [
    {
      name: 'Green',
      impact: 65,
      color: '#48A665',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Neutral',
      impact: 25,
      color: '#FFB347',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'High-Impact',
      impact: 10,
      color: '#FF6B6B',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#48A665" />
          <Text style={styles.loadingText}>Calculating your eco impact...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <LinearGradient colors={['#48A665', '#3E8C55']} style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Eco Financial Impact</Text>
              <View style={styles.carbonSavedContainer}>
                <Text style={styles.carbonSavedLabel}>Carbon Footprint Reduced</Text>
                <View style={styles.carbonSavedValue}>
                  <Text style={styles.carbonValue}>{totalCarbonSaved}</Text>
                  <Text style={styles.carbonUnit}>kg CO₂</Text>
                </View>
                <View style={styles.periodSelector}>
                  <TouchableOpacity
                    style={[styles.periodButton, selectedPeriod === 'week' && styles.activePeriod]}
                    onPress={() => setSelectedPeriod('week')}
                  >
                    <Text style={[styles.periodText, selectedPeriod === 'week' && styles.activePeriodText]}>Week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.periodButton, selectedPeriod === 'month' && styles.activePeriod]}
                    onPress={() => setSelectedPeriod('month')}
                  >
                    <Text style={[styles.periodText, selectedPeriod === 'month' && styles.activePeriodText]}>Month</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.periodButton, selectedPeriod === 'year' && styles.activePeriod]}
                    onPress={() => setSelectedPeriod('year')}
                  >
                    <Text style={[styles.periodText, selectedPeriod === 'year' && styles.activePeriodText]}>Year</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Impact Metrics */}
          <View style={styles.impactMetricsContainer}>
            <View style={styles.metricCard}>
              <MaterialCommunityIcons name="tree" size={24} color="#48A665" />
              <Text style={styles.metricValue}>{impactDetails.trees}</Text>
              <Text style={styles.metricLabel}>Trees Saved</Text>
            </View>
            <View style={styles.metricCard}>
              <MaterialCommunityIcons name="water" size={24} color="#3498DB" />
              <Text style={styles.metricValue}>{impactDetails.water}</Text>
              <Text style={styles.metricLabel}>Liters Water</Text>
            </View>
            <View style={styles.metricCard}>
              <MaterialCommunityIcons name="lightning-bolt" size={24} color="#F39C12" />
              <Text style={styles.metricValue}>{impactDetails.energy}</Text>
              <Text style={styles.metricLabel}>kWh Saved</Text>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'impact' && styles.activeTab]}
              onPress={() => setActiveTab('impact')}
            >
              <Text style={[styles.tabText, activeTab === 'impact' && styles.activeTabText]}>Impact</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'actions' && styles.activeTab]}
              onPress={() => setActiveTab('actions')}
            >
              <Text style={[styles.tabText, activeTab === 'actions' && styles.activeTabText]}>Actions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'challenges' && styles.activeTab]}
              onPress={() => setActiveTab('challenges')}
            >
              <Text style={[styles.tabText, activeTab === 'challenges' && styles.activeTabText]}>Challenges</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'impact' && (
            <View style={styles.tabContent}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Carbon Impact Over Time</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>Details</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chartContainer}>
                <LineChart
                  data={impactData}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Spending by Impact Category</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>Details</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chartContainer}>
                <PieChart
                  data={spendingCategoryData}
                  width={screenWidth - 40}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="impact"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Eco-friendly Transactions</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              {recentTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionIconContainer}>
                    <MaterialCommunityIcons name={transaction.icon as any} size={24} color="#48A665" />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionMerchant}>{transaction.merchant}</Text>
                    <Text style={styles.transactionCategory}>{transaction.category} • {transaction.date.toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.transactionAmounts}>
                    <Text style={styles.transactionAmount}>${transaction.amount.toFixed(2)}</Text>
                    <Text style={styles.carbonAmount}>{transaction.carbonImpact}kg CO₂</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'actions' && (
            <View style={styles.tabContent}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recommended Eco Actions</Text>
              </View>
              {ecoActions.map((action) => (
                <TouchableOpacity key={action.id} style={styles.actionCard}>
                  <View style={styles.actionIconContainer}>
                    <MaterialCommunityIcons name={action.icon as any} size={28} color="#48A665" />
                  </View>
                  <View style={styles.actionDetails}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionDescription}>{action.description}</Text>
                    <Text style={styles.actionImpact}>{action.impact}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#BBB" />
                </TouchableOpacity>
              ))}

              <View style={styles.customBannerContainer}>
                <LinearGradient colors={['#48A665', '#3E8C55']} style={styles.customBanner}>
                  <View style={styles.bannerContent}>
                    <MaterialCommunityIcons name="leaf" size={36} color="#FFF" />
                    <View style={styles.bannerTextContainer}>
                      <Text style={styles.bannerTitle}>Carbon Offset Subscription</Text>
                      <Text style={styles.bannerDescription}>
                        Offset your carbon footprint by just $5/month
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.bannerButton}>
                    <Text style={styles.bannerButtonText}>Learn More</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          )}

          {activeTab === 'challenges' && (
            <View style={styles.tabContent}>
              <View style={styles.challengeHeader}>
                <View>
                  <Text style={styles.sectionTitle}>My Eco Challenges</Text>
                  <Text style={styles.challengeSubtitle}>Complete challenges to earn rewards</Text>
                </View>
                <View style={styles.ecoPointsContainer}>
                  <MaterialCommunityIcons name="leaf" size={18} color="#48A665" />
                  <Text style={styles.ecoPoints}>1,250 points</Text>
                </View>
              </View>

              {ecoChallenges.map((challenge) => (
                <View key={challenge.id} style={styles.challengeCard}>
                  <View style={styles.challengeHeader}>
                    <View style={styles.challengeIconContainer}>
                      <MaterialCommunityIcons name={challenge.icon as any} size={24} color="#FFF" />
                    </View>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  </View>
                  <Text style={styles.challengeDescription}>{challenge.description}</Text>
                  <View style={styles.challengeProgressContainer}>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${challenge.progress * 100}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{Math.round(challenge.progress * 100)}%</Text>
                  </View>
                  <View style={styles.challengeFooter}>
                    <Text style={styles.challengeReward}>
                      <MaterialCommunityIcons name="leaf" size={14} color="#48A665" /> {challenge.reward}
                    </Text>
                    <TouchableOpacity style={styles.challengeButton}>
                      <Text style={styles.challengeButtonText}>Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.findMoreButton}>
                <Text style={styles.findMoreButtonText}>Find More Challenges</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Community Impact */}
          <View style={styles.communityContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Community Impact</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.communityCard}>
              <View style={styles.communityHeader}>
                <MaterialCommunityIcons name="earth" size={24} color="#48A665" />
                <Text style={styles.communityTitle}>Our Community Impact</Text>
              </View>
              <View style={styles.communityStats}>
                <View style={styles.communityStat}>
                  <Text style={styles.communityStatValue}>32,458</Text>
                  <Text style={styles.communityStatLabel}>kg CO₂ Saved</Text>
                </View>
                <View style={styles.communityStat}>
                  <Text style={styles.communityStatValue}>1,286</Text>
                  <Text style={styles.communityStatLabel}>Trees Planted</Text>
                </View>
                <View style={styles.communityStat}>
                  <Text style={styles.communityStatValue}>$94.5K</Text>
                  <Text style={styles.communityStatLabel}>Donated</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.communityButton}>
                <Text style={styles.communityButtonText}>Join Community Projects</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tips and Education */}
          <View style={styles.tipsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Eco Finance Tips</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>More Tips</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScrollView}>
              <View style={styles.tipCard}>
                <Image
                  source={{ uri: 'https://placehold.co/120x80?text=Eco+Investing' }}
                  style={styles.tipImage}
                />
                <Text style={styles.tipTitle}>Sustainable Investing</Text>
                <Text style={styles.tipDescription}>How to build an eco-friendly portfolio</Text>
              </View>
              <View style={styles.tipCard}>
                <Image
                  source={{ uri: 'https://placehold.co/120x80?text=Green+Home' }}
                  style={styles.tipImage}
                />
                <Text style={styles.tipTitle}>Green Home Savings</Text>
                <Text style={styles.tipDescription}>Eco upgrades that save money</Text>
              </View>
              <View style={styles.tipCard}>
                <Image
                  source={{ uri: 'https://placehold.co/120x80?text=Carbon+Budget' }}
                  style={styles.tipImage}
                />
                <Text style={styles.tipTitle}>Carbon Budgeting</Text>
                <Text style={styles.tipDescription}>Track and reduce your footprint</Text>
              </View>
            </ScrollView>
          </View>

          {/* Settings and Preferences */}
          <View style={styles.settingsContainer}>
            <Text style={styles.sectionTitle}>Settings & Preferences</Text>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <MaterialCommunityIcons name="cog" size={20} color="#555" />
                <Text style={styles.settingLabel}>Impact Calculation Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#BBB" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <MaterialCommunityIcons name="bell" size={20} color="#555" />
                <Text style={styles.settingLabel}>Eco Alerts & Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#BBB" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <MaterialCommunityIcons name="clipboard-list" size={20} color="#555" />
                <Text style={styles.settingLabel}>Carbon Offset Preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#BBB" />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your eco impact is calculated based on transaction data and industry-standard carbon metrics.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 15,
  },
  carbonSavedContainer: {
    alignItems: 'center',
  },
  carbonSavedLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  carbonSavedValue: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  carbonValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
  },
  carbonUnit: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    marginLeft: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 4,
  },
  periodButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activePeriod: {
    backgroundColor: '#FFF',
  },
  periodText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  activePeriodText: {
    color: '#48A665',
  },
  impactMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: -25,
  },
  metricCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#48A665',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#48A665',
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#48A665',
  },
  chartContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    alignItems: 'center',
  },
  chart: {
    marginTop: 10,
    borderRadius: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  transactionIconContainer: {
    backgroundColor: 'rgba(72, 166, 101, 0.1)',
    borderRadius: 10,
    padding: 8,
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  transactionCategory: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  transactionAmounts: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  carbonAmount: {
    fontSize: 13,
    color: '#48A665',
    marginTop: 2,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionIconContainer: {
    backgroundColor: 'rgba(72, 166, 101, 0.1)',
    borderRadius: 10,
    padding: 8,
    marginRight: 12,
  },
  actionDetails: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  actionDescription: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  actionImpact: {
    fontSize: 13,
    color: '#48A665',
    marginTop: 4,
  },
  customBannerContainer: {
    marginVertical: 15,
  },
  customBanner: {
    borderRadius: 12,
    padding: 15,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bannerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  bannerDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  bannerButton: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#48A665',
    fontWeight: '600',
    fontSize: 14,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  challengeSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  ecoPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(72, 166, 101, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  ecoPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#48A665',
    marginLeft: 4,
  },
  challengeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  challengeIconContainer: {
    backgroundColor: '#48A665',
    borderRadius: 8,
    padding: 6,
    marginRight: 10,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#666',
    marginVertical: 8,
  },
  challengeProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
    flex: 1,
    marginRight: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#48A665',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#48A665',
    width: 40,
    textAlign: 'right',
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  challengeReward: {
    fontSize: 14,
    color: '#666',
  },
  challengeButton: {
    backgroundColor: 'rgba(72, 166, 101, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  challengeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#48A665',
  },
  findMoreButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#48A665',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  findMoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#48A665',
  },
  communityContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  communityCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  communityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  communityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  communityStat: {
    alignItems: 'center',
    flex: 1,
  },
  communityStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  communityStatLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  communityButton: {
    backgroundColor: '#48A665',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  communityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  tipsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  tipsScrollView: {
    marginTop: 5,
    marginBottom: 20,
  },
  tipCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: 150,
    marginRight: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  tipImage: {
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  settingsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});

export default EcoFinancialImpactScreen;