import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Button,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const DRAWER_WIDTH = 250; // The width of the side menu
const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const router = useRouter();

  // Controls whether the menu is considered open or closed
  const [menuVisible, setMenuVisible] = useState(false);

  // Animation value for sliding the drawer
  // Start fully off-screen to the right
  const [menuAnim] = useState(new Animated.Value(DRAWER_WIDTH));

  const toggleMenu = () => {
    if (menuVisible) {
      // Animate the drawer off-screen
      Animated.timing(menuAnim, {
        toValue: DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      // Mark the menu as visible first
      setMenuVisible(true);
      // Animate the drawer onto the screen
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const navigateTo = (route: 
    "/BankableAIScreen" | 
    `/BankableAIScreen?${string}` | 
    `/BankableAIScreen#${string}` | 
    "/BankableVirtualPetScreen" | 
    `/BankableVirtualPetScreen?${string}` | 
    `/BankableVirtualPetScreen#${string}` | 
    "/InvestmentsScreen" | 
    `/InvestmentsScreen?${string}` | 
    `/InvestmentsScreen#${string}` | 
    "/EcoFinancialImpactScreen" | 
    `/EcoFinancialImpactScreen?${string}` | 
    `/EcoFinancialImpactScreen#${string}` | 
    "/LifeEventSupportScreen" | 
    `/LifeEventSupportScreen?${string}` | 
    `/LifeEventSupportScreen#${string}` | 
    "/GroupSavingGoalsScreen" | 
    `/GroupSavingGoalsScreen?${string}` | 
    `/GroupSavingGoalsScreen#${string}` | 
    "/DynamicBudgetCalendarScreen" | 
    `/DynamicBudgetCalendarScreen?${string}` | 
    `/DynamicBudgetCalendarScreen#${string}` | 
    "/SettingsScreen" | 
    `/SettingsScreen?${string}` | 
    `/SettingsScreen#${string}` 
  ) => {
    toggleMenu(); // Close the menu
    router.push(route);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT (e.g. transaction cards, accounts, etc.) */}
      <View style={styles.content}>
        <Text>Welcome to your banking app!</Text>
        {/* Replace this placeholder with your real home content. */}
      </View>

      {/* If the menu is open, show an overlay that closes it when tapped */}
      {menuVisible && (
        <TouchableOpacity style={styles.overlay} onPress={toggleMenu} activeOpacity={1}>
          {/* Drawer itself is an Animated.View */}
          <Animated.View
            style={[
              styles.drawer,
              { transform: [{ translateX: menuAnim }] },
            ]}
          >
            <Button
              title="Financial AI"
              onPress={() => navigateTo('/BankableAIScreen')}
            />
            <Button
              title="Bankable Virtual Pet"
              onPress={() => navigateTo('/BankableVirtualPetScreen')}
            />
            <Button
              title="Investments"
              onPress={() => navigateTo('/InvestmentsScreen')}
            />
            <Button
              title="Eco Financial Impact"
              onPress={() => navigateTo('/EcoFinancialImpactScreen')}
            />
            <Button
              title="Life Event Support"
              onPress={() => navigateTo('/LifeEventSupportScreen')}
            />
            <Button
              title="Group Saving Goals"
              onPress={() => navigateTo('/GroupSavingGoalsScreen')}
            />
            <Button
              title="Dynamic Budget Calendar"
              onPress={() => navigateTo('/DynamicBudgetCalendarScreen')}
            />
            <Button
              title="Settings"
              onPress={() => navigateTo('/SettingsScreen')}
            />
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /* Container that holds everything */
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  /* Header row with a title and the menu icon */
  header: {
    height: 60,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
  /* Main content area (below the header) */
  content: {
    flex: 1,
    padding: 16,
  },
  /* Dark overlay behind the drawer */
  overlay: {
    ...StyleSheet.absoluteFillObject, // covers entire screen
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // slight dim
    // Tapping anywhere on this closes the menu
  },
  /* The drawer that slides in from the right */
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#f2f2f2',
    padding: 16,
    // shadow for iOS and Android
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: -2, height: 0 },
    elevation: 5,
  },
});
