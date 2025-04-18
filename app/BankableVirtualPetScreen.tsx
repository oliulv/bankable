import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, FlatList, Animated, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Video } from 'expo-av'

// Types
type PetItem = {
  id: string
  name: string
  price: number
  image: string
  type: "clothing" | "accessory" | "background"
  equipped?: boolean
}

type Reward = {
  id: string
  name: string
  description: string
  price: number
  image: string
  partner: string
}

type Friend = {
  id: string
  name: string
  points: number
  petImage: string
  petItems: string[]
}

// Mock data (kept the same)
const petItems: PetItem[] = [
  {
    id: "1",
    name: "Party Hat",
    price: 100,
    image: "https://images.unsplash.com/photo-1578374173705-969cbe6f2d6b?w=250&h=250&fit=crop&crop=faces",
    type: "accessory",
  },
  {
    id: "2",
    name: "Sunglasses",
    price: 150,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=250&h=250&fit=crop",
    type: "accessory",
  },
  {
    id: "3",
    name: "Business Suit",
    price: 300,
    image: "https://images.unsplash.com/photo-1598808503746-f34cfb6350ff?w=250&h=250&fit=crop",
    type: "clothing",
  },
  {
    id: "4",
    name: "Beach Background",
    price: 200,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=250&h=250&fit=crop",
    type: "background",
  },
  {
    id: "5",
    name: "Bow Tie",
    price: 80,
    image: "https://images.unsplash.com/photo-1589756823695-278bc923f962?w=250&h=250&fit=crop",
    type: "accessory",
  },
  {
    id: "6",
    name: "Casual Outfit",
    price: 250,
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=250&h=250&fit=crop",
    type: "clothing",
  },
]

const rewards: Reward[] = [
  {
    id: "1",
    name: "Free Sausage Roll",
    description: "Enjoy a free sausage roll at any Greggs location",
    price: 500,
    image: "https://images.unsplash.com/photo-1626078299034-58caa0d96f4f?w=250&h=250&fit=crop",
    partner: "Greggs",
  },
  {
    id: "2",
    name: "10% Off Coffee",
    description: "10% off your next coffee purchase",
    price: 300,
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=250&h=250&fit=crop",
    partner: "Costa Coffee",
  },
  {
    id: "3",
    name: "£5 Amazon Voucher",
    description: "£5 off your next Amazon purchase",
    price: 1000,
    image: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=250&h=250&fit=crop",
    partner: "Amazon",
  },
]

const friends: Friend[] = [
  {
    id: "1",
    name: "Sarah",
    points: 1250,
    petImage: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=250&h=250&fit=crop",
    petItems: ["1", "3"],
  },
  {
    id: "2",
    name: "Mike",
    points: 980,
    petImage: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=250&h=250&fit=crop",
    petItems: ["2", "6"],
  },
  {
    id: "3",
    name: "Emma",
    points: 1500,
    petImage: "https://images.unsplash.com/photo-1518155317743-a8ff43ea6a5f?w=250&h=250&fit=crop",
    petItems: ["5", "4"],
  },
  {
    id: "4",
    name: "John",
    points: 750,
    petImage: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=250&h=250&fit=crop",
    petItems: ["1", "6"],
  },
]

const VirtualPetBanking: React.FC = () => {
  // State
  const [points, setPoints] = useState(500)
  const [showItemShop, setShowItemShop] = useState(false)
  const [showVoucherShop, setShowVoucherShop] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [ownedItems, setOwnedItems] = useState<PetItem[]>([])
  const [equippedItems, setEquippedItems] = useState<PetItem[]>([])
  const [petHappiness, setPetHappiness] = useState(70)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [activeItemShopTab, setActiveItemShopTab] = useState("shop") // New state for tracking active tab
  const [activeRewardShopTab, setActiveRewardShopTab] = useState("shop") // New state for rewards tab
  const [redeemedVouchers, setRedeemedVouchers] = useState<Reward[]>([]) // Track redeemed vouchers
  const videoRef = useRef<Video>(null);
  
  // User context (mock)
  const user = {
    name: "Oliver Palmer",
    firstName: "Oliver"
  };

  // Animations
  const bounceAnim = useState(new Animated.Value(0))[0]
  const happinessAnim = useState(new Animated.Value(0))[0]

  // Simulate financial goal achievements
  useEffect(() => {
    const interval = setInterval(() => {
      const randomChance = Math.random()
      if (randomChance > 0.7) {
        const pointsEarned = Math.floor(Math.random() * 50) + 10
        addPoints(pointsEarned, `Savings goal met! +${pointsEarned} points`)

        // Increase pet happiness
        setPetHappiness((prev) => Math.min(prev + 5, 100))
      }
    }, 15000) // Every 15 seconds for demo purposes

    return () => clearInterval(interval)
  }, [])

  // Pet animation
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 10,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Happiness animation
  useEffect(() => {
    Animated.timing(happinessAnim, {
      toValue: petHappiness / 100,
      duration: 500,
      useNativeDriver: false,
    }).start()
  }, [petHappiness])

  // Add points and show notification
  const addPoints = (amount: number, message: string) => {
    setPoints((prev) => prev + amount)
    setNotificationMessage(message)
    setShowNotification(true)

    setTimeout(() => {
      setShowNotification(false)
    }, 3000)
  }

  // Buy item
  const buyItem = (item: PetItem) => {
    if (points >= item.price) {
      setPoints((prev) => prev - item.price)
      setOwnedItems((prev) => [...prev, item])
      setNotificationMessage(`You bought ${item.name}!`)
      setShowNotification(true)

      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }
  }

  // Equip item
  const toggleEquipItem = (item: PetItem) => {
    const isEquipped = equippedItems.some((i) => i.id === item.id)

    if (isEquipped) {
      setEquippedItems((prev) => prev.filter((i) => i.id !== item.id))
    } else {
      // If item is of same type, replace it
      const sameTypeItems = equippedItems.filter((i) => i.type === item.type)
      if (sameTypeItems.length > 0 && item.type !== "accessory") {
        setEquippedItems((prev) => [...prev.filter((i) => i.type !== item.type), item])
      } else {
        setEquippedItems((prev) => [...prev, item])
      }
    }
  }

  // Redeem reward
  const redeemReward = (reward: Reward) => {
    if (points >= reward.price) {
      setPoints((prev) => prev - reward.price)
      setRedeemedVouchers(prev => [...prev, reward]) // Add to redeemed vouchers
      setNotificationMessage(`You redeemed ${reward.name}!`)
      setShowNotification(true)

      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }
  }

  // Render item in shop
  const renderShopItem = ({ item }: { item: PetItem }) => {
    const isOwned = ownedItems.some((i) => i.id === item.id)

    return (
      <TouchableOpacity
        style={styles.shopItem}
        onPress={() => !isOwned && buyItem(item)}
        disabled={isOwned || points < item.price}
      >
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{isOwned ? "Owned" : `${item.price} pts`}</Text>
        <LinearGradient
          colors={isOwned || points < item.price ? ["#8fbda8", "#8fbda8"] : ["#015F45", "#017a5a"]}
          style={styles.buyButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.buyButtonText}>
            {isOwned ? "Owned" : points < item.price ? "Not enough" : "Buy"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  // Render owned item
  const renderOwnedItem = ({ item }: { item: PetItem }) => {
    const isEquipped = equippedItems.some((i) => i.id === item.id)

    return (
      <TouchableOpacity
        style={[styles.ownedItem, isEquipped && styles.equippedItem]}
        onPress={() => toggleEquipItem(item)}
      >
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.equippedText}>{isEquipped ? "Equipped" : "Tap to equip"}</Text>
      </TouchableOpacity>
    )
  }

  // Render reward
  const renderReward = ({ item }: { item: Reward }) => {
    return (
      <TouchableOpacity 
        style={styles.rewardItem} 
        onPress={() => redeemReward(item)} 
        disabled={points < item.price}
      >
        <Image source={{ uri: item.image }} style={styles.rewardImage} />
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardName}>{item.name}</Text>
          <Text style={styles.rewardPartner}>{item.partner}</Text>
          <Text style={styles.rewardDescription}>{item.description}</Text>
        </View>
        <LinearGradient
          colors={points < item.price ? ["#8fbda8", "#8fbda8"] : ["#015F45", "#017a5a"]}
          style={styles.redeemButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.redeemButtonText}>{points < item.price ? "Not enough" : `${item.price} pts`}</Text>
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  // Render friend - FIX: Ensuring each item has a unique key
  const renderFriend = ({ item, index }: { item: Friend; index: number }) => {
    return (
      <View style={styles.friendItem}>
        <Text style={styles.friendRank}>#{index + 1}</Text>
        <Image source={{ uri: item.petImage }} style={styles.friendPetImage} />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendPoints}>{item.points} points</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Updated Header with Shadow */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Bankable Pet</Text>
        <View style={styles.pointsDisplay}>
          <Text style={styles.pointsText}>{points} pts</Text>
        </View>
      </View>

      {/* Pet Display with updated styling and shadow */}
      <View style={styles.petCard}>
        <View style={styles.petCardGradient}>
          <View style={styles.petHeaderRow}>
            <View style={styles.happinessContainer}>
              <Text style={styles.happinessLabel}>Pet Happiness</Text>
              <View style={styles.happinessBarContainer}>
                <Animated.View
                  style={[
                    styles.happinessBarFill,
                    {
                      width: happinessAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <Animated.View style={[styles.petWrapper, { transform: [{ translateY: bounceAnim }] }]}>
            <Video
              ref={videoRef}
              source={require('../assets/turtle.mp4')}
              style={styles.petImage}
              isLooping
              shouldPlay
              rate={0.5} // Slows down the video to half speed
            />

            {/* Render equipped items */}
            {equippedItems.map((item) => (
              <Image
                key={item.id}
                source={{ uri: item.image }}
                style={[
                  styles.equippedItemImage,
                  item.type === "background" && styles.backgroundItem,
                  item.type === "clothing" && styles.clothingItem,
                  item.type === "accessory" && styles.accessoryItem,
                ]}
              />
            ))}
          </Animated.View>
        </View>
      </View>

      {/* Navigation Buttons - Updated to Pill Style */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.navButton} onPress={() => setShowItemShop(true)}>
          <Text style={styles.buttonText}>Pet Shop</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => setShowVoucherShop(true)}>
          <Text style={styles.buttonText}>Rewards</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => setShowLeaderboard(true)}>
          <Text style={styles.buttonText}>Leaderboard</Text>
        </TouchableOpacity>
      </View>

      {/* Item Shop Modal */}
      <Modal
        visible={showItemShop}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowItemShop(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pet Item Shop</Text>
              <Text style={styles.modalPoints}>{points} points available</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowItemShop(false)}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeItemShopTab === "shop" && styles.activeTab]}
                onPress={() => setActiveItemShopTab("shop")}
              >
                <Text style={[styles.tabText, activeItemShopTab === "shop" && styles.activeTabText]}>Shop</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeItemShopTab === "myItems" && styles.activeTab]}
                onPress={() => setActiveItemShopTab("myItems")}
              >
                <Text style={[styles.tabText, activeItemShopTab === "myItems" && styles.activeTabText]}>My Items</Text>
              </TouchableOpacity>
            </View>

            {activeItemShopTab === "shop" && (
              <FlatList
                data={petItems}
                renderItem={renderShopItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.shopList}
              />
            )}

            {activeItemShopTab === "myItems" && (
              <FlatList
                data={ownedItems}
                renderItem={renderOwnedItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.shopList}
                ListEmptyComponent={<Text style={styles.emptyText}>You don't own any items yet.</Text>}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Voucher Shop Modal */}
      <Modal
        visible={showVoucherShop}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVoucherShop(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rewards Shop</Text>
              <Text style={styles.modalPoints}>{points} points available</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowVoucherShop(false)}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeRewardShopTab === "shop" && styles.activeTab]}
                onPress={() => setActiveRewardShopTab("shop")}
              >
                <Text style={[styles.tabText, activeRewardShopTab === "shop" && styles.activeTabText]}>Rewards</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeRewardShopTab === "myVouchers" && styles.activeTab]}
                onPress={() => setActiveRewardShopTab("myVouchers")}
              >
                <Text style={[styles.tabText, activeRewardShopTab === "myVouchers" && styles.activeTabText]}>My Vouchers</Text>
              </TouchableOpacity>
            </View>

            {activeRewardShopTab === "shop" && (
              <FlatList
                data={rewards}
                renderItem={renderReward}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.rewardsList}
              />
            )}
            
            {activeRewardShopTab === "myVouchers" && (
              <FlatList
                data={redeemedVouchers}
                renderItem={({ item }) => (
                  <View style={styles.rewardItem}>
                    <Image source={{ uri: item.image }} style={styles.rewardImage} />
                    <View style={styles.rewardInfo}>
                      <Text style={styles.rewardName}>{item.name}</Text>
                      <Text style={styles.rewardPartner}>{item.partner}</Text>
                      <Text style={styles.rewardDescription}>{item.description}</Text>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.id + "-redeemed"}
                contentContainerStyle={styles.rewardsList}
                ListEmptyComponent={<Text style={styles.emptyText}>You haven't redeemed any vouchers yet.</Text>}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Leaderboard Modal - FIX: Ensuring unique keys in the list data */}
      <Modal
        visible={showLeaderboard}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLeaderboard(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Leaderboard</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowLeaderboard(false)}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.yourRankContainer}>
              <Text style={styles.yourRankLabel}>{user.firstName}'s Rank</Text>
              <Text style={styles.yourRankValue}>#2</Text>
              <Text style={styles.yourRankPoints}>{points} points</Text>
            </View>

            <FlatList
              data={[
                // Create leaderboard data with unique IDs - this fixes the duplicate key issue
                { id: "sarah", name: "Sarah", points: 1250, petImage: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=250&h=250&fit=crop", petItems: ["1", "3"] },
                { id: "user", name: user.firstName, points: points, petImage: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=250&h=250&fit=crop", petItems: [] },
                { id: "emma", name: "Emma", points: 1500, petImage: "https://images.unsplash.com/photo-1518155317743-a8ff43ea6a5f?w=250&h=250&fit=crop", petItems: ["5", "4"] },
                { id: "john", name: "John", points: 750, petImage: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=250&h=250&fit=crop", petItems: ["1", "6"] }
              ].sort((a, b) => b.points - a.points)}
              renderItem={renderFriend}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.friendsList}
            />
          </View>
        </View>
      </Modal>

      {/* Updated Notification with Rounder Shape */}
      {showNotification && (
        <View style={styles.notification}>
          <Text style={styles.notificationText}>{notificationMessage}</Text>
        </View>
      )}
    </View>
  )
}

const { width } = Dimensions.get("window")
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "white",
  },
  // Updated header styles with shadow
  headerContainer: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 4, // Android shadow
    zIndex: 1, // Ensure shadow is visible
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  pointsDisplay: {
    backgroundColor: "#f3fee8",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pointsText: {
    color: "#015F45",
    fontWeight: "bold",
  },
  // Updated pet card with stronger shadow
  petCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    backgroundColor: "#f3fee8",
  },
  // ...existing code...

  // Updated notification to match BudgetingScreen pill style
  notification: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#f3fee8",
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  notificationText: {
    color: "#015F45",
    fontSize: 16,
    fontWeight: "500",
  },
  // ...existing code...

  // Updated buttons to match pill style from budget page
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 5,
    height: 44,
    borderRadius: 24,
    backgroundColor: "#f3fee8",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: "#015F45",
    fontWeight: "600",
    fontSize: 14,
  },
  // ...existing code...

  // Updated leaderboard friend items with shadow
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3fee8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  // ...existing code...
  petCardGradient: {
    padding: 16,
    borderRadius: 18,
  },
  petHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  happinessContainer: {
    flex: 1,
  },
  happinessLabel: {
    fontSize: 14,
    color: "#015F45", 
    marginBottom: 4,
    fontWeight: "500",
  },
  happinessBarContainer: {
    height: 8,
    backgroundColor: "#e2e8e5",
    borderRadius: 4,
    overflow: "hidden",
  },
  happinessBarFill: {
    height: "100%",
    backgroundColor: "#015F45", 
    borderRadius: 4,
  },
  petWrapper: {
    position: "relative",
    width: 250,
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  petImage: {
    width: 250,
    height: 250,
    borderRadius: 20,
  },
  equippedItemImage: {
    position: "absolute",
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  backgroundItem: {
    width: "100%",
    height: "100%",
    zIndex: -1,
  },
  clothingItem: {
    width: 150,
    height: 150,
    zIndex: 1,
  },
  accessoryItem: {
    width: 70,
    height: 70,
    top: 20,
    zIndex: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  modalPoints: {
    fontSize: 16,
    color: "#64748b",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: "#000",
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#015F45", // Updated to match other screens
  },
  tabText: {
    fontSize: 16,
    color: "#64748b",
  },
  activeTabText: {
    color: "#015F45", // Updated to match other screens
    fontWeight: "600",
  },
  shopList: {
    paddingBottom: 20,
  },
  shopItem: {
    width: (width - 60) / 2,
    backgroundColor: "#f3fee8", // Updated to match other screens
    borderRadius: 12,
    padding: 10,
    margin: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemImage: {
    width: 60,
    height: 60,
    marginBottom: 10,
    borderRadius: 30,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 10,
  },
  buyButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
  },
  buyButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginTop: 20,
    marginBottom: 10,
  },
  ownedItemsList: {
    paddingBottom: 20,
  },
  ownedItem: {
    width: (width - 60) / 2,
    backgroundColor: "#f3fee8", // Updated to match other screens
    borderRadius: 12,
    padding: 10,
    margin: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  equippedItem: {
    borderWidth: 2,
    borderColor: "#015F45", // Updated to match other screens
  },
  equippedText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 5,
  },
  rewardsList: {
    paddingBottom: 20,
  },
  rewardItem: {
    flexDirection: "row",
    backgroundColor: "#f3fee8", // Updated to match other screens
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  rewardImage: {
    width: 50,
    height: 50,
    marginRight: 15,
    borderRadius: 25,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 2,
  },
  rewardPartner: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 5,
  },
  rewardDescription: {
    fontSize: 12,
    color: "#64748b",
  },
  redeemButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  redeemButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  friendsList: {
    paddingBottom: 20,
  },
  friendRank: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    width: 40,
  },
  friendPetImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  friendPoints: {
    fontSize: 14,
    color: "#64748b",
  },
  yourRankContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3fee8", // Updated to match other screens
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  yourRankLabel: {
    fontSize: 16,
    color: "#0f172a",
    flex: 1,
  },
  yourRankValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginRight: 10,
  },
  yourRankPoints: {
    fontSize: 16,
    color: "#64748b",
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 16,
    padding: 20,
  },
})

export default VirtualPetBanking
