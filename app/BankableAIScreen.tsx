// app/BankableAIScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export default function BankableAIScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI Financial Health Coach. How can I assist you with your finances today? For example, you can ask, 'Can I afford a car worth $20,000?'",
    },
  ]);

  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    // Add user message
    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate an AI response
    setTimeout(() => {
      const aiResponse: Message = {
        role: "assistant",
        content:
          "Let me think about that... (This is a mock AI response. Replace with real logic or an API call!)",
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);

    setInput("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat with Your AI Coach</Text>
        <Text style={styles.headerSubtitle}>Get personalized financial advice</Text>
      </View>

      {/* Chat Area */}
      <View style={styles.chatContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageRow,
                msg.role === "assistant" ? styles.assistantRow : styles.userRow,
              ]}
            >
              {/* If assistant, show turtle icon on the left */}
              {msg.role === "assistant" && (
                <Image
                  source={{
                    uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2024-11-17_at_7.03.16_PM-removebg-preview-qYVjiMHoaYBDi7UFT0Diy07RmwLjrH.png",
                  }}
                  style={styles.assistantIcon}
                />
              )}

              <View
                style={[
                  styles.messageBubble,
                  msg.role === "assistant" ? styles.assistantBubble : styles.userBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === "assistant" ? styles.assistantText : styles.userText,
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask your financial question..."
          placeholderTextColor="#999"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  assistantRow: {
    justifyContent: "flex-start",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  assistantIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 8,
    padding: 10,
  },
  assistantBubble: {
    backgroundColor: "#eaeaea",
  },
  userBubble: {
    backgroundColor: "#006a4d",
  },
  assistantText: {
    color: "#333",
  },
  userText: {
    color: "#fff",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
    color: "#333",
  },
  sendButton: {
    backgroundColor: "#006a4d",
    padding: 12,
    borderRadius: 24,
  },
});
