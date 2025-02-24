import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import HomeScreen from "./src/screens/HomeScreen"
import FinancialHealthScreen from "./src/screens/FinancialHealthScreen"
import InvestmentsScreen from "./src/screens/InvestmentsScreen"
import VirtualPetScreen from "./src/screens/VirtualPetScreen"
import SettingsScreen from "./src/screens/SettingsScreen"

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName

            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline"
            } else if (route.name === "Financial Health") {
              iconName = focused ? "heart" : "heart-outline"
            } else if (route.name === "Investments") {
              iconName = focused ? "trending-up" : "trending-up-outline"
            } else if (route.name === "Virtual Pet") {
              iconName = focused ? "paw" : "paw-outline"
            } else if (route.name === "Settings") {
              iconName = focused ? "settings" : "settings-outline"
            }

            return <Ionicons name={iconName} size={size} color={color} />
          },
          tabBarActiveTintColor: "#006a4d",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Financial Health" component={FinancialHealthScreen} />
        <Tab.Screen name="Investments" component={InvestmentsScreen} />
        <Tab.Screen name="Virtual Pet" component={VirtualPetScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}

