import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from "react-native";

export default function SettingsScreen() {
  // Toggles
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(false);

  // Conditionally apply styles for dark vs. light mode
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
        <TouchableOpacity style={styles.button}>
          <Text style={[styles.buttonText, textStyle]}>Change Password</Text>
        </TouchableOpacity>
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
        <TouchableOpacity style={styles.button}>
          <Text style={[styles.buttonText, textStyle]}>
            Manage Linked Accounts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={[styles.buttonText, textStyle]}>Help & Support</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  containerLight: {
    backgroundColor: '#ffffff', // Changed from #f5f5f5
  },
  containerDark: {
    backgroundColor: "#1e1e1e",
  },
  textLight: {
    color: "#333",
  },
  textDark: {
    color: "#fff",
  },
  section: {
    backgroundColor: "transparent",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#f3fee8', // Changed from #e0e0e0
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
  },
});