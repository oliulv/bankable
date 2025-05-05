import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Interfaces & Types ---

/** Defines the data structure for a single savings goal. */
interface Goal {
  id: number;         // Unique identifier for the goal (timestamp)
  name: string;       // Name of the savings goal
  target: number;     // Target amount to save
  current: number;    // Current amount saved
  members: string[];  // Array of member initials (e.g., ["You", "JD"])
}

/** Sentinel type used to identify the "Create New Goal" card in the FlatList. */
interface CreateItem {
  id: 0; // Special ID to distinguish this item
}

/** Union type representing items that can appear in the FlatList (either a Goal or the CreateItem). */
type ListItem = Goal | CreateItem;

// --- Constants ---

/** Key used for storing and retrieving goals data in AsyncStorage. */
const STORAGE_KEY = '@bankable_group_goals';

// --- Helper Functions ---

/**
 * Generates a string of two random uppercase letters (initials).
 * @returns {string} Two random uppercase initials (e.g., "AB").
 */
const getRandomInitials = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  // Helper function to pick a random character from the letters string
  const pick = () => letters.charAt(Math.floor(Math.random() * letters.length));
  return pick() + pick(); // Concatenate two random letters
};

// --- Initial Data ---

/** Initial sample goals provided if no saved data is found. */
const initialGoals: Goal[] = [
  { id: 1, name: "Summer Holiday", target: 2000, current: 1500, members: ["You", "AS", "MT"] },
  { id: 2, name: "New Gaming Console", target: 500, current: 350, members: ["You", "RK"] },
];

/**
 * Group Saving Goals Screen Component.
 * Allows users to create, view, contribute to, and manage shared savings goals.
 * Data is persisted using AsyncStorage.
 */
export default function GroupSavingGoalsScreen() {
  // --- State Variables ---
  const [goals, setGoals] = useState<Goal[]>([]); // Array holding all the saving goals
  const [newGoalName, setNewGoalName] = useState(""); // Input state for the new goal's name
  const [newGoalTarget, setNewGoalTarget] = useState(""); // Input state for the new goal's target amount
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null); // ID of the goal selected for contribution or deletion
  const [contributionAmount, setContributionAmount] = useState(""); // Input state for the contribution amount
  const [modalVisible, setModalVisible] = useState(false); // Controls visibility of the contribution modal
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false); // Controls visibility of the delete confirmation modal
  const [goalToDeleteId, setGoalToDeleteId] = useState<number | null>(null); // ID of the goal marked for deletion confirmation

  // --- Refs ---
  // Ref for the target amount input field in the "Create New Goal" card
  const targetRef = useRef<TextInput>(null);

  // --- Effects ---

  /** Effect to load saved goals from AsyncStorage when the component mounts. */
  useEffect(() => {
    const loadGoals = async () => {
      try {
        const savedGoalsJson = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedGoalsJson) {
          // If saved data exists, parse it and update the state
          setGoals(JSON.parse(savedGoalsJson));
        } else {
          // If no saved data, use the initial sample goals
          setGoals(initialGoals);
        }
      } catch (e) {
        console.error('Failed to load goals from storage:', e);
        // Fallback to initial goals in case of error
        setGoals(initialGoals);
        Alert.alert("Error", "Could not load saved goals.");
      }
    };
    loadGoals();
  }, []); // Empty dependency array ensures this runs only once on mount

  /** Effect to save the current goals state to AsyncStorage whenever the `goals` array changes. */
  useEffect(() => {
    const saveGoals = async () => {
      // Avoid saving the initial empty array before data is loaded
      if (goals.length > 0 || (goals.length === 0 && initialGoals.length > 0)) { // Save even if goals become empty after initial load
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
        } catch (e) {
          console.error('Failed to save goals to storage:', e);
          Alert.alert("Error", "Could not save goal changes.");
        }
      }
    };
    saveGoals();
  }, [goals]); // Dependency: run this effect whenever the `goals` state changes

  // --- Event Handlers & Actions ---

  /**
   * Adds a new dummy member with random initials to a specified goal.
   * @param {number} goalId - The ID of the goal to add the member to.
   */
  const handleAddMember = (goalId: number) => {
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId
          // If it's the target goal, add new random initials to the members array
          ? { ...goal, members: [...goal.members, getRandomInitials()] }
          // Otherwise, keep the goal unchanged
          : goal
      )
    );
  };

  /**
   * Creates a new savings goal based on the input fields.
   * Validates input, adds the new goal to the state, and clears the form.
   */
  const handleCreateGoal = () => {
    const name = newGoalName.trim();
    const targetAmount = parseFloat(newGoalTarget);

    // Validate input: name must not be empty, target must be a positive number
    if (name && !isNaN(targetAmount) && targetAmount > 0) {
      const newGoal: Goal = {
        id: Date.now(), // Use timestamp as a unique ID
        name: name,
        target: targetAmount,
        current: 0, // Start with 0 saved
        members: ["You"], // Add "You" as the initial member
      };
      // Add the new goal to the beginning of the list for visibility
      setGoals(prevGoals => [newGoal, ...prevGoals]);
      // Reset input fields
      setNewGoalName("");
      setNewGoalTarget("");
      // Dismiss the keyboard
      Keyboard.dismiss();
    } else {
      // Show an alert if validation fails
      Alert.alert("Invalid Input", "Please enter a valid goal name and a positive target amount.");
    }
  };

  /**
   * Opens the modal for contributing to a specific goal.
   * @param {number} goalId - The ID of the goal to contribute to.
   */
  const openContributeModal = (goalId: number) => {
    setSelectedGoalId(goalId); // Store the ID of the selected goal
    setModalVisible(true); // Show the contribution modal
  };

  /**
   * Handles the contribution action.
   * Validates the amount, updates the goal's current amount, and closes the modal.
   */
  const handleContribute = () => {
    const amount = parseFloat(contributionAmount);

    // Validate input: must have a selected goal, amount must be a positive number
    if (selectedGoalId !== null && contributionAmount.trim() && !isNaN(amount) && amount > 0) {
      setGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === selectedGoalId
            // If it's the selected goal, add the contribution amount to the current amount
            // Ensure current amount doesn't exceed target (optional, depends on requirements)
            ? { ...goal, current: Math.min(goal.target, goal.current + amount) }
            : goal
        )
      );
      // Reset contribution state and close modal
      setContributionAmount("");
      setSelectedGoalId(null);
      setModalVisible(false);
      Keyboard.dismiss();
    } else {
      // Show alert for invalid contribution amount
      Alert.alert("Invalid Amount", "Please enter a valid positive amount to contribute.");
    }
  };

  /**
   * Opens the confirmation modal before deleting a goal.
   * @param {number} goalId - The ID of the goal to be potentially deleted.
   */
  const confirmDeleteGoal = (goalId: number) => {
    setGoalToDeleteId(goalId); // Store the ID of the goal to delete
    setConfirmDeleteModalVisible(true); // Show the confirmation modal
  };

  /**
   * Deletes the goal identified by `goalToDeleteId` after confirmation.
   */
  const deleteGoal = () => {
    if (goalToDeleteId !== null) {
      // Filter out the goal with the matching ID
      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalToDeleteId));
      // Close the confirmation modal and reset the state
      setConfirmDeleteModalVisible(false);
      setGoalToDeleteId(null);
    }
  };

  // --- Render Functions ---

  /**
   * Renders a single savings goal card in the FlatList.
   * Displays goal name, progress, members, and action buttons.
   * @param {object} params - Object containing the goal item.
   * @param {Goal} params.item - The goal data to render.
   * @returns {React.ReactElement} The rendered goal card component.
   */
  const renderGoalItem = ({ item }: { item: Goal }): React.ReactElement => {
    // Calculate progress percentage, capped at 100%
    const progress = Math.min(100, (item.current / item.target) * 100);
    return (
      // Card container
      <View style={styles.card}>
        {/* Header row: Title and Delete button */}
        <View style={styles.flexRowSpace}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {/* Delete button */}
          <TouchableOpacity onPress={() => confirmDeleteGoal(item.id)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={18} color="#000" />
          </TouchableOpacity>
        </View>
        {/* Subtitle showing current vs target amount */}
        <Text style={styles.cardSubtitle}>Progress: £{item.current.toFixed(2)} / £{item.target.toFixed(2)}</Text>
        {/* Progress bar */}
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {/* Members section */}
        <View style={[styles.flexRow, { marginVertical: 12 }]}>
          <Ionicons name="people" size={20} color="#555" style={{ marginRight: 4 }} />
          {/* Container for member avatars */}
          <View style={styles.avatarContainer}>
            {/* Render avatar circle for each member */}
            {item.members.map((memberInitials, index) => (
              <View key={index} style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{memberInitials}</Text>
              </View>
            ))}
            {/* "Add Member" button */}
            <TouchableOpacity style={styles.ghostButton} onPress={() => handleAddMember(item.id)}>
              <Ionicons name="add-circle-outline" size={20} color="#555" />
            </TouchableOpacity>
          </View>
        </View>

        {/* "Contribute" button */}
        <TouchableOpacity style={styles.contributeButton} onPress={() => openContributeModal(item.id)}>
          <Text style={styles.contributeText}>Contribute</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Renders the special card used for creating a new goal.
   * Contains input fields for name and target amount, and a create button.
   * @returns {React.ReactElement} The rendered "Create New Goal" card component.
   */
  const renderCreateCard = (): React.ReactElement => (
    // Card container for the creation form
    <View style={[styles.createCard, { marginBottom: 16 }]}>
      <Text style={styles.cardTitle}>Create New Goal</Text>
      {/* Input for Goal Name */}
      <TextInput
        placeholder="Goal Name"
        value={newGoalName}
        onChangeText={setNewGoalName}
        style={styles.input}
        placeholderTextColor="#999"
        blurOnSubmit={false} // Keep keyboard open on submit
        returnKeyType="next" // Show "Next" button on keyboard
        onSubmitEditing={() => targetRef.current?.focus()} // Focus target input on submit
      />
      {/* Input for Target Amount */}
      <TextInput
        ref={targetRef} // Assign ref for focusing
        placeholder="Target Amount (£)"
        keyboardType="numeric" // Use numeric keyboard
        returnKeyType="done" // Show "Done" button on keyboard
        blurOnSubmit={true} // Dismiss keyboard on submit
        value={newGoalTarget}
        onChangeText={setNewGoalTarget}
        style={styles.input}
        placeholderTextColor="#999"
        onSubmitEditing={handleCreateGoal} // Attempt to create goal on submit
      />
      {/* "Create Group Goal" button */}
      <TouchableOpacity style={styles.createButton} onPress={handleCreateGoal}>
        <Text style={styles.createText}>Create Group Goal</Text>
      </TouchableOpacity>
    </View>
  );

  // --- Data Preparation for FlatList ---
  // Combine the goals array with the special CreateItem sentinel for the FlatList
  const listData: ListItem[] = [...goals, { id: 0 }];

  // --- Main Component Return ---
  return (
    // Use KeyboardAvoidingView to adjust layout when keyboard is visible
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Adjust behavior based on platform
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} // Offset for iOS header/tabs
    >
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Group Savings</Text>
        <Text style={styles.subtitle}>
          {/* Display the number of active goals */}
          {goals.length} {goals.length === 1 ? 'goal' : 'goals'} active
        </Text>
      </View>

      {/* Main list displaying goals and the create card */}
      <FlatList<ListItem>
        data={listData} // Use the combined data array
        // Conditionally render either a goal item or the create card based on item type
        renderItem={({ item }) =>
          'name' in item ? renderGoalItem({ item }) : renderCreateCard()
        }
        keyExtractor={item => item.id.toString()} // Use goal ID or sentinel ID as key
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }} // Add padding around the list
        keyboardShouldPersistTaps="handled" // Allow taps on buttons within the list while keyboard is open
      />

      {/* Contribution Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        {/* Semi-transparent overlay */}
        <View style={styles.modalOverlay}>
          {/* Modal content container */}
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {/* Display the name of the goal being contributed to */}
              Contribute to {goals.find(g => g.id === selectedGoalId)?.name}
            </Text>
            {/* Input for contribution amount */}
            <TextInput
              placeholder="Amount (£)"
              keyboardType="numeric"
              returnKeyType="done"
              blurOnSubmit={true}
              value={contributionAmount}
              onChangeText={setContributionAmount}
              style={styles.input} // Reuse input style
              placeholderTextColor="#999"
              onSubmitEditing={handleContribute} // Attempt contribution on submit
              autoFocus={true} // Automatically focus the input
            />
            {/* Row for modal action buttons */}
            <View style={styles.modalButtonRow}>
              {/* "Contribute" button */}
              <TouchableOpacity style={[styles.createButton, { flex: 1, marginRight: 8 }]} onPress={handleContribute}>
                <Text style={styles.createText}>Contribute</Text>
              </TouchableOpacity>
              {/* "Cancel" button */}
              <TouchableOpacity style={[styles.ghostButton, { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 24, paddingVertical: 12 }]} onPress={() => { setModalVisible(false); Keyboard.dismiss(); }}>
                <Text style={{ color: "#555", textAlign: "center" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={confirmDeleteModalVisible} transparent animationType="fade">
        {/* Semi-transparent overlay */}
        <View style={styles.modalOverlay}>
          {/* Modal content container */}
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Goal</Text>
            <Text style={styles.modalDesc}>
              Are you sure you want to delete this goal? This action cannot be undone.
            </Text>
            {/* Row for modal action buttons */}
            <View style={styles.modalButtonRow}>
              {/* "Delete" confirmation button */}
              <TouchableOpacity style={[styles.deleteConfirmButton, { flex: 1, marginRight: 8 }]} onPress={deleteGoal}>
                <Text style={styles.createText}>Delete</Text>
              </TouchableOpacity>
              {/* "Cancel" button */}
              <TouchableOpacity style={[styles.ghostButton, { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 24, paddingVertical: 12 }]} onPress={() => { setConfirmDeleteModalVisible(false); Keyboard.dismiss(); }}>
                <Text style={{ color: "#555", textAlign: "center" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background for the screen
  },
  // Header area styles
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff', // White background for header
    borderBottomWidth: 1, // Add a subtle border below header
    borderBottomColor: '#eee', // Light gray border color
  },
  // Main title style
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#015F45', // Bankable green color
  },
  // Subtitle style (goal count)
  subtitle: {
    fontSize: 14,
    color: '#666', // Medium gray color
    marginTop: 4,
  },
  // Goal card styles
  card: {
    backgroundColor: '#f3fee8', // Light mint green background
    borderRadius: 16,
    padding: 16,
    marginBottom: 16, // Space between cards
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  // Goal card title style
  cardTitle: {
    fontSize: 16,
    fontWeight: '700', // Bold title
    color: '#015F45', // Bankable green
  },
  // Goal card subtitle style (progress text)
  cardSubtitle: {
    fontSize: 14,
    color: '#555', // Darker gray text
    marginTop: 4,
  },
  // Utility style for row layout with space between elements
  flexRowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Utility style for basic row layout
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Background of the progress bar
  progressBackground: {
    height: 8,
    backgroundColor: '#eee', // Light gray background
    borderRadius: 4,
    overflow: 'hidden', // Clip the fill part
    marginTop: 8,
  },
  // Fill part of the progress bar
  progressFill: {
    height: '100%',
    backgroundColor: '#015F45', // Bankable green fill
  },
  // Container for member avatars
  avatarContainer: {
    flexDirection: 'row',
    marginLeft: 4, // Space after the people icon
  },
  // Style for individual member avatar circles
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14, // Make it a circle
    backgroundColor: '#ddd', // Light gray background
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8, // Overlap avatars slightly
    borderWidth: 2, // White border to separate circles
    borderColor: '#fff', // White border color
  },
  // Style for avatar initials text
  avatarText: {
    fontSize: 10,
    color: '#333', // Dark gray text
    fontWeight: '600',
  },
  // Style for subtle buttons (like add member)
  ghostButton: {
    padding: 6, // Touch area
    borderRadius: 50, // Make it circular
  },
  // Style for the delete button (trash icon)
  deleteButton: {
    padding: 4, // Touch area
  },
  // Style for the main "Contribute" button on cards
  contributeButton: {
    backgroundColor: '#015F45', // Bankable green background
    paddingVertical: 12,
    borderRadius: 24, // Rounded corners
    marginTop: 8, // Space above the button
  },
  // Text style for the "Contribute" button
  contributeText: {
    textAlign: 'center',
    color: '#fff', // White text
    fontWeight: '600',
  },
  // Style for the "Create New Goal" card
  createCard: {
    backgroundColor: '#fff', // White background
    borderRadius: 16,
    padding: 16,
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1, // Add a border to distinguish it
    borderColor: '#eee', // Light gray border
  },
  // Style for input fields (used in create card and modals)
  input: {
    height: 50,
    backgroundColor: '#f8f9fa', // Very light gray background
    borderRadius: 24, // Rounded corners
    paddingHorizontal: 16,
    marginBottom: 12, // Space below input
    fontSize: 16,
    color: '#015F45', // Bankable green text color
    borderWidth: 1, // Subtle border
    borderColor: '#eee', // Light gray border color
  },
  // Style for the "Create Group Goal" button
  createButton: {
    backgroundColor: '#015F45', // Bankable green background
    paddingVertical: 12,
    borderRadius: 24, // Rounded corners
  },
  // Text style for the "Create Group Goal" button
  createText: {
    color: '#fff', // White text
    textAlign: 'center',
    fontWeight: '600',
  },
  // Style for the modal overlay (semi-transparent background)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // Darker overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // Add padding to avoid edges
  },
  // Style for the modal content container
  modalContent: {
    width: '100%', // Take full width within padding
    maxWidth: 400, // Max width for larger screens
    backgroundColor: '#fff', // White background
    borderRadius: 16,
    padding: 20,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  // Style for the modal title text
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#015F45', // Bankable green
    textAlign: 'center', // Center align title
  },
  // Style for the description text in the delete modal
  modalDesc: {
    fontSize: 14,
    color: '#555', // Darker gray text
    marginBottom: 16,
    textAlign: 'center', // Center align description
    lineHeight: 20, // Improve readability
  },
  // Style for the red "Delete" confirmation button
  deleteConfirmButton: {
    backgroundColor: '#ff3b30', // Red color for delete action
    paddingVertical: 12,
    borderRadius: 24,
  },
  // Style for the row containing modal action buttons
  modalButtonRow: {
    flexDirection: 'row',
    marginTop: 12, // Space above buttons
  }
});