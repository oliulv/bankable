import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from "react-native";

/**
 * Settings screen component.
 * Allows users to manage notification preferences, security settings, and account preferences.
 */
export default function SettingsScreen() {
  // State for toggles
  const [darkMode, setDarkMode] = useState(false); // NOTE: Dark mode toggle is not fully implemented
  const [pushNotifications, setPushNotifications] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(false);

  // Conditionally apply styles based on darkMode state (currently not toggled)
  const containerStyle = darkMode ? styles.containerDark : styles.containerLight;
  const textStyle = darkMode ? styles.textDark : styles.textLight;

  return (
    <ScrollView style={[styles.container, containerStyle]}>
      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, textStyle]}>Notifications</Text>
        <Text style={[styles.sectionSubtitle, textStyle]}>
          Manage your alert preferences
        </Text>
        {/* Push Notifications Toggle */}
        <View style={styles.row}>
          <Text style={[styles.label, textStyle]}>Push Notifications</Text>
          <Switch
            value={pushNotifications}
            onValueChange={(value) => setPushNotifications(value)}
            trackColor={{ false: "#fff", true: "#f3fee8" }}
            thumbColor={pushNotifications ? "#006a4d" : "#006a4d"}
            ios_backgroundColor="#fff"
          />
        </View>
        {/* Email Alerts Toggle */}
        <View style={styles.row}>
          <Text style={[styles.label, textStyle]}>Email Alerts</Text>
          <Switch
            value={emailAlerts}
            onValueChange={(value) => setEmailAlerts(value)}
            trackColor={{ false: "#fff", true: "#f3fee8" }}
            thumbColor={emailAlerts ? "#006a4d" : "#006a4d"}
            ios_backgroundColor="#fff"
          />
        </View>
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, textStyle]}>Security</Text>
        <Text style={[styles.sectionSubtitle, textStyle]}>
          Manage your account security
        </Text>
        {/* Change Password Button */}
        <TouchableOpacity style={styles.button}>
          <Text style={[styles.buttonText, textStyle]}>Change Password</Text>
        </TouchableOpacity>
        {/* Two-Factor Authentication Button */}
        <TouchableOpacity style={styles.button}>
          <Text style={[styles.buttonText, textStyle]}>
            Two-Factor Authentication
          </Text>
        </TouchableOpacity>
      </View>

      {/* Account Preferences Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, textStyle]}>
          Account Preferences
        </Text>
        <Text style={[styles.sectionSubtitle, textStyle]}>
          Customise your banking experience
        </Text>
        {/* Manage Linked Accounts Button */}
        <TouchableOpacity style={styles.button}>
          <Text style={[styles.buttonText, textStyle]}>
            Manage Linked Accounts
          </Text>
        </TouchableOpacity>
        {/* Help & Support Button */}
        <TouchableOpacity style={styles.button}>
          <Text style={[styles.buttonText, textStyle]}>Help & Support</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Styles for the SettingsScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  // Light mode background style
  containerLight: {
    backgroundColor: '#ffffff',
  },
  // Dark mode background style (currently unused)
  containerDark: {
    backgroundColor: "#1e1e1e",
  },
  // Light mode text style
  textLight: {
    color: "#333",
  },
  // Dark mode text style (currently unused)
  textDark: {
    color: "#fff",
  },
  // Style for each settings section
  section: {
    backgroundColor: "transparent", // Ensure section background doesn't clash with container
    marginBottom: 16,
  },
  // Style for section titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  // Style for section subtitles
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  // Style for rows containing a label and a control (e.g., Switch)
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  // Style for labels within rows
  label: {
    fontSize: 16,
  },
  // Style for touchable buttons
  button: {
    backgroundColor: '#f3fee8', // Light green background
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  // Style for text within buttons
  buttonText: {
    fontSize: 16,
    // Inherit color from textStyle
  },
});