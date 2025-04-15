"use client"

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

// Mock data
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
  const videoRef = useRef<Video>(null);

  // Animations
  const bounceAnim = useState(new Animated.Value(0))[0]
  const happinessAnim = useState(new Animated.Value(0))[0]

  // Simulate financial goal achievements
  useEffect(() => {
    const interval = setInterval(() => {
      const randomChance = Math.random()
      if (randomChance > 0.7) {
        const pointsEarned = Math.floor(Math.random() * 50) + 10
        addPoints(pointsEarned, `You saved £${pointsEarned / 10} today! +${pointsEarned} points`)

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
        <View style={[styles.buyButton, (isOwned || points < item.price) && styles.disabledButton]}>
          <Text style={styles.buyButtonText}>
            {isOwned ? "Owned" : points < item.price ? "Not enough points" : "Buy"}
          </Text>
        </View>
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
      <TouchableOpacity style={styles.rewardItem} onPress={() => redeemReward(item)} disabled={points < item.price}>
        <Image source={{ uri: item.image }} style={styles.rewardImage} />
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardName}>{item.name}</Text>
          <Text style={styles.rewardPartner}>{item.partner}</Text>
          <Text style={styles.rewardDescription}>{item.description}</Text>
        </View>
        <View style={[styles.redeemButton, points < item.price && styles.disabledButton]}>
          <Text style={styles.redeemButtonText}>{points < item.price ? "Not enough" : `${item.price} pts`}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  // Render friend
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
    <LinearGradient colors={["#f0f9ff", "#e0f2fe"]} style={styles.container}>
      {/* Points Bar */}
      <View style={styles.pointsBar}>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>Points</Text>
          <Text style={styles.pointsValue}>{points}</Text>
        </View>

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

      {/* Pet Display */}
      <View style={styles.petContainer}>
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

      {/* Navigation Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.navButton} onPress={() => setShowItemShop(true)}>
          <LinearGradient
            colors={["#60a5fa", "#3b82f6"]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>Item Shop</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => setShowVoucherShop(true)}>
          <LinearGradient
            colors={["#f472b6", "#ec4899"]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>Rewards</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => setShowLeaderboard(true)}>
          <LinearGradient
            colors={["#a78bfa", "#8b5cf6"]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>Leaderboard</Text>
          </LinearGradient>
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
              <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                <Text style={styles.tabText}>Shop</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tab}>
                <Text style={styles.tabText}>My Items</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={petItems}
              renderItem={renderShopItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.shopList}
            />

            {ownedItems.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Your Items</Text>
                <FlatList
                  data={ownedItems}
                  renderItem={renderOwnedItem}
                  keyExtractor={(item) => item.id}
                  horizontal
                  contentContainerStyle={styles.ownedItemsList}
                />
              </>
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

            <FlatList
              data={rewards}
              renderItem={renderReward}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.rewardsList}
            />
          </View>
        </View>
      </Modal>

      {/* Leaderboard Modal */}
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
              <Text style={styles.yourRankLabel}>Your Rank</Text>
              <Text style={styles.yourRankValue}>#2</Text>
              <Text style={styles.yourRankPoints}>{points} points</Text>
            </View>

            <FlatList
              data={[...friends].sort((a, b) => b.points - a.points)}
              renderItem={renderFriend}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.friendsList}
            />
          </View>
        </View>
      </Modal>

      {/* Notification */}
      {showNotification && (
        <View style={styles.notification}>
          <Text style={styles.notificationText}>{notificationMessage}</Text>
        </View>
      )}
    </LinearGradient>
  )
}

const { width } = Dimensions.get("window")
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff', // White background
  },
  pointsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  pointsContainer: {
    alignItems: "center",
  },
  pointsLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },
  happinessContainer: {
    flex: 1,
    marginLeft: 20,
  },
  happinessLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  happinessBarContainer: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  happinessBarFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 4,
  },
  petContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#ffffff',
  },
  petWrapper: {
    position: "relative",
    width: 250,
    height: 250,
    justifyContent: "center",
    alignItems: "center",
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
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  navButton: {
    width: "30%",
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
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
    color: "#0f172a",
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
    color: "#64748b",
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
    borderBottomColor: "#3b82f6",
  },
  tabText: {
    fontSize: 16,
    color: "#64748b",
  },
  shopList: {
    paddingBottom: 20,
  },
  shopItem: {
    width: (width - 60) / 2,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
    margin: 5,
    alignItems: "center",
  },
  itemImage: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 10,
  },
  buyButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  buyButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#cbd5e1",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 20,
    marginBottom: 10,
  },
  ownedItemsList: {
    paddingBottom: 20,
  },
  ownedItem: {
    width: 100,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    alignItems: "center",
  },
  equippedItem: {
    borderWidth: 2,
    borderColor: "#3b82f6",
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
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
  },
  rewardImage: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
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
    backgroundColor: "#ec4899",
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
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
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
    backgroundColor: "#f0f9ff",
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
  notification: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  notificationText: {
    color: "white",
    fontSize: 16,
  },
})

export default VirtualPetBanking
