import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';

// Define type for screen paths to match Expo Router's expected types
type AppScreenPath =  
  | "/HomeScreen"
  | "/EducationalReels"
  | "/AccountsOverviewScreen"
  | "/GroupSavingGoalsScreen" 
  | "/InvestmentsScreen"
  | "/DynamicBudgetCalendarScreen"
  | "/EcoFinancialImpactScreen"
  | "/LoansScreen"
  | "/BankableVirtualPetScreen"
  | "/BankableAIScreen"
  | "/LifeEventSupportScreen"
  | "/SettingsScreen";

interface SideMenuProps {
  closeDrawer: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ closeDrawer }) => {
  const router = useRouter();
  const { setCustomerId, setCustomerName } = useUser();

  const navigateTo = (screenName: AppScreenPath) => {
    closeDrawer();
    router.push(screenName);
  };

  const handleLogout = () => {
    // Clear user context
    setCustomerId('');
    setCustomerName('');
    
    // Close drawer
    closeDrawer();
    
    // Navigate to login screen (index)
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.menuTitle}>Bankable</Text>
        <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#006a4d" />
        </TouchableOpacity>
      </View>      
      <View style={styles.menuContent}>
        <View style={styles.menuItems}>
          <MenuItem 
            icon="home-outline" 
            title="Home" 
            onPress={() => navigateTo("/HomeScreen")} 
          />
          <MenuItem 
            icon="wallet-outline" 
            title="Accounts" 
            onPress={() => navigateTo("/AccountsOverviewScreen")} 
          />
          <MenuItem 
            icon="people-outline" 
            title="Group Saving" 
            onPress={() => navigateTo("/GroupSavingGoalsScreen")} 
          />
          <MenuItem 
            icon="trending-up-outline" 
            title="Investments" 
            onPress={() => navigateTo("/InvestmentsScreen")} 
          />
          <MenuItem 
            icon="book-outline" 
            title="Educational Tips" 
            onPress={() => navigateTo("/EducationalReels")} 
          />
          <MenuItem 
            icon="leaf-outline" 
            title="Eco Impact" 
            onPress={() => navigateTo("/EcoFinancialImpactScreen")} 
          />
          <MenuItem 
            icon="cash-outline" 
            title="Loans" 
            onPress={() => navigateTo("/LoansScreen")} 
          />
          <MenuItem 
            icon="bug-outline" 
            title="Virtual Pet" 
            onPress={() => navigateTo("/BankableVirtualPetScreen")} 
          />
          <MenuItem 
            icon="bulb-outline" 
            title="Bankable AI" 
            onPress={() => navigateTo("/BankableAIScreen")} 
          />
          <MenuItem 
            icon="heart-outline" 
            title="Life Events" 
            onPress={() => navigateTo("/LifeEventSupportScreen")} 
          />
        </View>
        
        {/* Settings section with space above it */}
        <View style={styles.settingsSection}>
          <View style={styles.divider} />
          <MenuItem 
            icon="settings-outline" 
            title="Settings" 
            onPress={() => navigateTo("/SettingsScreen")} 
          />
          <MenuItem 
            icon="log-out-outline" 
            title="Logout" 
            onPress={handleLogout} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

// Helper component for menu items
interface MenuItemProps {
  icon: string;
  title: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, title, onPress }) => {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={22} color="#006a4d" />
      </View>
      <Text style={styles.menuItemText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006a4d',
  },
  closeButton: {
    padding: 6,
  },
  menuContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  menuItems: {
    flexGrow: 0, // Don't let it grow to push settings down
  },
  settingsSection: {
    marginTop: 'auto', // Push to the bottom
    marginBottom: 50, // Add space from the bottom of the screen
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
});

export default SideMenu;