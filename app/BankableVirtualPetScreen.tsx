import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, FlatList, Animated, Dimensions, TextInput, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Video } from 'expo-av'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
  redeemed?: boolean
  code?: string
}

type Friend = {
  id: string
  name: string
  points: number
  petImage: string
  petItems: string[]
}

// Keys for AsyncStorage
const STORAGE_KEYS = {
  POINTS: 'bankable_points',
  OWNED_ITEMS: 'bankable_owned_items',
  EQUIPPED_ITEMS: 'bankable_equipped_items',
  PET_NAME: 'bankable_pet_name',
  HAPPINESS: 'bankable_pet_happiness',
  VOUCHERS: 'bankable_vouchers'
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
  const [petName, setPetName] = useState("My Turtle") // New state for pet name
  const [editingPetName, setEditingPetName] = useState(false) // New state for pet name editing mode
  const [isLoading, setIsLoading] = useState(true) // Track loading state
  const videoRef = useRef<Video>(null);
  
  // User context (mock)
  const user = {
    name: "Oliver Palmer",
    firstName: "Oliver"
  };

  // Animations
  const bounceAnim = useState(new Animated.Value(0))[0]
  const happinessAnim = useState(new Animated.Value(0))[0]

  // Load saved data when component mounts
  useEffect(() => {
    loadSavedData()
  }, [])

  // Save data whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveData()
    }
  }, [points, ownedItems, equippedItems, petHappiness, petName, redeemedVouchers, isLoading])

  // Load data from AsyncStorage
  const loadSavedData = async () => {
    try {
      const savedPoints = await AsyncStorage.getItem(STORAGE_KEYS.POINTS)
      const savedOwnedItems = await AsyncStorage.getItem(STORAGE_KEYS.OWNED_ITEMS)
      const savedEquippedItems = await AsyncStorage.getItem(STORAGE_KEYS.EQUIPPED_ITEMS)
      const savedPetName = await AsyncStorage.getItem(STORAGE_KEYS.PET_NAME)
      const savedHappiness = await AsyncStorage.getItem(STORAGE_KEYS.HAPPINESS)
      const savedVouchers = await AsyncStorage.getItem(STORAGE_KEYS.VOUCHERS)

      if (savedPoints) setPoints(parseInt(savedPoints))
      if (savedOwnedItems) setOwnedItems(JSON.parse(savedOwnedItems))
      if (savedEquippedItems) setEquippedItems(JSON.parse(savedEquippedItems))
      if (savedPetName) setPetName(savedPetName)
      if (savedHappiness) setPetHappiness(parseInt(savedHappiness))
      if (savedVouchers) setRedeemedVouchers(JSON.parse(savedVouchers))
      
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Save data to AsyncStorage
  const saveData = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.POINTS, points.toString())
      await AsyncStorage.setItem(STORAGE_KEYS.OWNED_ITEMS, JSON.stringify(ownedItems))
      await AsyncStorage.setItem(STORAGE_KEYS.EQUIPPED_ITEMS, JSON.stringify(equippedItems))
      await AsyncStorage.setItem(STORAGE_KEYS.PET_NAME, petName)
      await AsyncStorage.setItem(STORAGE_KEYS.HAPPINESS, petHappiness.toString())
      await AsyncStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(redeemedVouchers))
    } catch (error) {
      console.error("Error saving data:", error)
    }
  }

  // Generate a random voucher code
  const generateVoucherCode = (partner: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = partner.substring(0, 3).toUpperCase() + '-'
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

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

  // Redeem reward - updated to track purchased but unredeemed vouchers
  const redeemReward = (reward: Reward) => {
    if (points >= reward.price) {
      setPoints((prev) => prev - reward.price)
      // Add to redeemed vouchers with redeemed status as false
      setRedeemedVouchers(prev => [...prev, {...reward, redeemed: false}])
      setNotificationMessage(`You bought ${reward.name}!`)
      setShowNotification(true)

      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }
  }

  // Generate code and mark voucher as redeemed
  const generateCode = (voucher: Reward) => {
    const code = generateVoucherCode(voucher.partner)
    
    setRedeemedVouchers(prev => 
      prev.map(v => 
        v.id === voucher.id 
          ? {...v, redeemed: true, code: code} 
          : v
      )
    )

    Alert.alert(
      "Voucher Redeemed!", 
      `Your code: ${code}\n\nShow this code to redeem your reward at ${voucher.partner}.`,
      [{ text: "OK" }]
    )
  }

  // Remove a redeemed voucher
  const removeVoucher = (voucherId: string) => {
    Alert.alert(
      "Remove Voucher",
      "Are you sure you want to remove this voucher?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => {
            setRedeemedVouchers(prev => prev.filter(v => v.id !== voucherId))
            setNotificationMessage("Voucher removed")
            setShowNotification(true)
            setTimeout(() => {
              setShowNotification(false)
            }, 3000)
          }
        }
      ]
    )
  }

  // Handle pet name edit toggle
  const togglePetNameEdit = () => {
    setEditingPetName(!editingPetName);
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
    const isOwned = redeemedVouchers.some(v => v.id === item.id)
    
    return (
      <TouchableOpacity 
        style={styles.rewardItem} 
        onPress={() => !isOwned && redeemReward(item)} 
        disabled={isOwned || points < item.price}
      >
        <Image source={{ uri: item.image }} style={styles.rewardImage} />
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardName}>{item.name}</Text>
          <Text style={styles.rewardPartner}>{item.partner}</Text>
          <Text style={styles.rewardDescription}>{item.description}</Text>
        </View>
        <LinearGradient
          colors={isOwned || points < item.price ? ["#8fbda8", "#8fbda8"] : ["#015F45", "#017a5a"]}
          style={styles.redeemButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.redeemButtonText}>
            {isOwned ? "Owned" : points < item.price ? "Not enough" : `${item.price} pts`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  // Render redeemed voucher with status and action buttons
  const renderRedeemedVoucher = ({ item }: { item: Reward }) => {
    return (
      <View style={styles.rewardItem}>
        <Image source={{ uri: item.image }} style={styles.rewardImage} />
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardName}>{item.name}</Text>
          <Text style={styles.rewardPartner}>{item.partner}</Text>
          <Text style={styles.rewardDescription}>{item.description}</Text>
          
          {item.redeemed && item.code && (
            <View style={styles.codeContainer}>
              <Text style={styles.voucherCodeLabel}>Code:</Text>
              <Text style={styles.voucherCode}>{item.code}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.voucherActionsContainer}>
          {!item.redeemed ? (
            <TouchableOpacity 
              style={styles.redeemCodeButton}
              onPress={() => generateCode(item)}
            >
              <Text style={styles.redeemCodeButtonText}>Get Code</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.redeemedBadge}>
              <Text style={styles.redeemedText}>Redeemed</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.removeVoucherButton}
            onPress={() => removeVoucher(item.id)}
          >
            <Text style={styles.removeVoucherText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
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
      {/* Fixed Header with Shadow */}
      <View style={styles.fixedHeader}>
        <Text style={styles.title}>Bankable Pet</Text>
        <View style={styles.pointsDisplay}>
          <Text style={styles.pointsText}>{points} pts</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Pet Display with updated styling and shadow */}
        <View style={styles.petCard}>
          <View style={styles.petCardGradient}>
            {/* Pet Name Section */}
            <View style={styles.petNameContainer}>
              {editingPetName ? (
                <View style={styles.petNameEditContainer}>
                  <TextInput
                    style={styles.petNameInput}
                    value={petName}
                    onChangeText={setPetName}
                    autoFocus
                    maxLength={20}
                  />
                  <TouchableOpacity style={styles.petNameSaveButton} onPress={togglePetNameEdit}>
                    <Text style={styles.petNameSaveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.petNameDisplayContainer}>
                  <Text style={styles.petNameText}>{petName}</Text>
                  <TouchableOpacity style={styles.petNameEditButton} onPress={togglePetNameEdit}>
                    <Text style={styles.petNameEditButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
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

      {/* Voucher Shop Modal - Updated with redemption system */}
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
                renderItem={renderRedeemedVoucher}
                keyExtractor={(item) => item.id + "-redeemed"}
                contentContainerStyle={styles.rewardsList}
                ListEmptyComponent={<Text style={styles.emptyText}>You haven't purchased any vouchers yet.</Text>}
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
    backgroundColor: "white",
  },
  // Fixed header styles
  fixedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 12,
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
  petCardGradient: {
    padding: 16,
    borderRadius: 18,
  },
  // Pet name styling
  petNameContainer: {
    marginBottom: 16,
  },
  petNameDisplayContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  petNameText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#015F45",
  },
  petNameEditButton: {
    backgroundColor: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  petNameEditButtonText: {
    color: "#015F45",
    fontSize: 12,
    fontWeight: "500",
  },
  petNameEditContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  petNameInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  petNameSaveButton: {
    backgroundColor: "#015F45",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  petNameSaveButtonText: {
    color: "#fff",
    fontWeight: "600",
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
  // New styles for voucher redemption
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#f8f9fa',
    padding: 6,
    borderRadius: 6,
  },
  voucherCodeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 6,
  },
  voucherCode: {
    fontSize: 14,
    fontFamily: 'monospace',
    letterSpacing: 1,
    fontWeight: '700',
    color: '#015F45',
  },
  voucherActionsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingVertical: 5,
  },
  redeemCodeButton: {
    backgroundColor: '#015F45',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 90,
    alignItems: 'center',
    marginBottom: 8,
  },
  redeemCodeButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  redeemedBadge: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
    marginBottom: 8,
  },
  redeemedText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  removeVoucherButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  removeVoucherText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
})

export default VirtualPetBanking
