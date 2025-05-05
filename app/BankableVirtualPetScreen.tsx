import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Animated, Dimensions, TextInput, Alert, ScrollView, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Image as ExpoImage } from "expo-image"
import { Ionicons } from "@expo/vector-icons"

// --- Types ---

/** Defines the structure for a pet skin item available in the shop or inventory. */
type PetItem = {
  id: string
  name: string
  price: number
  image: any // Source for the preview image in the shop/inventory
  skinImage: string  // Filename of the turtle skin image in assets
  type: "skin"        // Type is always 'skin' now
  equipped?: boolean // Optional flag if the item is currently equipped (used in owned items list)
}

/** Defines the structure for a friend's data displayed on the leaderboard. */
type Friend = {
  id: string
  name: string
  points: number
  petImage: string // Filename of the friend's equipped pet skin
  petItems: string[] // IDs of items the friend owns (currently unused visually)
}

/** Defines the structure for a reward voucher available in the shop or redeemed list. */
type Reward = {
  id: string
  name: string
  description: string
  price: number // Cost in points
  image: any // Source for the partner logo/reward image
  partner: string // Name of the partner brand
  redeemed?: boolean // Flag indicating if the voucher code has been generated/viewed
  code?: string // The generated voucher code
}

// --- Constants ---

/** Keys used for storing game data in AsyncStorage. */
const STORAGE_KEYS = {
  POINTS: 'bankable_points',
  OWNED_ITEMS: 'bankable_owned_items', // Stores owned PetItem objects
  EQUIPPED_ITEMS: 'bankable_equipped_items', // Legacy, potentially removable, use ACTIVE_SKIN
  PET_NAME: 'bankable_pet_name',
  HAPPINESS: 'bankable_pet_happiness',
  VOUCHERS: 'bankable_vouchers', // Stores redeemed Reward objects
  ACTIVE_SKIN: 'bankable_active_skin',  // Stores the currently equipped PetItem object
  PURCHASED_REWARDS: 'bankable_purchased_rewards' // Stores purchased Reward objects (might be redundant with VOUCHERS)
}

/** Static data for available pet skins in the shop. */
const petItems: PetItem[] = [
  // ... (skin definitions remain the same) ...
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

/** Static data for available reward vouchers in the shop. */
const rewards: Reward[] = [
  // ... (reward definitions remain the same) ...
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

/** Static data for friends displayed on the leaderboard. */
const friends: Friend[] = [
  // ... (friend definitions remain the same) ...
  {
    id: "1",
    name: "Sarah",
    points: 1250,
    petImage: "love.png", // Use skin name
    petItems: ["1", "3"],
  },
  {
    id: "2",
    name: "Mike",
    points: 980,
    petImage: "cool.png", // Use skin name
    petItems: ["2", "6"],
  },
  {
    id: "3",
    name: "Emma",
    points: 1500,
    petImage: "birthday.png", // Use skin name
    petItems: ["5", "4"],
  },
  {
    id: "4",
    name: "John",
    points: 750,
    petImage: "walking.png", // Use skin name
    petItems: ["1", "6"],
  },
  {
    id: "5",
    name: "Chloe",
    points: 1100,
    petImage: "paint.png", // Use skin name
    petItems: ["9", "1"],
  },
  {
    id: "6",
    name: "David",
    points: 600,
    petImage: "sad.png", // Use skin name
    petItems: ["11"],
  },
  {
    id: "7",
    name: "Liam",
    points: 1350,
    petImage: "pizza.png", // Use skin name
    petItems: ["10", "2"],
  },
  {
    id: "8",
    name: "Olivia",
    points: 880,
    petImage: "bathing.png", // Use skin name
    petItems: ["3", "7"],
  },
  {
    id: "9",
    name: "Noah",
    points: 1050,
    petImage: "beach.png", // Use skin name
    petItems: ["4", "8"],
  },
]

/**
 * Bankable Virtual Pet Screen Component.
 * Features a virtual pet (turtle) that users can customize and interact with.
 * Users earn points through simulated financial activities (random events).
 * Points can be spent on pet skins or redeemed for real-world reward vouchers.
 * Includes a shop for skins, a shop for vouchers, an inventory, a leaderboard,
 * and pet happiness/naming features.
 * Persists game state using AsyncStorage.
 */
const VirtualPetBanking: React.FC = () => {
  // --- State Variables ---
  const [points, setPoints] = useState(5000) // User's current point balance
  const [showItemShop, setShowItemShop] = useState(false) // Visibility state for the skin shop modal
  const [showVoucherShop, setShowVoucherShop] = useState(false) // Visibility state for the voucher shop modal
  const [showLeaderboard, setShowLeaderboard] = useState(false) // Visibility state for the leaderboard modal
  const [ownedItems, setOwnedItems] = useState<PetItem[]>([]) // Array of pet skins the user owns
  const [equippedSkin, setEquippedSkin] = useState<PetItem | null>(null) // The currently equipped pet skin
  const [petHappiness, setPetHappiness] = useState(70) // Pet's happiness level (0-100)
  const [showNotification, setShowNotification] = useState(false) // Visibility state for temporary notifications
  const [notificationMessage, setNotificationMessage] = useState("") // Text content for notifications
  const [activeItemShopTab, setActiveItemShopTab] = useState("shop") // Active tab in the skin shop modal ('shop' or 'inventory')
  const [activeRewardShopTab, setActiveRewardShopTab] = useState("shop") // Active tab in the voucher shop modal ('shop' or 'my_vouchers')
  const [redeemedVouchers, setRedeemedVouchers] = useState<Reward[]>([]) // Array of reward vouchers the user has purchased
  const [petName, setPetName] = useState("My Turtle") // The user-defined name for the pet
  const [editingPetName, setEditingPetName] = useState(false) // State to control pet name editing mode
  const [isLoading, setIsLoading] = useState(true) // Tracks if initial data is loading from AsyncStorage
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null) // Tracks the reward selected for viewing details
  const [rewardStats, setRewardStats] = useState({ // Calculated statistics about reward redemption
    totalSaved: 0, // Estimated monetary value saved
    totalRedeemed: 0, // Count of vouchers marked as redeemed
    streak: 0, // Current savings streak (capped)
  })
  const [showDetails, setShowDetails] = useState(false) // Visibility state for the voucher details modal
  const [challengesCompleted, setChallengesCompleted] = useState(0) // Mock state for completed challenges (currently unused)

  // Mock user context (replace with actual context if available)
  const user = {
    name: "Oliver Palmer",
    firstName: "Oliver"
  };

  // --- Animations ---
  const bounceAnim = useState(new Animated.Value(0))[0] // Animation value for the pet's bounce effect
  const happinessAnim = useState(new Animated.Value(0))[0] // Animation value for the happiness bar fill

  // --- Effects ---

  // Load saved data from AsyncStorage when the component mounts
  useEffect(() => {
    loadSavedData()
    // Removed problematic timeout that could overwrite saved data on fast re-renders
  }, [])

  // Save current game state to AsyncStorage whenever relevant state variables change
  // This runs only after the initial loading is complete.
  useEffect(() => {
    if (!isLoading) {
      saveData()
    }
  }, [points, ownedItems, equippedSkin, petHappiness, petName, redeemedVouchers, isLoading])

  // Periodically grant random points based on simulated financial achievements
  useEffect(() => {
    const interval = setInterval(() => {
      const randomChance = Math.random()

      // 50% chance to earn points every 8 seconds
      if (randomChance > 0.5) {
        const pointsEarned = Math.floor(Math.random() * 100) + 25; // Earn 25-125 points
        const achievements = [ // Pool of possible achievement messages
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
        const randomMessage = achievements[Math.floor(Math.random() * achievements.length)];

        addPoints(pointsEarned, randomMessage); // Add points and show notification
        setPetHappiness((prev) => Math.min(prev + 5, 100)) // Increase happiness slightly
      }
    }, 8000) // Check every 8 seconds

    return () => clearInterval(interval) // Cleanup interval on unmount
  }, [])

  // Animate the pet bouncing periodically
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 10, duration: 300, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start()
    }, 3000) // Bounce every 3 seconds

    return () => clearInterval(interval) // Cleanup interval on unmount
  }, [])

  // Animate the happiness bar fill level when happiness changes
  useEffect(() => {
    Animated.timing(happinessAnim, {
      toValue: petHappiness / 100, // Target value is the fraction of happiness
      duration: 500,
      useNativeDriver: false, // Width animation requires useNativeDriver: false
    }).start()
  }, [petHappiness])

  // Calculate reward statistics whenever the list of redeemed vouchers changes
  useEffect(() => {
    // Estimate total monetary value saved based on points spent (rough conversion)
    const savedAmount = redeemedVouchers.reduce((sum, voucher) => {
      const value = voucher.price / 200; // Example: 1000 points = £5
      return sum + value;
    }, 0);

    setRewardStats({
      totalSaved: savedAmount,
      totalRedeemed: redeemedVouchers.filter(v => v.redeemed).length, // Count vouchers marked as redeemed
      streak: Math.min(redeemedVouchers.length, 5), // Cap streak at 5 purchases
    });
  }, [redeemedVouchers])

  // Ensure the equipped skin is saved to AsyncStorage whenever it changes
  // This acts as a secondary save mechanism specifically for the active skin.
  useEffect(() => {
    if (!isLoading && equippedSkin) {
      AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SKIN, JSON.stringify(equippedSkin))
        .then(() => console.log(`Active skin saved via effect: ${equippedSkin.name}`))
        .catch(error => console.error("Error saving equipped skin via effect:", error));
    }
  }, [equippedSkin, isLoading])


  // --- Data Persistence Functions ---

  /** Loads game state from AsyncStorage. Handles parsing and setting default values if data is missing or corrupt. */
  const loadSavedData = async () => {
    setIsLoading(true); // Start loading indicator
    try {
      // Load all relevant data items concurrently
      const [
        savedPoints,
        savedOwnedItems,
        savedActiveSkin,
        savedPetName,
        savedHappiness,
        savedVouchers,
        savedRewards // Potentially redundant, consider merging logic with savedVouchers
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.POINTS),
        AsyncStorage.getItem(STORAGE_KEYS.OWNED_ITEMS),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SKIN),
        AsyncStorage.getItem(STORAGE_KEYS.PET_NAME),
        AsyncStorage.getItem(STORAGE_KEYS.HAPPINESS),
        AsyncStorage.getItem(STORAGE_KEYS.VOUCHERS),
        AsyncStorage.getItem(STORAGE_KEYS.PURCHASED_REWARDS)
      ]);

      // Set points or default to 0
      if (savedPoints) setPoints(parseInt(savedPoints, 10));
      else setPoints(0);

      // Load owned items, ensuring default skin exists if none are saved
      let currentOwnedItems: PetItem[] = [];
      if (savedOwnedItems) {
        try {
          currentOwnedItems = JSON.parse(savedOwnedItems);
          setOwnedItems(currentOwnedItems);
        } catch (error) {
          console.error('Error parsing saved owned items:', error);
          currentOwnedItems = []; // Reset if parsing fails
        }
      }
      // Ensure the default item is always owned if no items are loaded
      const defaultSkin = petItems.find(item => item.id === "1");
      if (defaultSkin && !currentOwnedItems.some(item => item.id === "1")) {
        currentOwnedItems.push(defaultSkin);
        setOwnedItems([...currentOwnedItems]); // Update state
        // Save immediately if default was added
        AsyncStorage.setItem(STORAGE_KEYS.OWNED_ITEMS, JSON.stringify(currentOwnedItems))
          .catch(e => console.error("Error saving default owned item:", e));
        console.log('Default skin added to owned items as it was missing.');
      }


      // Load active skin, falling back to default if needed
      if (savedActiveSkin) {
        try {
          const skin = JSON.parse(savedActiveSkin);
          // Validate if the loaded skin is actually owned
          if (currentOwnedItems.some(item => item.id === skin.id)) {
            setEquippedSkin(skin);
          } else {
            console.warn('Saved active skin is not owned, reverting to default.');
            setDefaultSkin(currentOwnedItems); // Pass current owned items
          }
        } catch (error) {
          console.error('Error parsing saved active skin:', error);
          setDefaultSkin(currentOwnedItems); // Pass current owned items
        }
      } else {
        setDefaultSkin(currentOwnedItems); // Pass current owned items
      }

      // Load pet name or use default
      if (savedPetName) setPetName(savedPetName);
      else setPetName("My Turtle");

      // Load happiness or default to 70
      if (savedHappiness) setPetHappiness(parseInt(savedHappiness, 10));
      else setPetHappiness(70);

      // Load redeemed vouchers
      if (savedVouchers) {
        try {
          const parsedVouchers = JSON.parse(savedVouchers);
          setRedeemedVouchers(parsedVouchers);
        } catch (error) {
          console.error('Error parsing saved vouchers:', error);
          setRedeemedVouchers([]);
        }
      } else {
        setRedeemedVouchers([]);
      }

      // Handle savedRewards (consider merging with savedVouchers logic)
      if (savedRewards) {
        try {
          const parsedRewards = JSON.parse(savedRewards);
          // Example: Merge if necessary, ensuring no duplicates
          // const combinedVouchers = [...new Map([...redeemedVouchers, ...parsedRewards].map(item => [item.id, item])).values()];
          // setRedeemedVouchers(combinedVouchers);
        } catch (error) {
          console.error('Error parsing saved rewards:', error);
        }
      }

    } catch (error) {
      console.error("Error loading data from AsyncStorage:", error)
      // Set defaults in case of catastrophic failure
      setPoints(0);
      setOwnedItems(petItems.filter(item => item.id === "1")); // Only default item
      setDefaultSkin(petItems.filter(item => item.id === "1")); // Set default skin
      setPetName("My Turtle");
      setPetHappiness(70);
      setRedeemedVouchers([]);
    } finally {
      setIsLoading(false) // Stop loading indicator
    }
  }

  /** Sets the default 'Happy Turtle' skin as the equipped skin. Ensures the default skin is owned first. */
  const setDefaultSkin = (currentOwnedItems: PetItem[]) => {
    const defaultSkin = petItems.find(item => item.id === "1");
    if (defaultSkin) {
      // Ensure the default skin is actually in the owned list before equipping
      if (currentOwnedItems.some(item => item.id === "1")) {
        setEquippedSkin(defaultSkin);
        // Save this default choice to AsyncStorage
        AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SKIN, JSON.stringify(defaultSkin))
          .catch(error => console.error("Error saving default skin:", error));
        console.log('Default skin set as active skin.');
      } else {
        console.error("Attempted to set default skin, but it wasn't found in owned items.");
        // Handle this case, maybe add it to owned items first?
      }
    } else {
      console.error("Default skin (ID 1) not found in petItems data.");
    }
  }


  /** Saves the current game state (points, items, skin, name, happiness, vouchers) to AsyncStorage. */
  const saveData = async () => {
    try {
      // Use Promise.all for concurrent saving
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.POINTS, points.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.OWNED_ITEMS, JSON.stringify(ownedItems)),
        AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SKIN, JSON.stringify(equippedSkin)), // Save the equipped skin object
        AsyncStorage.setItem(STORAGE_KEYS.PET_NAME, petName),
        AsyncStorage.setItem(STORAGE_KEYS.HAPPINESS, petHappiness.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(redeemedVouchers)),
        // Consider if STORAGE_KEYS.PURCHASED_REWARDS needs separate saving or can be derived/merged
      ]);
      // console.log("Game data saved successfully."); // Optional: log success
    } catch (error) {
      console.error("Error saving data to AsyncStorage:", error)
    }
  }

  // --- Game Logic Functions ---

  /** Generates a pseudo-random voucher code string. */
  const generateVoucherCode = (partner: string) => {
    // ... (implementation remains the same) ...
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = partner.substring(0, 3).toUpperCase() + '-'
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /** Increases the user's points and displays a temporary notification. */
  const addPoints = (amount: number, message: string) => {
    setPoints((prev) => prev + amount)
    setNotificationMessage(message)
    setShowNotification(true)
    // Hide notification after 3 seconds
    setTimeout(() => setShowNotification(false), 3000)
  }

  /** Handles the purchase of a pet skin. Deducts points, adds item to inventory, saves state, and shows notification. */
  const buyItem = (item: PetItem) => {
    if (points >= item.price && !ownedItems.some(owned => owned.id === item.id)) { // Check if already owned
      const newPoints = points - item.price;
      const newOwnedItems = [...ownedItems, item];

      setPoints(newPoints);
      setOwnedItems(newOwnedItems);
      // Note: Saving happens automatically via the useEffect hook watching these state variables.
      // Immediate saving here could be redundant but ensures atomicity for this specific action.
      // Consider if the useEffect approach is sufficient. If keeping immediate save:
      // Promise.all([
      //   AsyncStorage.setItem(STORAGE_KEYS.POINTS, newPoints.toString()),
      //   AsyncStorage.setItem(STORAGE_KEYS.OWNED_ITEMS, JSON.stringify(newOwnedItems))
      // ]).catch(error => console.error("Error saving after buying item:", error));

      console.log(`Item purchased: ${item.name}`);
      setNotificationMessage(`You bought ${item.name}!`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } else if (ownedItems.some(owned => owned.id === item.id)) {
      console.log(`Item already owned: ${item.name}`);
      // Optionally show a notification that it's already owned
    } else {
      console.log(`Not enough points to buy: ${item.name}`);
      // Optionally show a notification about insufficient points
    }
  }


  /** Equips a selected pet skin. Updates the equippedSkin state, saves, and shows notification. */
  const toggleEquipItem = (item: PetItem) => {
    // Only proceed if the item is owned and not already equipped
    if (ownedItems.some(owned => owned.id === item.id) && equippedSkin?.id !== item.id) {
      setEquippedSkin(item);
      // Note: Saving happens automatically via the useEffect hook.
      // Immediate save:
      // AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SKIN, JSON.stringify(item))
      //   .then(() => console.log(`Item equipped and saved: ${item.name}`))
      //   .catch(error => console.error("Error saving equipped skin:", error));

      console.log(`Item equipped: ${item.name}`);
      setNotificationMessage(`${item.name} equipped!`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } else if (equippedSkin?.id === item.id) {
      console.log(`Item already equipped: ${item.name}`);
    } else {
      console.warn(`Attempted to equip unowned item: ${item.name}`);
    }
  }


  /** Handles the purchase of a reward voucher. Deducts points, adds voucher to list, saves, and shows notification. */
  const redeemReward = (reward: Reward) => {
    if (points >= reward.price && !redeemedVouchers.some(v => v.id === reward.id)) { // Check if already purchased
      const newPoints = points - reward.price;
      // Add the new voucher, ensuring it's marked as not redeemed initially
      const newRedeemedVouchers = [...redeemedVouchers, { ...reward, redeemed: false, code: undefined }];

      setPoints(newPoints);
      setRedeemedVouchers(newRedeemedVouchers);
      // Note: Saving happens automatically via the useEffect hook.
      // Immediate save:
      // Promise.all([
      //   AsyncStorage.setItem(STORAGE_KEYS.POINTS, newPoints.toString()),
      //   AsyncStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(newRedeemedVouchers)),
      //   // Consider if PURCHASED_REWARDS needs updating here too
      // ]).catch(error => console.error("Error saving after redeeming reward:", error));

      console.log(`Reward purchased: ${reward.name}`);
      setNotificationMessage(`You bought ${reward.name}!`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } else if (redeemedVouchers.some(v => v.id === reward.id)) {
      console.log(`Reward already purchased: ${reward.name}`);
      // Open details modal instead?
      setSelectedReward(reward);
      setShowDetails(true);
    } else {
      console.log(`Not enough points for reward: ${reward.name}`);
    }
  }


  /** Generates a code for a purchased voucher, marks it as redeemed, saves state, and shows an alert with the code. */
  const generateCode = (voucher: Reward) => {
    const existingVoucherIndex = redeemedVouchers.findIndex(v => v.id === voucher.id);
    if (existingVoucherIndex === -1) {
      console.error("Cannot generate code for a voucher not owned.");
      return;
    }

    const existingVoucher = redeemedVouchers[existingVoucherIndex];

    // Only generate a new code if one doesn't exist or it's not marked as redeemed yet
    let voucherCode = existingVoucher.code;
    let needsUpdate = false;
    if (!voucherCode || !existingVoucher.redeemed) {
      voucherCode = generateVoucherCode(voucher.partner);
      needsUpdate = true;
    }

    if (needsUpdate) {
      const updatedVouchers = [...redeemedVouchers];
      updatedVouchers[existingVoucherIndex] = { ...existingVoucher, redeemed: true, code: voucherCode };

      setRedeemedVouchers(updatedVouchers);
      // Note: Saving happens automatically via the useEffect hook.
      // AsyncStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(updatedVouchers))
      //   .catch(error => console.error("Error saving voucher code:", error));
      console.log(`Generated code for voucher: ${voucher.name}`);
    } else {
      console.log(`Code already generated for voucher: ${voucher.name}`);
    }


    // Show the alert with the code
    Alert.alert(
      "Voucher Redeemed!",
      `Your code: ${voucherCode}\n\nShow this code to redeem your reward at ${voucher.partner}.`,
      [{ text: "OK" }]
    )
  }


  /** Removes a purchased voucher from the user's list after confirmation. Saves state and shows notification. */
  const removeVoucher = (voucherId: string) => {
    Alert.alert(
      "Remove Voucher",
      "Are you sure you want to remove this voucher? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const updatedVouchers = redeemedVouchers.filter(v => v.id !== voucherId);
            setRedeemedVouchers(updatedVouchers);
            // Note: Saving happens automatically via the useEffect hook.
            // AsyncStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(updatedVouchers))
            //   .catch(error => console.error("Error removing voucher:", error));

            console.log(`Voucher removed: ${voucherId}`);
            setNotificationMessage("Voucher removed");
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
          }
        }
      ]
    );
  }


  /** Toggles the pet name editing mode. Saves the name to AsyncStorage when exiting edit mode. */
  const togglePetNameEdit = () => {
    if (editingPetName) {
      // Save the potentially changed name when finishing editing
      AsyncStorage.setItem(STORAGE_KEYS.PET_NAME, petName)
        .then(() => console.log(`Pet name saved: ${petName}`))
        .catch(error => console.error("Error saving pet name:", error));
    }
    setEditingPetName(!editingPetName); // Toggle the editing state
  }

  // --- Helper Functions ---

  /** Returns the correct local image source based on the skin filename. */
  const getTurtleImage = (skinName: string | undefined) => {
    if (!skinName) return require('../assets/turtle_assets/happy.png'); // Default if undefined

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
      default:
        console.warn(`Unknown skin name: ${skinName}, using default.`);
        return require('../assets/turtle_assets/happy.png'); // Fallback to default
    }
  };

  // --- Render Functions ---

  /** Renders a single item in the skin shop list. */
  const renderShopItem = ({ item }: { item: PetItem }) => {
    const isOwned = ownedItems.some((i) => i.id === item.id)
    const canAfford = points >= item.price

    return (
      <TouchableOpacity
        style={styles.shopItem}
        onPress={() => !isOwned && buyItem(item)} // Buy only if not owned
        disabled={isOwned || !canAfford} // Disable if owned or cannot afford
      >
        <ExpoImage
          source={item.image} // Preview image
          style={styles.itemImage}
          contentFit="contain" // Use contain to avoid cropping
          cachePolicy="memory-disk"
        />
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemPrice}>{isOwned ? "Owned" : `${item.price} pts`}</Text>
        <LinearGradient
          // Button color depends on owned/affordability status
          colors={isOwned || !canAfford ? ["#a0aec0", "#a0aec0"] : ["#015F45", "#017a5a"]}
          style={styles.buyButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.buyButtonText}>
            {isOwned ? "Owned" : canAfford ? "Buy" : "Not enough"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  /** Renders a single item in the user's owned skins inventory. */
  const renderOwnedItem = ({ item }: { item: PetItem }) => {
    const isEquipped = equippedSkin?.id === item.id; // Check if this skin is the currently equipped one

    return (
      <TouchableOpacity
        style={[styles.ownedItem, isEquipped && styles.equippedItem]} // Highlight if equipped
        onPress={() => toggleEquipItem(item)} // Equip this item on press
      >
        <ExpoImage
          source={item.image} // Preview image
          style={styles.itemImage}
          contentFit="contain" // Use contain
          cachePolicy="memory-disk"
        />
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.equippedText}>{isEquipped ? "Equipped" : "Tap to equip"}</Text>
      </TouchableOpacity>
    )
  }

  /** Renders a single reward voucher in the voucher shop list. */
  const renderReward = ({ item }: { item: Reward }) => {
    const isOwned = redeemedVouchers.some(v => v.id === item.id) // Check if already purchased
    const canAfford = points >= item.price

    return (
      <TouchableOpacity
        style={styles.rewardItem}
        onPress={() => {
          if (!isOwned) {
            redeemReward(item) // Purchase if not owned
          } else {
            setSelectedReward(item) // Show details if owned
            setShowDetails(true)
          }
        }}
        disabled={!isOwned && !canAfford} // Disable purchase if cannot afford
      >
        <ExpoImage
          source={item.image} // Partner logo/image
          style={styles.rewardImage}
          contentFit="contain" // Use contain
          cachePolicy="memory-disk"
        />
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardName}>{item.name}</Text>
          <Text style={styles.rewardPartner}>{item.partner}</Text>
          <Text style={styles.rewardDescription} numberOfLines={2}>{item.description}</Text>
        </View>
        <LinearGradient
          // Button color depends on owned/affordability status
          colors={isOwned || !canAfford ? ["#a0aec0", "#a0aec0"] : ["#015F45", "#017a5a"]}
          style={styles.redeemButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.redeemButtonText}>
            {isOwned ? "Details" : canAfford ? `${item.price} pts` : "Not enough"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  /** Renders a single purchased voucher in the 'My Vouchers' list. */
  const renderRedeemedVoucher = ({ item }: { item: Reward }) => {
    return (
      <TouchableOpacity
        style={styles.voucherCard}
        onPress={() => { // Open details modal on press
          setSelectedReward(item)
          setShowDetails(true)
        }}
      >
        <ExpoImage
          source={item.image} // Partner logo/image
          style={styles.voucherImage}
          contentFit="contain" // Use contain
          cachePolicy="memory-disk"
        />

        <View style={styles.voucherContent}>
          <Text style={styles.voucherName}>{item.name}</Text>
          <Text style={styles.voucherPartner}>{item.partner}</Text>

          {/* Show code pill if redeemed, otherwise show 'Get Code' button */}
          {item.redeemed && item.code ? (
            <View style={styles.voucherCodePill}>
              <Text style={styles.voucherCodeText}>{item.code}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.getCodeButton}
              onPress={(e) => {
                e.stopPropagation(); // Prevent triggering the card's onPress
                generateCode(item); // Generate/show code
              }}
            >
              <Text style={styles.getCodeButtonText}>Get Code</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Show status indicator (checkmark or chevron) */}
        <View style={styles.voucherStatus}>
          {item.redeemed ? (
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#015F45" />
              <Text style={styles.statusText}>Redeemed</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#64748b" /> // Indicates clickable for details/code
          )}
        </View>
      </TouchableOpacity>
    )
  }

  /** Renders the statistics section (total saved, redeemed count, streak). */
  const renderRewardStats = () => {
    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Your Reward Progress</Text>

        {/* Row displaying key stats */}
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

        {/* Streak progress indicator */}
        <View style={styles.streakProgressContainer}>
          <Text style={styles.streakLabel}>Savings Streak</Text>
          <View style={styles.streakDots}>
            {[1, 2, 3, 4, 5].map((dot) => (
              <View
                key={dot}
                style={[
                  styles.streakDot,
                  // Fill dot if current streak is >= dot number
                  dot <= rewardStats.streak ? styles.streakDotActive : {}
                ]}
              />
            ))}
          </View>
          <Text style={styles.streakHint}>
            {rewardStats.streak >= 5
              ? "Maximum streak achieved! Great job!"
              : `${5 - rewardStats.streak} more voucher${5 - rewardStats.streak === 1 ? '' : 's'} to reach maximum streak bonus!`}
          </Text>
        </View>
      </View>
    );
  };

  /** Renders the mock financial challenges section. */
  const renderFinancialChallenges = () => {
    // Mock data for challenges
    const challenges = [
      { id: "1", title: "Save £5 this week", completed: true },
      { id: "2", title: "Complete your budget tracker", completed: true },
      { id: "3", title: "Avoid impulse purchases for 3 days", completed: false },
    ];

    return (
      <View style={styles.challengesContainer}>
        <View style={styles.challengesHeader}>
          <Text style={styles.challengesTitle}>Financial Challenges</Text>
          <TouchableOpacity onPress={() => Alert.alert("Challenges", "Challenge feature coming soon!")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* List challenges */}
        {challenges.map((challenge) => (
          <View key={challenge.id} style={styles.challengeItem}>
            <View style={styles.challengeCheckbox}>
              {/* Show checkmark or empty circle based on completion */}
              <Ionicons name={challenge.completed ? "checkmark-circle" : "ellipse-outline"} size={24} color={challenge.completed ? "#015F45" : "#64748b"} />
            </View>
            <Text style={[
              styles.challengeTitle,
              // Apply strikethrough if completed
              challenge.completed ? styles.challengeCompleted : {}
            ]}>
              {challenge.title}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  /** Renders the modal for displaying details of a selected purchased voucher. */
  const renderVoucherDetailModal = () => {
    if (!selectedReward) return null; // Don't render if no reward is selected

    return (
      <Modal
        visible={showDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetails(false)} // Close on back button press (Android)
      >
        <View style={styles.detailModalContainer}>
          {/* Semi-transparent background */}
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowDetails(false)} />

          <View style={styles.detailModalContent}>
            {/* Close button */}
            <View style={styles.detailModalHeader}>
              <TouchableOpacity
                style={styles.closeDetailButton}
                onPress={() => setShowDetails(false)}
              >
                <Ionicons name="close" size={28} color="#4a5568" />
              </TouchableOpacity>
            </View>

            {/* Reward details */}
            <ExpoImage
              source={selectedReward.image}
              style={styles.detailImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
            <Text style={styles.detailTitle}>{selectedReward.name}</Text>
            <Text style={styles.detailPartner}>{selectedReward.partner}</Text>
            <Text style={styles.detailDescription}>{selectedReward.description}</Text>

            {/* Code display or 'Get Code' button */}
            {selectedReward.code ? (
              <View style={styles.detailCodeContainer}>
                <Text style={styles.detailCodeLabel}>Your Code:</Text>
                <Text style={styles.voucherCodeText} selectable={true}>{selectedReward.code}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.detailGetCodeButton}
                onPress={() => {
                  generateCode(selectedReward); // Generate code
                  // Update the selectedReward state locally to show the code immediately
                  setSelectedReward(prev => prev ? { ...prev, code: generateVoucherCode(prev.partner), redeemed: true } : null);
                }}
              >
                <Text style={styles.detailGetCodeButtonText}>Get Code & Redeem</Text>
              </TouchableOpacity>
            )}

            {/* Remove voucher button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => {
                removeVoucher(selectedReward.id); // Trigger removal confirmation
                setShowDetails(false); // Close modal after initiating removal
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#e53e3e" style={{ marginRight: 4 }} />
              <Text style={styles.removeButtonText}>Remove Voucher</Text>
            </TouchableOpacity>

            {/* Mock Financial Benefits Section */}
            <View style={styles.rewardBenefitContainer}>
              <Text style={styles.rewardBenefitTitle}>Financial Benefits</Text>
              <Text style={styles.rewardBenefitText}>- Redeeming this voucher saved you approx. £{(selectedReward.price / 200).toFixed(2)}!</Text>
              <Text style={styles.rewardBenefitText}>- Contributes to your savings streak.</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };


  /** Renders the modal containing the voucher shop and the user's purchased vouchers. */
  const renderVoucherShopModal = () => {
    return (
      <Modal
        visible={showVoucherShop}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVoucherShop(false)}
      >
        <View style={styles.modalContainer}>
          {/* Semi-transparent background */}
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowVoucherShop(false)} />

          <View style={styles.modalContent}>
            {/* Modal Header with Title and Close Button */}
            <View style={styles.modalHeader}>
              <Text style={styles.sectionTitle}>Rewards</Text>
              <TouchableOpacity onPress={() => setShowVoucherShop(false)}>
                <Ionicons name="close-circle" size={28} color="#cbd5e0" />
              </TouchableOpacity>
            </View>

            {/* Tabs for Shop / My Vouchers */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeRewardShopTab === 'shop' && styles.tabButtonActive]}
                onPress={() => setActiveRewardShopTab('shop')}
              >
                <Text style={[styles.tabButtonText, activeRewardShopTab === 'shop' && styles.tabButtonTextActive]}>Shop</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeRewardShopTab === 'my_vouchers' && styles.tabButtonActive]}
                onPress={() => setActiveRewardShopTab('my_vouchers')}
              >
                <Text style={[styles.tabButtonText, activeRewardShopTab === 'my_vouchers' && styles.tabButtonTextActive]}>My Vouchers ({redeemedVouchers.length})</Text>
              </TouchableOpacity>
            </View>

            {/* Content based on active tab */}
            {activeRewardShopTab === "shop" ? (
              // Shop Tab: List of available rewards
              <FlatList
                data={rewards}
                renderItem={renderReward}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 20 }} // Add padding at bottom
                showsVerticalScrollIndicator={false}
              />
            ) : (
              // My Vouchers Tab: Stats, Challenges, and List of purchased vouchers
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {renderRewardStats()}
                {renderFinancialChallenges()}
                {redeemedVouchers.length > 0 ? (
                  <FlatList
                    data={redeemedVouchers}
                    renderItem={renderRedeemedVoucher}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false} // Disable FlatList scrolling within ScrollView
                  />
                ) : (
                  <Text style={styles.emptyVoucherText}>You haven't purchased any vouchers yet. Visit the Shop tab!</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  /** Renders the modal containing the skin shop and the user's owned skins (inventory). */
  const renderItemShopModal = () => {
    return (
      <Modal
        visible={showItemShop}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowItemShop(false)}
      >
        <View style={styles.modalContainer}>
          {/* Semi-transparent background */}
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowItemShop(false)} />

          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.sectionTitle}>Pet Customisation</Text>
              <TouchableOpacity onPress={() => setShowItemShop(false)}>
                <Ionicons name="close-circle" size={28} color="#cbd5e0" />
              </TouchableOpacity>
            </View>

            {/* Tabs for Shop / Inventory */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeItemShopTab === 'shop' && styles.tabButtonActive]}
                onPress={() => setActiveItemShopTab('shop')}
              >
                <Text style={[styles.tabButtonText, activeItemShopTab === 'shop' && styles.tabButtonTextActive]}>Shop</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeItemShopTab === 'inventory' && styles.tabButtonActive]}
                onPress={() => setActiveItemShopTab('inventory')}
              >
                <Text style={[styles.tabButtonText, activeItemShopTab === 'inventory' && styles.tabButtonTextActive]}>Inventory ({ownedItems.length})</Text>
              </TouchableOpacity>
            </View>

            {/* Content based on active tab */}
            {activeItemShopTab === 'shop' ? (
              // Shop Tab: Grid of available skins
              <FlatList
                data={petItems}
                renderItem={renderShopItem}
                keyExtractor={(item) => item.id}
                numColumns={2} // Display in two columns
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              // Inventory Tab: Grid of owned skins
              <FlatList
                data={ownedItems}
                renderItem={renderOwnedItem}
                keyExtractor={(item) => item.id}
                numColumns={2} // Display in two columns
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    );
  };

  /** Renders the modal displaying the friends leaderboard. */
  const renderLeaderboardModal = () => {
    // Sort friends by points descending
    const sortedFriends = [...friends].sort((a, b) => b.points - a.points);

    return (
      <Modal
        visible={showLeaderboard}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLeaderboard(false)}
      >
        <View style={styles.modalContainer}>
          {/* Semi-transparent background */}
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowLeaderboard(false)} />

          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.sectionTitle}>Friends Leaderboard</Text>
              <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
                <Ionicons name="close-circle" size={28} color="#cbd5e0" />
              </TouchableOpacity>
            </View>

            {/* List of friends */}
            <FlatList
              data={sortedFriends}
              renderItem={renderFriend} // Use the corrected renderFriend function
              keyExtractor={(item) => item.id} // Use friend's unique ID
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    );
  };


  /** Renders a single friend item in the leaderboard list. */
  const renderFriend = ({ item, index }: { item: Friend; index: number }) => {
    // Get the correct local image source for the friend's pet skin
    const imageSource = getTurtleImage(item.petImage);

    return (
      <View style={styles.friendItem}>
        {/* Rank */}
        <Text style={styles.friendRankText}>#{index + 1}</Text>
        {/* Pet Image */}
        <ExpoImage
          source={imageSource}
          style={styles.friendPetPreviewImage} // Use a specific style for preview
          contentFit="contain"
          cachePolicy="memory-disk"
        />
        {/* Friend Info */}
        <View style={styles.friendDetails}>
          <Text style={styles.friendNameText}>{item.name}</Text>
          <Text style={styles.friendPointsText}>{item.points} pts</Text>
        </View>
      </View>
    )
  }

  // --- Main Component Return ---

  // Show loading indicator while data is loading from AsyncStorage
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#015F45" />
        <Text style={styles.loadingText}>Loading Pet Data...</Text>
      </View>
    );
  }

  // Main screen layout
  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <Text style={styles.title}>Bankable Pet</Text>
        {/* Points Display */}
        <View style={styles.pointsDisplay}>
          <Ionicons name="star" size={18} color="#f59e0b" style={{ marginRight: 4 }} />
          <Text style={styles.pointsText}>{points}</Text>
        </View>
      </View>

      {/* Scrollable Content Area */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Pet Display Card */}
        <LinearGradient
          colors={["#e0f2fe", "#f0f9ff"]} // Light blue gradient background
          style={styles.petCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Pet Name and Edit Button */}
          <View style={styles.petNameContainer}>
            {editingPetName ? (
              // Input field when editing
              <TextInput
                style={styles.petNameInputStyle} // Use a dedicated style
                value={petName}
                onChangeText={setPetName}
                autoFocus={true}
                onBlur={togglePetNameEdit} // Save on blur
                maxLength={20}
              />
            ) : (
              // Display pet name
              <Text style={styles.petName}>{petName}</Text>
            )}
            {/* Edit/Save Button */}
            <TouchableOpacity onPress={togglePetNameEdit} style={styles.editNameButton}>
              <Ionicons name={editingPetName ? "save-outline" : "pencil-outline"} size={20} color="#015F45" />
            </TouchableOpacity>
          </View>

          {/* Animated Pet Image */}
          <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
            <ExpoImage
              // Use getTurtleImage with the filename from the equipped skin
              source={getTurtleImage(equippedSkin?.skinImage)}
              style={styles.petImage}
              contentFit="contain" // Ensure the whole turtle is visible
              cachePolicy="memory-disk" // Cache image
            />
          </Animated.View>

          {/* Happiness Bar */}
          <View style={styles.happinessContainer}>
            <Text style={styles.happinessLabel}>Happiness:</Text>
            <View style={styles.happinessBarBackground}>
              <Animated.View
                style={[
                  styles.happinessBarFill,
                  // Width is animated based on happiness level
                  { width: happinessAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }
                ]}
              />
            </View>
            <Text style={styles.happinessValue}>{petHappiness}%</Text>
          </View>
        </LinearGradient>

        {/* Action Buttons Row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowItemShop(true)}>
            <Ionicons name="shirt-outline" size={24} color="#015F45" />
            <Text style={styles.actionButtonText}>Skins</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowVoucherShop(true)}>
            <Ionicons name="gift-outline" size={24} color="#015F45" />
            <Text style={styles.actionButtonText}>Rewards</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowLeaderboard(true)}>
            <Ionicons name="trophy-outline" size={24} color="#015F45" />
            <Text style={styles.actionButtonText}>Friends</Text>
          </TouchableOpacity>
        </View>

        {/* Placeholder for potential future sections */}
        {/* <Text style={styles.sectionTitle}>Recent Activity</Text> */}
        {/* ... activity list ... */}

      </ScrollView>

      {/* Render Modals */}
      {renderItemShopModal()}
      {renderVoucherShopModal()}
      {renderLeaderboardModal()}
      {renderVoucherDetailModal()}

      {/* Temporary Notification Display */}
      {showNotification && (
        <Animated.View style={styles.notification}>
          <Text style={styles.notificationContent}>{notificationMessage}</Text>
        </Animated.View>
      )}
    </View>
  )
}

// --- Styles ---
const { width } = Dimensions.get("window") // Get screen width for responsive design

const styles = StyleSheet.create({
  // --- Main Layout & Containers ---
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Light gray background
  },
  fixedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50, // Adjust for status bar
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Ensure space below content
  },
  loadingContainer: { // Centered loading indicator
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4a5568',
  },

  // --- Header Elements ---
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3fee8', // Light green background
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#015F45', // Dark green text
  },

  // --- Pet Card Elements ---
  petCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    // Shadow for card effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  petNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center name and button
    marginBottom: 12,
    width: '100%', // Ensure container takes full width
  },
  petName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center', // Center text within its space
    marginRight: 8, // Space before edit button
  },
  petNameInputStyle: { // Style for the TextInput when editing name
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    borderBottomWidth: 1,
    borderColor: '#015F45',
    paddingBottom: 2,
    textAlign: 'center',
    minWidth: 100, // Ensure it has some width
    marginRight: 8,
  },
  editNameButton: {
    padding: 4, // Make touch target slightly larger
  },
  petImage: {
    width: width * 0.4, // Responsive width
    height: width * 0.4, // Responsive height
    marginBottom: 16,
  },
  happinessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%', // Control width of the happiness bar section
    marginTop: 8,
  },
  happinessLabel: {
    fontSize: 14,
    color: '#4a5568',
    marginRight: 8,
  },
  happinessBarBackground: {
    flex: 1, // Take remaining space
    height: 8,
    backgroundColor: '#e2e8f0', // Light gray background
    borderRadius: 4,
    overflow: 'hidden', // Clip the fill bar
  },
  happinessBarFill: {
    height: '100%',
    backgroundColor: '#4ade80', // Green fill
    borderRadius: 4,
  },
  happinessValue: {
    fontSize: 14,
    color: '#4a5568',
    marginLeft: 8,
    fontWeight: '600',
  },

  // --- Action Buttons ---
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute buttons evenly
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    // Shadow for buttons
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    minWidth: width / 4, // Ensure buttons have minimum width
  },
  actionButtonText: {
    marginTop: 4,
    fontSize: 12,
    color: '#015F45',
    fontWeight: '500',
  },

  // --- Modal Styles ---
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end', // Position modal at the bottom
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent background
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '85%', // Limit modal height
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionTitle: { // Used in modals and potentially other sections
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f1f5f9', // Light background for tab bar
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1, // Each tab takes equal width
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ffffff', // White background for active tab
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568', // Default text color
  },
  tabButtonTextActive: {
    color: '#015F45', // Active text color
    fontWeight: '600',
  },

  // --- Item Shop & Inventory Styles ---
  shopItem: {
    flex: 1, // Take up space in the grid column
    margin: 8,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    // Shadow for items
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  ownedItem: { // Similar to shopItem, but used in inventory
    flex: 1,
    margin: 8,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent', // Default no border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  equippedItem: { // Style applied to the equipped item in inventory
    borderColor: '#015F45', // Green border when equipped
    backgroundColor: '#f3fee8', // Light green background
  },
  itemImage: { // Used for both shop and owned items
    width: width * 0.25, // Responsive image size
    height: width * 0.25,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  buyButton: { // Gradient button for buying items
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    width: '100%', // Make button full width of item card
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  equippedText: { // Text like "Equipped" or "Tap to equip"
    fontSize: 12,
    color: '#015F45',
    fontWeight: '600',
    marginTop: 4,
  },

  // --- Reward Shop & Voucher Styles ---
  rewardItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1, // Take available space
    marginRight: 8,
  },
  rewardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  rewardPartner: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 12,
    color: '#4a5568',
  },
  redeemButton: { // Gradient button for buying/viewing rewards
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 80, // Ensure minimum width
    alignItems: 'center',
  },
  redeemButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  voucherCard: { // Card style for 'My Vouchers' list
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  voucherImage: { // Image style within voucher card
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  voucherContent: { // Container for text and code/button
    flex: 1,
    marginRight: 8,
  },
  voucherName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  voucherPartner: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
  },
  voucherCodePill: { // Pill display for the redeemed code
    backgroundColor: '#e0f2fe', // Light blue background
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start', // Don't stretch full width
  },
  voucherCodeText: { // Text style for the code itself
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0c4a6e', // Dark blue text
    fontFamily: 'monospace', // Use monospace for codes
  },
  getCodeButton: { // Button to generate/show code
    backgroundColor: '#f3fee8', // Light green
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  getCodeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#015F45', // Dark green text
  },
  voucherStatus: { // Container for the status icon/text
    alignItems: 'center',
  },
  statusBadge: { // Container for redeemed checkmark and text
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7', // Light green background for badge
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: { // "Redeemed" text
    fontSize: 11,
    color: '#015F45',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyVoucherText: { // Text shown when no vouchers are owned
    textAlign: 'center',
    marginTop: 20,
    color: '#64748b',
    fontSize: 14,
    paddingHorizontal: 16,
  },

  // --- Reward Stats & Challenges ---
  statsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#015F45',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  streakProgressContainer: {
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
    marginBottom: 8,
    textAlign: 'center',
  },
  streakDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  streakDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e2e8f0', // Inactive color
    marginHorizontal: 4,
  },
  streakDotActive: {
    backgroundColor: '#f59e0b', // Active color (gold/yellow)
  },
  streakHint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  challengesContainer: { // Container for mock challenges
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  challengesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#015F45',
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeCheckbox: {
    marginRight: 10,
  },
  challengeTitle: {
    fontSize: 14,
    color: '#334155',
    flex: 1, // Allow text to wrap
  },
  challengeCompleted: { // Style for completed challenge text
    textDecorationLine: 'line-through',
    color: '#94a3b8', // Gray out completed text
  },

  // --- Voucher Detail Modal Styles ---
  detailModalContainer: { // Full screen container for the detail modal
    flex: 1,
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Darker overlay
  },
  detailModalContent: { // White content box
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: width * 0.9, // 90% of screen width
    maxHeight: '80%', // Limit height
    alignItems: 'center', // Center items inside the modal
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 15,
  },
  detailModalHeader: { // Header within the detail modal (only close button)
    width: '100%',
    alignItems: 'flex-end', // Position close button to the right
    marginBottom: 0, // Reduce space below close button
  },
  closeDetailButton: { // Close button in detail modal
    padding: 8, // Increase touch area
  },
  detailImage: { // Image in detail modal
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailTitle: { // Title in detail modal
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  detailPartner: { // Partner name in detail modal
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  detailDescription: { // Description in detail modal
    fontSize: 14,
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailCodeContainer: { // Container for the code display
    backgroundColor: '#f0f9ff', // Very light blue background
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    width: '100%',
  },
  detailCodeLabel: { // "Your Code:" label
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  // Re-use voucherCodeText for styling the code here
  detailGetCodeButton: { // Button to generate code in detail modal
    backgroundColor: '#015F45',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 16,
  },
  detailGetCodeButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  removeButton: { // Button to remove voucher
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8, // Space above remove button
    paddingVertical: 8,
  },
  removeButtonText: {
    color: '#e53e3e', // Red color for remove action
    fontSize: 14,
    fontWeight: '500',
  },
  rewardBenefitContainer: { // Container for financial benefits text
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
    width: '100%',
  },
  rewardBenefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'center',
  },
  rewardBenefitText: { // Text describing benefits
    fontSize: 13,
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 4,
  },

  // --- Leaderboard Styles ---
  friendItem: { // Row for each friend in the leaderboard
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9', // Lighter separator
  },
  friendRankText: { // Rank number (#1, #2, etc.)
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
    width: 30, // Fixed width for alignment
    textAlign: 'center',
  },
  friendPetPreviewImage: { // Smaller image for friend's pet
    width: 40,
    height: 40,
    borderRadius: 20, // Circular image
    marginHorizontal: 12,
  },
  friendDetails: { // Container for friend's name and points
    flex: 1,
  },
  friendNameText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  friendPointsText: {
    fontSize: 13,
    color: '#015F45', // Use theme color for points
  },

  // --- Notification Style ---
  notification: { // Floating notification style
    position: 'absolute',
    bottom: 80, // Position above potential bottom navigation
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark semi-transparent background
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  notificationContent: { // Text inside notification
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default VirtualPetBanking;
