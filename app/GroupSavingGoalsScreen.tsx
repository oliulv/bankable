import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Data structure for a single goal. */
interface Goal {
  id: number;
  name: string;
  target: number;
  current: number;
  members: string[];
}

/** Initial sample goals */
const initialGoals: Goal[] = [
  { id: 1, name: "Summer Holiday", target: 2000, current: 1500, members: ["JD", "AS", "MT"] },
  { id: 2, name: "New Gaming Console", target: 500, current: 350, members: ["JD", "RK"] },
];

/** Main component */
export default function GroupSavingGoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const [goalToDeleteId, setGoalToDeleteId] = useState<number | null>(null);

  // Load saved goals on initial render
  useEffect(() => {
    const loadGoals = async () => {
      try {
        const savedGoals = await AsyncStorage.getItem('savedGoals');
        if (savedGoals !== null) {
          setGoals(JSON.parse(savedGoals));
        }
      } catch (error) {
        console.error('Failed to load goals', error);
      }
    };
    
    loadGoals();
  }, []);

  // Save goals whenever they change
  useEffect(() => {
    const saveGoals = async () => {
      try {
        await AsyncStorage.setItem('savedGoals', JSON.stringify(goals));
      } catch (error) {
        console.error('Failed to save goals', error);
      }
    };
    
    saveGoals();
  }, [goals]);

  /** Create a new goal */
  const handleCreateGoal = () => {
    if (newGoalName.trim() && newGoalTarget.trim()) {
      const newGoal: Goal = {
        id: Date.now(), // Use timestamp for unique ID
        name: newGoalName,
        target: parseFloat(newGoalTarget),
        current: 0,
        members: ["You"],
      };
      setGoals([...goals, newGoal]);
      setNewGoalName("");
      setNewGoalTarget("");
      Keyboard.dismiss();
    }
  };

  /** Contribute to selected goal */
  const handleContribute = () => {
    if (selectedGoalId && contributionAmount.trim()) {
      const amount = parseFloat(contributionAmount);
      setGoals((prev) =>
        prev.map((g) =>
          g.id === selectedGoalId ? { ...g, current: g.current + amount } : g
        )
      );
      setContributionAmount("");
      setSelectedGoalId(null);
      setModalVisible(false);
    }
  };

  /** Open modal for a specific goal */
  const openContributeModal = (goalId: number) => {
    setSelectedGoalId(goalId);
    setModalVisible(true);
  };

  /** Confirm delete for a goal */
  const confirmDeleteGoal = (goalId: number) => {
    setGoalToDeleteId(goalId);
    setConfirmDeleteModalVisible(true);
  };

  /** Delete a goal */
  const deleteGoal = () => {
    if (goalToDeleteId !== null) {
      setGoals(goals.filter(goal => goal.id !== goalToDeleteId));
      setConfirmDeleteModalVisible(false);
      setGoalToDeleteId(null);
    }
  };

  const renderCreateGoal = () => {
    // Create refs for input fields to manage focus properly
    const targetInputRef = useRef<TextInput>(null);
    
    return (
      <View style={[styles.createCard, { marginTop: 16 }]}>
        <Text style={styles.cardTitle}>Create New Goal</Text>
        <View style={{ marginTop: 12 }}>
          <TextInput
            placeholder="Goal Name"
            value={newGoalName}
            onChangeText={setNewGoalName}
            style={styles.input}
            placeholderTextColor="#999"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => targetInputRef.current?.focus()}
          />
          <TextInput
            ref={targetInputRef}
            placeholder="Target Amount (£)"
            keyboardType="numeric"
            value={newGoalTarget}
            onChangeText={setNewGoalTarget}
            style={styles.input}
            placeholderTextColor="#999"
            returnKeyType="done"
            onSubmitEditing={handleCreateGoal}
          />
          <TouchableOpacity style={styles.createButton} onPress={handleCreateGoal}>
            <Text style={styles.createText}>Create Group Goal</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderGoalItem = ({ item }: { item: Goal }) => {
    const progressPercent = Math.min(100, (item.current / item.target) * 100);
    
    return (
      <View style={styles.card}>
        <View style={styles.flexRowSpace}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => confirmDeleteGoal(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#000000" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.cardSubtitle}>Group savings progress</Text>
        
        <View style={{ marginTop: 8, marginBottom: 12 }}>
          <View style={styles.flexRowSpace}>
            <Text style={styles.label}>Progress</Text>
            <Text style={styles.label}>
              £{item.current} / £{item.target}
            </Text>
          </View>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        <View style={[styles.flexRow, { marginBottom: 12 }]}>
          <Ionicons name="people" size={20} color="#555" style={{ marginRight: 4 }} />
          <View style={styles.avatarContainer}>
            {item.members.map((member, idx) => (
              <View key={idx} style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{member}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.ghostButton}>
            <Ionicons name="add-circle-outline" size={18} color="#555" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.contributeButton}
          onPress={() => openContributeModal(item.id)}
        >
          <Text style={styles.contributeText}>Contribute</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      {/* Static Header with dynamic subtitle */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Group Savings</Text>
        <Text style={styles.subtitle}>
          {goals.length} {goals.length === 1 ? 'goal' : 'goals'} active
        </Text>
      </View>
      
      <FlatList
        data={goals}
        renderItem={renderGoalItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListFooterComponent={renderCreateGoal}
      />

      {/* Contribute Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Contribute to {goals.find((g) => g.id === selectedGoalId)?.name}
            </Text>
            <Text style={styles.modalDesc}>
              Enter the amount you'd like to contribute to this goal.
            </Text>

            <TextInput
              placeholder="Amount"
              keyboardType="numeric"
              value={contributionAmount}
              onChangeText={setContributionAmount}
              style={styles.input}
              placeholderTextColor="#999"
              returnKeyType="done"
              onSubmitEditing={handleContribute}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.createButton, { flex: 1, marginRight: 8 }]}
                onPress={handleContribute}
              >
                <Text style={styles.createText}>Contribute</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ghostButton, { flex: 1 }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: "#555", textAlign: "center" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={confirmDeleteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setConfirmDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Goal</Text>
            <Text style={styles.modalDesc}>
              Are you sure you want to delete this goal? This action cannot be undone.
            </Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.deleteConfirmButton, { flex: 1, marginRight: 8 }]}
                onPress={deleteGoal}
              >
                <Text style={styles.createText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ghostButton, { flex: 1 }]}
                onPress={() => setConfirmDeleteModalVisible(false)}
              >
                <Text style={{ color: "#555", textAlign: "center" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/** Updated styling */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  card: {
    backgroundColor: '#f3fee8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#015F45",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    color: "#333",
  },
  flexRowSpace: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressBackground: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    marginTop: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#015F45",
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    flexDirection: "row",
    marginLeft: 4,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    marginRight: -8, // overlap effect
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarText: {
    fontSize: 10,
    color: "#333",
  },
  ghostButton: {
    padding: 6,
    borderRadius: 50,
  },
  contributeButton: {
    backgroundColor: "#015F45",
    paddingVertical: 12,
    borderRadius: 24,
  },
  contributeText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
  },
  // Updated input style to match BankableAIScreen
  input: {
    height: 50,
    backgroundColor: "#f3fee8",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 16,
    color: "#015F45",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 0,
  },
  createButton: {
    backgroundColor: "#015F45",
    paddingVertical: 12,
    borderRadius: 24,
  },
  createText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#015F45",
  },
  modalDesc: {
    fontSize: 14,
    color: "#555",
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  headerContainer: {
    padding: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: "#015F45",
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  createCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  deleteButton: {
    padding: 4,
  },
  deleteConfirmButton: {
    backgroundColor: "#ff3b30",
    paddingVertical: 12,
    borderRadius: 24,
  },
});
