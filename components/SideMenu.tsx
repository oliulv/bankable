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
      <View style={styles.closeButtonContainer}>
        <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
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
          icon="calendar-outline" 
          title="Budgets" 
          onPress={() => navigateTo("/DynamicBudgetCalendarScreen")} 
        />
        <MenuItem 
          icon="people-outline" 
          title="Group Saving Goals" 
          onPress={() => navigateTo("/GroupSavingGoalsScreen")} 
        />
        <MenuItem 
          icon="trending-up-outline" 
          title="Investments" 
          onPress={() => navigateTo("/InvestmentsScreen")} 
        />
        <MenuItem 
          icon="logo-tiktok" 
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
        <Ionicons name={icon as any} size={24} color="#006a4d" />
      </View>
      <Text style={styles.menuItemText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  closeButtonContainer: {
    alignItems: 'flex-end',
    paddingRight: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  closeButton: {
    padding: 5,
  },
  menuItems: {
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
});

export default SideMenu;