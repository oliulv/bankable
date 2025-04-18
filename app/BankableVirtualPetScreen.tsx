import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Animated, Dimensions, TextInput, Alert, ScrollView } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Image as ExpoImage } from "expo-image"
import { Ionicons } from "@expo/vector-icons" // Add this import for icons

// Types
type PetItem = {
  id: string
  name: string
  price: number
  image: any
  skinImage: string  // Path to the turtle skin image
  type: "skin"        // Changed type to only be "skin"
  equipped?: boolean
}

type Friend = {
  id: string
  name: string
  points: number
  petImage: string
  petItems: string[]
}

type Reward = {
  id: string
  name: string
  description: string
  price: number
  image: any
  partner: string
  redeemed?: boolean
  code?: string
}

// Keys for AsyncStorage
const STORAGE_KEYS = {
  POINTS: 'bankable_points',
  OWNED_ITEMS: 'bankable_owned_items',
  EQUIPPED_ITEMS: 'bankable_equipped_items',
  PET_NAME: 'bankable_pet_name',
  HAPPINESS: 'bankable_pet_happiness',
  VOUCHERS: 'bankable_vouchers',
  ACTIVE_SKIN: 'bankable_active_skin',  // New key for active skin
  PURCHASED_REWARDS: 'bankable_purchased_rewards' // New key for purchased rewards
}

// Mock data - Updated to include turtle skins with local asset paths
const petItems: PetItem[] = [
  {
    id: "1",
    name: "Happy Turtle",
    price: 0,  // Free/default
    image: require('../assets/turtle_assets/happy.png'),
    skinImage: "happy.png",
    type: "skin",
  },
  {
    id: "2",
    name: "Turtle Upside Down",
    price: 100,
    image: require('../assets/turtle_assets/back.png'),
    skinImage: "back.png",
    type: "skin",
  },
  {
    id: "3",
    name: "Bathing Turtle",
    price: 150,
    image: require('../assets/turtle_assets/bathing.png'),
    skinImage: "bathing.png",
    type: "skin",
  },
  {
    id: "4",
    name: "Beach Turtle",
    price: 200,
    image: require('../assets/turtle_assets/beach.png'),
    skinImage: "beach.png",
    type: "skin",
  },
  {
    id: "5",
    name: "Birthday Turtle",
    price: 300,
    image: require('../assets/turtle_assets/birthday.png'),
    skinImage: "birthday.png",
    type: "skin",
  },
  {
    id: "6",
    name: "Cool Turtle",
    price: 250,
    image: require('../assets/turtle_assets/cool.png'),
    skinImage: "cool.png",
    type: "skin",
  },
  {
    id: "7",
    name: "Laughing Turtle",
    price: 180,
    image: require('../assets/turtle_assets/laugh.png'),
    skinImage: "laugh.png",
    type: "skin",
  },
  {
    id: "8",
    name: "Love Turtle",
    price: 220,
    image: require('../assets/turtle_assets/love.png'),
    skinImage: "love.png",
    type: "skin",
  },
  {
    id: "9",
    name: "Artistic Turtle",
    price: 280,
    image: require('../assets/turtle_assets/paint.png'),
    skinImage: "paint.png",
    type: "skin",
  },
  {
    id: "10",
    name: "Pizza Turtle",
    price: 350,
    image: require('../assets/turtle_assets/pizza.png'),
    skinImage: "pizza.png",
    type: "skin",
  },
  {
    id: "11",
    name: "Sad Turtle",
    price: 150,
    image: require('../assets/turtle_assets/sad.png'),
    skinImage: "sad.png",
    type: "skin",
  },
  {
    id: "12",
    name: "Walking Turtle",
    price: 200,
    image: require('../assets/turtle_assets/walking.png'),
    skinImage: "walking.png",
    type: "skin",
  },
]

// Updated rewards with correct file paths for images
const rewards: Reward[] = [
  {
    id: "1",
    name: "Free Sausage Roll",
    description: "Enjoy a free sausage roll at any Greggs location",
    price: 500,
    image: require("../assets/partner_assets/greggs.png"),
    partner: "Greggs",
  },
  {
    id: "2",
    name: "10% Off Coffee",
    description: "10% off your next coffee purchase",
    price: 300,
    image: require("../assets/partner_assets/costa.png"),
    partner: "Costa Coffee",
  },
  {
    id: "3",
    name: "£5 Amazon Voucher",
    description: "£5 off your next Amazon purchase",
    price: 1000,
    // Fix the Amazon image path - ensure it matches exactly what's in the assets folder
    image: require("../assets/partner_assets/amazon.png"),
    partner: "Amazon",
  },
  {
    id: "4",
    name: "Free Doughnut",
    description: "Enjoy a free doughnut of your choice at Krispy Kreme",
    price: 400,
    image: require("../assets/partner_assets/krispy_kreme.png"),
    partner: "Krispy Kreme",
  },
  {
    id: "5",
    name: "£5 Tesco Voucher",
    description: "£5 off your next Tesco in-store purchase",
    price: 1000,
    image: require("../assets/partner_assets/tesco.png"),
    partner: "Tesco",
  },
  {
    id: "6",
    name: "Free Whopper",
    description: "Get a free Whopper or Plant-Based Whopper at Burger King",
    price: 600,
    image: require("../assets/partner_assets/burger_king.png"),
    partner: "Burger King",
  },
  {
    id: "7",
    name: "£5 Uber Ride Credit",
    description: "£5 credit towards your next Uber ride",
    price: 1000,
    image: require("../assets/partner_assets/uber.png"),
    partner: "Uber",
  },
  {
    id: "8",
    name: "£5 Sainsbury's Voucher",
    description: "£5 off your next Sainsbury's in-store purchase",
    price: 1000,
    image: require("../assets/partner_assets/sainsburys.png"),
    partner: "Sainsbury's",
  },
  {
    id: "9",
    name: "Free Coffee",
    description: "Enjoy a free hot drink at Caffè Nero",
    price: 300,
    // Fix the Caffe Nero image path - ensure it matches exactly what's in the assets folder
    image: require("../assets/partner_assets/caffe_nero.png"),
    partner: "Caffè Nero",
  },
  {
    id: "10",
    name: "£5 Boots Gift Card",
    description: "£5 off your next purchase at Boots, redeemable online or in-store",
    price: 1000,
    image: require("../assets/partner_assets/boots.png"),
    partner: "Boots",
  },
]

const friends: Friend[] = [
  {
    id: "1",
    name: "Sarah",
    points: 1250,
    petImage: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=250&h=250&fit=crop&crop=faces",
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
  const [points, setPoints] = useState(5000) // Increased initial points balance
  const [showItemShop, setShowItemShop] = useState(false)
  const [showVoucherShop, setShowVoucherShop] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [ownedItems, setOwnedItems] = useState<PetItem[]>([])
  const [equippedSkin, setEquippedSkin] = useState<PetItem | null>(null) // Changed to single skin
  const [petHappiness, setPetHappiness] = useState(70)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [activeItemShopTab, setActiveItemShopTab] = useState("shop") // New state for tracking active tab
  const [activeRewardShopTab, setActiveRewardShopTab] = useState("shop") // New state for rewards tab
  const [redeemedVouchers, setRedeemedVouchers] = useState<Reward[]>([]) // Track redeemed vouchers
  const [petName, setPetName] = useState("My Turtle") // New state for pet name
  const [editingPetName, setEditingPetName] = useState(false) // New state for pet name editing mode
  const [isLoading, setIsLoading] = useState(true) // Track loading state
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null) // Track selected reward for details
  const [rewardStats, setRewardStats] = useState({
    totalSaved: 0,
    totalRedeemed: 0,
    streak: 0,
  })
  const [showDetails, setShowDetails] = useState(false)
  const [challengesCompleted, setChallengesCompleted] = useState(0)
  
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
    
    // Add the default happy turtle to owned items if not already owned
    setTimeout(() => {
      if (ownedItems.length === 0) {
        // Find the happy turtle (id: 1)
        const defaultSkin = petItems.find(item => item.id === "1");
        if (defaultSkin) {
          setOwnedItems([defaultSkin]);
          setEquippedSkin(defaultSkin);
        }
      }
    }, 500);
  }, [])

  // Save data whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveData()
    }
  }, [points, ownedItems, equippedSkin, petHappiness, petName, redeemedVouchers, isLoading])

  // Load data from AsyncStorage - enhanced to ensure persistence of purchases
  const loadSavedData = async () => {
    try {
      const savedPoints = await AsyncStorage.getItem(STORAGE_KEYS.POINTS)
      const savedOwnedItems = await AsyncStorage.getItem(STORAGE_KEYS.OWNED_ITEMS)
      const savedActiveSkin = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SKIN)
      const savedPetName = await AsyncStorage.getItem(STORAGE_KEYS.PET_NAME)
      const savedHappiness = await AsyncStorage.getItem(STORAGE_KEYS.HAPPINESS)
      const savedVouchers = await AsyncStorage.getItem(STORAGE_KEYS.VOUCHERS)
      // Add explicit loading of purchased rewards
      const savedRewards = await AsyncStorage.getItem(STORAGE_KEYS.PURCHASED_REWARDS)

      if (savedPoints) setPoints(parseInt(savedPoints))
      if (savedOwnedItems) setOwnedItems(JSON.parse(savedOwnedItems))
      if (savedActiveSkin) {
        const skin = JSON.parse(savedActiveSkin)
        setEquippedSkin(skin)
      } else {
        // If no skin is equipped, use the default happy turtle
        const defaultSkin = petItems.find(item => item.id === "1")
        if (defaultSkin) {
          setEquippedSkin(defaultSkin)
        }
      }
      if (savedPetName) setPetName(savedPetName)
      if (savedHappiness) setPetHappiness(parseInt(savedHappiness))
      if (savedVouchers) setRedeemedVouchers(JSON.parse(savedVouchers))
      
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Save data to AsyncStorage - enhanced to ensure persistence of purchases
  const saveData = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.POINTS, points.toString())
      await AsyncStorage.setItem(STORAGE_KEYS.OWNED_ITEMS, JSON.stringify(ownedItems))
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SKIN, JSON.stringify(equippedSkin))
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

  // Financial achievements - updated with more frequent and higher value rewards
  useEffect(() => {
    const interval = setInterval(() => {
      const randomChance = Math.random()
      
      // Increased chance (from 0.3 to 0.5) and more points
      if (randomChance > 0.5) {
        const pointsEarned = Math.floor(Math.random() * 100) + 25; // 25-125 points
        
        // List of financial achievement messages
        const achievements = [
          `Budget goal achieved! +${pointsEarned} points`,
          `Savings target met! +${pointsEarned} points`,
          `Investment education completed! +${pointsEarned} points`,
          `Sustainable spending choice! +${pointsEarned} points`,
          `Financial quiz completed! +${pointsEarned} points`,
          `Budget streak maintained! +${pointsEarned} points`,
          `Expense tracking completed! +${pointsEarned} points`,
          `Eco-friendly purchase made! +${pointsEarned} points`,
          `Financial tip read! +${pointsEarned} points`,
          `Money management goal reached! +${pointsEarned} points`,
        ];
        
        // Select random achievement message
        const randomMessage = achievements[Math.floor(Math.random() * achievements.length)];
        
        addPoints(pointsEarned, randomMessage);

        // Increase pet happiness
        setPetHappiness((prev) => Math.min(prev + 5, 100))
      }
    }, 8000) // More frequent: from 15000 to 8000 ms (every 8 seconds)

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

  // Buy item - enhanced to ensure persistence
  const buyItem = (item: PetItem) => {
    if (points >= item.price) {
      const newPoints = points - item.price;
      const newOwnedItems = [...ownedItems, item];
      
      // Update state
      setPoints(newPoints);
      setOwnedItems(newOwnedItems);
      
      // Save to AsyncStorage immediately to ensure persistence
      AsyncStorage.setItem(STORAGE_KEYS.POINTS, newPoints.toString());
      AsyncStorage.setItem(STORAGE_KEYS.OWNED_ITEMS, JSON.stringify(newOwnedItems));
      
      setNotificationMessage(`You bought ${item.name}!`);
      setShowNotification(true);

      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }
  }

  // Equip item - updated to handle single skin selection
  const toggleEquipItem = (item: PetItem) => {
    // If the item is already equipped, do nothing
    if (equippedSkin && equippedSkin.id === item.id) return;
    
    // Equip the new skin
    setEquippedSkin(item);
    
    setNotificationMessage(`${item.name} equipped!`);
    setShowNotification(true);
    
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  }

  // Redeem reward - updated to ensure persistence between sessions
  const redeemReward = (reward: Reward) => {
    if (points >= reward.price) {
      const newPoints = points - reward.price;
      const newRedeemedVouchers = [...redeemedVouchers, {...reward, redeemed: false}];
      
      // Update state
      setPoints(newPoints);
      setRedeemedVouchers(newRedeemedVouchers);
      
      // Save to AsyncStorage immediately to ensure persistence
      AsyncStorage.setItem(STORAGE_KEYS.POINTS, newPoints.toString());
      AsyncStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(newRedeemedVouchers));
      
      setNotificationMessage(`You bought ${reward.name}!`);
      setShowNotification(true);

      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }
  }

  // Generate code and mark voucher as redeemed - enhanced to ensure persistence
  const generateCode = (voucher: Reward) => {
    let voucherCode = "";
    
    // Check if voucher already has a code
    const existingVoucher = redeemedVouchers.find(v => v.id === voucher.id);
    if (existingVoucher && existingVoucher.code) {
      voucherCode = existingVoucher.code;
    } else {
      // Generate a new code
      voucherCode = generateVoucherCode(voucher.partner);
    }
    
    const updatedVouchers = redeemedVouchers.map(v => 
      v.id === voucher.id 
        ? {...v, redeemed: true, code: voucherCode} 
        : v
    );
    
    setRedeemedVouchers(updatedVouchers);
    
    // Save to AsyncStorage immediately to ensure persistence
    AsyncStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(updatedVouchers))
      .catch(error => console.error("Error saving voucher code:", error));

    Alert.alert(
      "Voucher Redeemed!", 
      `Your code: ${voucherCode}\n\nShow this code to redeem your reward at ${voucher.partner}.`,
      [{ text: "OK" }]
    )
  }

  // Remove a redeemed voucher - enhanced to ensure persistence
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
            const updatedVouchers = redeemedVouchers.filter(v => v.id !== voucherId);
            setRedeemedVouchers(updatedVouchers);
            
            // Save to AsyncStorage immediately to ensure persistence
            AsyncStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(updatedVouchers))
              .catch(error => console.error("Error removing voucher:", error));
              
            setNotificationMessage("Voucher removed");
            setShowNotification(true);
            setTimeout(() => {
              setShowNotification(false);
            }, 3000);
          }
        }
      ]
    );
  }

  // Handle pet name edit toggle
  const togglePetNameEdit = () => {
    setEditingPetName(!editingPetName);
  }

  // Helper function to get the correct image based on skin name
  const getTurtleImage = (skinName: string) => {
    switch (skinName) {
      case 'happy.png': return require('../assets/turtle_assets/happy.png');
      case 'back.png': return require('../assets/turtle_assets/back.png');
      case 'bathing.png': return require('../assets/turtle_assets/bathing.png');
      case 'beach.png': return require('../assets/turtle_assets/beach.png');
      case 'birthday.png': return require('../assets/turtle_assets/birthday.png');
      case 'cool.png': return require('../assets/turtle_assets/cool.png');
      case 'laugh.png': return require('../assets/turtle_assets/laugh.png');
      case 'love.png': return require('../assets/turtle_assets/love.png');
      case 'paint.png': return require('../assets/turtle_assets/paint.png');
      case 'pizza.png': return require('../assets/turtle_assets/pizza.png');
      case 'sad.png': return require('../assets/turtle_assets/sad.png');
      case 'walking.png': return require('../assets/turtle_assets/walking.png');
      default: return require('../assets/turtle_assets/happy.png');
    }
  };

  // Calculate stats for rewards whenever redeemedVouchers changes
  useEffect(() => {
    const savedAmount = redeemedVouchers.reduce((sum, voucher) => {
      // Estimate the monetary value of each reward
      const value = voucher.price / 200; // Rough conversion from points to currency
      return sum + value;
    }, 0);
    
    setRewardStats({
      totalSaved: savedAmount,
      totalRedeemed: redeemedVouchers.filter(v => v.redeemed).length,
      streak: Math.min(redeemedVouchers.length, 5), // Cap streak at 5
    });
  }, [redeemedVouchers]);

  // Add additional effect to ensure equipped skin is saved when changed
  useEffect(() => {
    if (!isLoading && equippedSkin) {
      AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SKIN, JSON.stringify(equippedSkin))
        .catch(error => console.error("Error saving equipped skin:", error));
    }
  }, [equippedSkin, isLoading]);

  // Render item in shop
  const renderShopItem = ({ item }: { item: PetItem }) => {
    const isOwned = ownedItems.some((i) => i.id === item.id)

    return (
      <TouchableOpacity
        style={styles.shopItem}
        onPress={() => !isOwned && buyItem(item)}
        disabled={isOwned || points < item.price}
      >
        <ExpoImage 
          source={item.image} 
          style={styles.itemImage} 
          contentFit="cover" 
          cachePolicy="memory-disk" 
        />
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

  // Render owned item - updated to show equipped status for skins
  const renderOwnedItem = ({ item }: { item: PetItem }) => {
    const isEquipped = equippedSkin && equippedSkin.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.ownedItem, isEquipped && styles.equippedItem]}
        onPress={() => toggleEquipItem(item)}
      >
        <ExpoImage 
          source={item.image} 
          style={styles.itemImage} 
          contentFit="cover" 
          cachePolicy="memory-disk" 
        />
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
        onPress={() => {
          if (!isOwned) {
            redeemReward(item)
          } else {
            setSelectedReward(item)
            setShowDetails(true)
          }
        }}
        disabled={points < item.price && !isOwned}
      >
        <ExpoImage 
          source={item.image} 
          style={styles.rewardImage} 
          contentFit="cover" 
          cachePolicy="memory-disk" 
        />
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
            {isOwned ? "Details" : points < item.price ? "Not enough" : `${item.price} pts`}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  // Render redeemed voucher with status and action buttons - Redesigned to be more compact
  const renderRedeemedVoucher = ({ item }: { item: Reward }) => {
    return (
      <TouchableOpacity 
        style={styles.voucherCard}
        onPress={() => {
          setSelectedReward(item)
          setShowDetails(true)
        }}
      >
        <ExpoImage 
          source={item.image} 
          style={styles.voucherImage} 
          contentFit="cover" 
          cachePolicy="memory-disk" 
        />
        
        <View style={styles.voucherContent}>
          <Text style={styles.voucherName}>{item.name}</Text>
          <Text style={styles.voucherPartner}>{item.partner}</Text>
          
          {item.redeemed && item.code ? (
            <View style={styles.voucherCodePill}>
              <Text style={styles.voucherCodeText}>{item.code}</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.getCodeButton} 
              onPress={(e) => {
                e.stopPropagation();
                generateCode(item);
              }}
            >
              <Text style={styles.getCodeButtonText}>Get Code</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.voucherStatus}>
          {item.redeemed ? (
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#015F45" />
              <Text style={styles.statusText}>Redeemed</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          )}
        </View>
      </TouchableOpacity>
    )
  }

  // Render reward statistics component
  const renderRewardStats = () => {
    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Your Reward Progress</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>£{rewardStats.totalSaved.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Saved</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rewardStats.totalRedeemed}</Text>
            <Text style={styles.statLabel}>Redeemed</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rewardStats.streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>
        
        <View style={styles.streakProgressContainer}>
          <Text style={styles.streakLabel}>Savings Streak</Text>
          <View style={styles.streakDots}>
            {[1, 2, 3, 4, 5].map((dot) => (
              <View 
                key={dot} 
                style={[
                  styles.streakDot,
                  dot <= rewardStats.streak ? styles.streakDotActive : {}
                ]} 
              />
            ))}
          </View>
          <Text style={styles.streakHint}>
            {rewardStats.streak >= 5 
              ? "Maximum streak achieved! Great job!" 
              : `${5 - rewardStats.streak} more to reach maximum streak bonus`}
          </Text>
        </View>
      </View>
    );
  };

  // Render financial challenges
  const renderFinancialChallenges = () => {
    const challenges = [
      { id: "1", title: "Save £5 this week", completed: true },
      { id: "2", title: "Complete your budget tracker", completed: true },
      { id: "3", title: "Avoid impulse purchases for 3 days", completed: false },
    ];

    return (
      <View style={styles.challengesContainer}>
        <View style={styles.challengesHeader}>
          <Text style={styles.challengesTitle}>Financial Challenges</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {challenges.map((challenge) => (
          <View key={challenge.id} style={styles.challengeItem}>
            <View style={styles.challengeCheckbox}>
              {challenge.completed ? (
                <Ionicons name="checkmark-circle" size={24} color="#015F45" />
              ) : (
                <Ionicons name="ellipse-outline" size={24} color="#64748b" />
              )}
            </View>
            <Text style={[
              styles.challengeTitle,
              challenge.completed ? styles.challengeCompleted : {}
            ]}>
              {challenge.title}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Voucher detail modal
  const renderVoucherDetailModal = () => {
    if (!selectedReward) return null;
    
    return (
      <Modal
        visible={showDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.detailModalContainer}>
          <View style={styles.detailModalContent}>
            <View style={styles.detailModalHeader}>
              <TouchableOpacity 
                style={styles.closeDetailButton} 
                onPress={() => setShowDetails(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ExpoImage 
              source={selectedReward.image} 
              style={styles.detailImage} 
              contentFit="cover" 
              cachePolicy="memory-disk" 
            />
            
            <Text style={styles.detailTitle}>{selectedReward.name}</Text>
            <Text style={styles.detailPartner}>{selectedReward.partner}</Text>
            <Text style={styles.detailDescription}>{selectedReward.description}</Text>
            
            {selectedReward.code ? (
              <View style={styles.detailCodeContainer}>
                <Text style={styles.detailCodeLabel}>Redemption Code</Text>
                <Text style={styles.detailCode}>{selectedReward.code}</Text>
                <Text style={styles.detailInstructions}>
                  Show this code at {selectedReward.partner} to redeem your reward.
                </Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.detailGetCodeButton}
                onPress={() => {
                  generateCode(selectedReward);
                }}
              >
                <Text style={styles.detailGetCodeText}>Get Redemption Code</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => {
                removeVoucher(selectedReward.id);
                setShowDetails(false);
              }}
            >
              <Text style={styles.removeButtonText}>Remove Voucher</Text>
            </TouchableOpacity>
            
            <View style={styles.rewardBenefitContainer}>
              <Text style={styles.rewardBenefitTitle}>Financial Benefits</Text>
              <Text style={styles.rewardBenefitText}>
                This reward is worth approximately £{(selectedReward.price / 200).toFixed(2)} and was earned through your good financial habits!
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render the Voucher Shop Modal with improved UI - removed Financial Challenges from My Vouchers tab
  const renderVoucherShopModal = () => {
    return (
      <Modal
        visible={showVoucherShop}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVoucherShop(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rewards</Text>
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
                <Text style={[styles.tabText, activeRewardShopTab === "shop" && styles.activeTabText]}>Rewards Shop</Text>
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
              <ScrollView style={styles.vouchersScrollView}>
                {redeemedVouchers.length > 0 ? (
                  <View style={styles.vouchersListContainer}>
                    {/* Removed redundant "Your Vouchers" title */}
                    {redeemedVouchers.map(voucher => (
                      <View key={voucher.id + "-redeemed"}>
                        {renderRedeemedVoucher({item: voucher})}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyVouchersContainer}>
                    <Ionicons name="ticket-outline" size={60} color="#8fbda8" />
                    <Text style={styles.emptyVouchersText}>You haven't purchased any vouchers yet.</Text>
                    <Text style={styles.emptyVouchersSubtext}>Earn points through good financial habits!</Text>
                  </View>
                )}
                {/* Removed Financial Challenges section from here since it's already on the main page */}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // Render friend - FIX: Ensuring each item has a unique key
  const renderFriend = ({ item, index }: { item: Friend; index: number }) => {
    return (
      <View style={styles.friendItem}>
        <Text style={styles.friendRank}>#{index + 1}</Text>
        <ExpoImage 
          source={{ uri: item.petImage }} 
          style={styles.friendPetImage} 
          contentFit="cover" 
          cachePolicy="memory-disk" 
        />
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

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
              {/* Replace Image with ExpoImage */}
              <ExpoImage
                source={
                  equippedSkin 
                    ? getTurtleImage(equippedSkin.skinImage)
                    : require('../assets/turtle_assets/happy.png')
                }
                style={styles.petImage}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
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
        
        {/* Reward Progress - Moved from modal to main page */}
        <View style={[styles.statsContainer, styles.mainPageCard]}>
          <Text style={styles.statsTitle}>Your Reward Progress</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>£{rewardStats.totalSaved.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Saved</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rewardStats.totalRedeemed}</Text>
              <Text style={styles.statLabel}>Redeemed</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rewardStats.streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
          
          <View style={styles.streakProgressContainer}>
            <Text style={styles.streakLabel}>Savings Streak</Text>
            <View style={styles.streakDots}>
              {[1, 2, 3, 4, 5].map((dot) => (
                <View 
                  key={dot} 
                  style={[
                    styles.streakDot,
                    dot <= rewardStats.streak ? styles.streakDotActive : {}
                  ]} 
                />
              ))}
            </View>
            <Text style={styles.streakHint}>
              {rewardStats.streak >= 5 
                ? "Maximum streak achieved! Great job!" 
                : `${5 - rewardStats.streak} more to reach maximum streak bonus`}
            </Text>
          </View>
        </View>
        
        {/* Financial Challenges - Moved from modal to main page */}
        <View style={[styles.challengesContainer, styles.mainPageCard]}>
          <View style={styles.challengesHeader}>
            <Text style={styles.challengesTitle}>Financial Challenges</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {[
            { id: "1", title: "Save £5 this week", completed: true },
            { id: "2", title: "Complete your budget tracker", completed: true },
            { id: "3", title: "Avoid impulse purchases for 3 days", completed: false },
          ].map((challenge) => (
            <View key={challenge.id} style={styles.challengeItem}>
              <View style={styles.challengeCheckbox}>
                {challenge.completed ? (
                  <Ionicons name="checkmark-circle" size={24} color="#015F45" />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color="#64748b" />
                )}
              </View>
              <Text style={[
                styles.challengeTitle,
                challenge.completed ? styles.challengeCompleted : {}
              ]}>
                {challenge.title}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

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

      {/* Voucher Shop Modal - Updated with improved UI */}
      {renderVoucherShopModal()}

      {/* Voucher Detail Modal */}
      {renderVoucherDetailModal()}

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
                { id: "sarah", name: "Sarah", points: 1250, petImage: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=250&h=250&fit=crop&crop=faces", petItems: ["1", "3"] },
                { id: "user", name: user.firstName, points: points, petImage: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=250&h=250&fit=crop", petItems: [] },
                { id: "emma", name: "Emma", points: 1500, petImage: "https://images.unsplash.com/photo-1518155317743-a8ff43ea6a5f?w=250&h=250&fit=crop", petItems: ["5", "4"] },
                { id: "john", name: "John", points: 750, petImage: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=250&h=250&fit=crop&crop=faces", petItems: ["1", "6"] }
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
    borderWidth: 0,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 0,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 0,
  },
  equippedItem: {
    shadowColor: "#015F45",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 0,
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
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: "#015F45",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: "#f3fee8",
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
    borderWidth: 0,
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
  
  // Updated voucher card styles - more compact, no borders
  voucherCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  voucherImage: {
    width: 45,
    height: 45,
    borderRadius: 8,
  },
  voucherContent: {
    flex: 1,
    marginLeft: 12,
  },
  voucherName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
  },
  voucherPartner: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 8,
  },
  voucherCodePill: {
    backgroundColor: "#eef2ff",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  voucherCodeText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#4f46e5",
    fontWeight: "600",
  },
  voucherStatus: {
    paddingLeft: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    color: "#015F45",
    marginLeft: 4,
  },
  getCodeButton: {
    backgroundColor: "#015F45",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  getCodeButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  
  // Scrollable vouchers view
  vouchersScrollView: {
    flex: 1,
  },
  vouchersListContainer: {
    padding: 4,
  },
  vouchersSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
    marginTop: 12,
  },
  emptyVouchersContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyVouchersText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginTop: 16,
  },
  emptyVouchersSubtext: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
  },
  
  // Stats container styles
  statsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#015F45",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  streakProgressContainer: {
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 8,
  },
  streakDots: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  streakDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#d1d5db",
  },
  streakDotActive: {
    backgroundColor: "#015F45",
  },
  streakHint: {
    fontSize: 12,
    color: "#64748b",
    fontStyle: "italic",
  },
  
  // Financial challenges styles
  challengesContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  challengesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  challengesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  viewAllText: {
    fontSize: 14,
    color: "#015F45",
    fontWeight: "500",
  },
  challengeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f6",
  },
  challengeCheckbox: {
    marginRight: 12,
  },
  challengeTitle: {
    fontSize: 14,
    color: "#333333",
  },
  challengeCompleted: {
    textDecorationLine: "line-through",
    color: "#64748b",
  },
  
  // Voucher detail modal styles
  detailModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  detailModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  detailModalHeader: {
    alignItems: "flex-end",
  },
  closeDetailButton: {
    padding: 4,
  },
  detailImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignSelf: "center",
    marginVertical: 16,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
  },
  detailPartner: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
  },
  detailDescription: {
    fontSize: 15,
    color: "#333333",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 22,
  },
  detailCodeContainer: {
    backgroundColor: "#f3fee8",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    alignItems: "center",
  },
  detailCodeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 8,
  },
  detailCode: {
    fontSize: 24,
    fontFamily: "monospace",
    letterSpacing: 2,
    fontWeight: "700",
    color: "#015F45",
    marginBottom: 12,
  },
  detailInstructions: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
  },
  detailGetCodeButton: {
    backgroundColor: "#015F45",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "center",
    marginTop: 24,
  },
  detailGetCodeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  removeButton: {
    paddingVertical: 12,
    alignSelf: "center",
    marginTop: 20,
  },
  removeButtonText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "500",
  },
  rewardBenefitContainer: {
    backgroundColor: "#f3fee8",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  rewardBenefitTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  rewardBenefitText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  
  // New style for main page cards
  mainPageCard: {
    marginTop: 16,
    marginHorizontal: 0,
  },
})

export default VirtualPetBanking
