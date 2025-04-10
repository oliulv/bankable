import React, { useState, useEffect, useRef } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { getAccountTransactions } from "../api/userData";
import { useRouter } from "expo-router"; // Add this import

interface Message {
  role: "assistant" | "user" | "system";
  content: string;
  navigationOptions?: NavigationButton[]; // Add this property
}

// Define a structure for navigation buttons
interface NavigationButton {
  label: string;
  screen: string;
  params?: Record<string, string>;
}

// TogetherAI API key - Replace with your actual key
const TOGETHER_API_KEY = "tgp_v1_XpOfBNJFK2M1H33jFBMzNHIvznkT4HmEvt4cg25GLn4"; 

// Define valid screens for navigation - this improves type safety and security
type ValidScreenPath = 
  | "/HomeScreen"
  | "/AccountsOverviewScreen" 
  | "/AccountDetailsScreen"
  | "/EcoFinancialImpactScreen"
  | "/BankableVirtualPetScreen" 
  | "/InvestmentsScreen"
  | "/DynamicBudgetCalendarScreen"
  | "/GroupSavingGoalsScreen"
  | "/LifeEventSupportScreen"
  | "/SettingsScreen"
  | "/LoansScreen";

// Mapping from screen names to their valid paths
const SCREEN_PATHS: Record<string, ValidScreenPath> = {
  "HomeScreen": "/HomeScreen",
  "AccountsOverviewScreen": "/AccountsOverviewScreen",
  "AccountDetailsScreen": "/AccountDetailsScreen",
  "EcoFinancialImpactScreen": "/EcoFinancialImpactScreen",
  "BankableVirtualPetScreen": "/BankableVirtualPetScreen",
  "InvestmentsScreen": "/InvestmentsScreen",
  "DynamicBudgetCalendarScreen": "/DynamicBudgetCalendarScreen",
  "GroupSavingGoalsScreen": "/GroupSavingGoalsScreen",
  "LifeEventSupportScreen": "/LifeEventSupportScreen",
  "SettingsScreen": "/SettingsScreen",
  "LoansScreen": "/LoansScreen"
};

export default function BankableAIScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm Bankable AI, your AI Financial Health Coach. How can I assist you with your finances today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter(); // Initialize router
  
  // Get user data from context
  const { customerData, accounts, isLoading: userDataLoading } = useUser();

  // Function to handle navigation within the app
  const handleNavigation = (
    screen: string,
    params?: Record<string, string>
  ) => {
    // Only navigate if the screen is in our allowed list
    const validPath = SCREEN_PATHS[screen];
    if (validPath) {
      router.push({
        pathname: validPath,
        params: params,
      });
    } else {
      console.warn(`Navigation attempted to invalid screen: ${screen}`);
    }
  };

  // Function to parse AI response for navigation commands
  const parseNavigationCommands = (responseText: string): { content: string, navigationOptions: NavigationButton[] } => {
    // Define a regex pattern to match [NAVIGATE:ScreenName] or [NAVIGATE:ScreenName:param1=value1,param2=value2]
    const navigationPattern = /\[NAVIGATE:([\w]+)(?::([\w=,]+))?\]/g;
    const navigationOptions: NavigationButton[] = [];
    
    // Replace navigation commands with empty string to clean the text
    const cleanContent = responseText.replace(navigationPattern, (match, screen, paramString) => {
      // Explicitly type params as Record<string, string>
      let params: Record<string, string> = {};
      
      // Parse parameters if they exist
      if (paramString) {
        paramString.split(',').forEach((param: string) => {
          const [key, value] = param.split('=');
          if (key && value) {
            params[key] = value;
          }
        });
      }
      
      // Create a friendly button name based on the screen
      let label = "Go to ";
      switch (screen) {
        case "AccountsOverviewScreen":
          label += "Accounts Overview";
          break;
        case "HomeScreen":
          label += "Home Screen";
          break;
        case "AccountDetailsScreen":
          label += "Account Details";
          break;
        default:
          label += screen;
      }
      
      // Add the navigation option
      navigationOptions.push({
        label: label,
        screen: screen,
        params: params
      });
      
      // Return empty string to remove the command from the text
      return "";
    }).trim();
    
    return { content: cleanContent, navigationOptions };
  };

  // Async function to generate complete financial information including ALL transactions
  const generateFinancialSummary = async () => {
    if (!customerData) {
      return "No customer data available yet.";
    }
  
    // Format all customer data with ALL available fields
    let summary = `CUSTOMER INFORMATION:\n`;
    
    // Add ALL customer details available
    summary += `Full Name: ${customerData.title || ''} ${customerData.name || ''} ${customerData.surname || ''}\n`;
    if (customerData.dob) summary += `Date of Birth: ${customerData.dob}\n`;
    if (customerData.address) summary += `Address: ${customerData.address}\n`;
    if (customerData.city) summary += `City: ${customerData.city}\n`;
    if (customerData.postcode) summary += `Postcode: ${customerData.postcode}\n`;
    if (customerData.nationality) summary += `Nationality: ${customerData.nationality}\n`;
    if (customerData.monthly_income) summary += `Monthly Income: £${customerData.monthly_income}\n`;
    if (customerData.marital_status) summary += `Marital Status: ${customerData.marital_status}\n`;
    
    // Add account information with ALL transactions
    if (accounts && accounts.length > 0) {
      summary += `\nACCOUNTS INFORMATION (${accounts.length} accounts):\n\n`;
      
      // Process each account and fetch ALL its transactions
      for (const account of accounts) {
        // Account details
        const productName = account.product?.product_name || 'Unnamed Account';
        const productType = account.product?.product_type || 'Unknown Type';
        const balance = account.starting_balance !== undefined ? 
          `£${account.starting_balance}` : 'Balance unavailable';
        
        summary += `ACCOUNT: ${productName}\n`;
        summary += `Type: ${productType}\n`;
        summary += `Balance: ${balance}\n`;
        summary += `Account Since: ${account.since || 'Unknown'}\n`;
        
        if (account.product?.product_benefits) {
          summary += `Benefits: ${account.product.product_benefits}\n`;
        }
        
        // Fetch ALL transactions for this account
        try {
          const transactions = await getAccountTransactions(account.account_id);
          
          if (transactions && transactions.length > 0) {
            summary += `\nTRANSACTIONS (${transactions.length}):\n`;
            
            // Include ALL transactions with complete details
            transactions.forEach((transaction, index) => {
              summary += `Transaction #${index + 1}:\n`;
              summary += `  Date: ${transaction.transaction_date || 'Unknown'}\n`;
              summary += `  Reference: ${transaction.transaction_reference || 'No reference'}\n`;
              summary += `  Amount: ${transaction.transaction_amount !== undefined ? 
                `£${transaction.transaction_amount < 0 ? '-' : ''}${Math.abs(transaction.transaction_amount)}` : 
                'Amount not available'}\n`;
              
              // Include any other transaction fields available
              if (transaction.transaction_category) {
                summary += `  Category: ${transaction.transaction_category}\n`;
              }
              
              // Include any additional fields that might be present
              Object.keys(transaction).forEach(key => {
                if (!['transaction_id', 'account_id', 'transaction_date', 'transaction_amount', 
                     'transaction_category', 'transaction_reference'].includes(key)) {
                  summary += `  ${key}: ${transaction[key]}\n`;
                }
              });
              
              summary += `\n`;
            });
          } else {
            summary += `No transactions found for this account.\n`;
          }
        } catch (error) {
          summary += `Error retrieving transactions: ${error}\n`;
        }
        
        summary += `\n--------------------------\n\n`;
      }
    } else {
      summary += `\nNo accounts available.`;
    }
  
    return summary;
  };

  // Updated callTogetherAI function to include navigation instructions
  const callTogetherAI = async (userMessage: string) => {
    try {
      setIsLoading(true);
      
      // Prepare the financial context for the AI - now using await
      const financialSummary = await generateFinancialSummary();
      
      // Construct the complete messages array for the API
      const apiMessages = [
        {
          role: "system",
          content: "You are Bankable AI, a personal finance assistant for Lloyd's Bank. You help users understand their finances, provide advice, and answer questions about their accounts. You have access to the user's complete transaction history and financial details. Use this data to provide highly personalized insights about spending patterns, savings opportunities, and financial health. Always be helpful, concise, and focus on personal finance topics. If asked about banking products, explain you can only provide general information and suggest visiting a branch for specific product offerings.\n\n" +
          "NAVIGATION CAPABILITIES: When users ask where to find features in the app, or how to navigate to certain screens, you should provide very concise navigation instructions and add a navigation command at the end of your response.\n\n" +
          "Navigation command format: [NAVIGATE:ScreenName] or [NAVIGATE:ScreenName:param1=value1,param2=value2]\n\n" +
          "Available screens are ONLY:\n" +
          "- HomeScreen: The main dashboard of the app that provides an overview of key account information and recent activity\n" +
          "- AccountsOverviewScreen: Displays a summary of all user accounts along with available balance information\n" +
          "- AccountDetailsScreen: Provides detailed information for a selected account, typically requiring an accountId parameter to load specifics such as recent transactions and account history\n" +
          "- EcoFinancialImpactScreen: Highlights the environmental and financial impacts of the user's spending and investment choices, promoting eco-friendly banking practices\n" +
          "- BankableVirtualPetScreen: Offers an engaging, gamified feature where users can interact with a virtual pet tied to their saving habits, encouraging regular saving and budgeting\n" +
          "- InvestmentsScreen: Showcases the user's investment portfolio including stocks, bonds, and other financial instruments with relevant market performance data\n" +
          "- DynamicBudgetCalendarScreen: Presents a calendar-based tool for tracking and managing budgets, income, and expenses dynamically over time\n" +
          "- GroupSavingGoalsScreen: Enables collaborative saving where users can create or join saving goals with friends or family, fostering a community-driven approach to financial goals\n" +
          "- LifeEventSupportScreen: Provides tailored financial advice and support tools during major life events such as buying a home, starting a family, or retirement planning\n" +
          "- SettingsScreen: Contains configuration options allowing users to customize their app experience, manage security settings, and update personal information\n" +
          "- LoansScreen: Lists available loan products along with detailed information on terms, interest rates, and application requirements for prospective borrowing\n\n" +
          "Examples:\n" +
          "- For 'Where can I see all my accounts?': End with [NAVIGATE:AccountsOverviewScreen]\n" +
          "- For specific account: [NAVIGATE:AccountDetailsScreen:accountId=account_123]"
        },
        // Include financial context with ALL user data
        {
          role: "system",
          content: `Here is the user's complete financial information including all transaction history:\n${financialSummary}`
        },
        // Include ALL previous messages for context
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        // Add the new user message
        {
          role: "user",
          content: userMessage
        }
      ];

      console.log("Sending request to TogetherAI...");
      
      // Make request to TogetherAI using their updated API format
      const response = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${TOGETHER_API_KEY}`
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error details:", errorText);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response received:", data);
      
      // Handle the response format from TogetherAI
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const responseText = data.choices[0].message.content;
        // Parse the response for navigation commands
        const { content, navigationOptions } = parseNavigationCommands(responseText);
        return { content, navigationOptions };
      } else {
        console.error("Unexpected API response format:", data);
        return { 
          content: "I'm sorry, I received an unexpected response format. Please try again.",
          navigationOptions: [] 
        };
      }
    } catch (error) {
      console.error("Error calling TogetherAI:", error);
      return { 
        content: "I'm sorry, I encountered an error connecting to my knowledge base. Please try again later.",
        navigationOptions: [] 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Update handleSend to work with the new response format
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage = input.trim();
    const userMessageObj: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, userMessageObj]);
    setInput("");
    
    // Get AI response
    const aiResponse = await callTogetherAI(userMessage);
    setMessages(prev => [...prev, { 
      role: "assistant", 
      content: aiResponse.content,
      navigationOptions: aiResponse.navigationOptions
    }]);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat with Bankable AI</Text>
        <Text style={styles.headerSubtitle}>Get personalized financial advice</Text>
      </View>

      {/* Chat Area - This needs to be scrollable and take remaining space */}
      <View style={styles.chatContainer}>
        <ScrollView
          ref={scrollViewRef}
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
              {/* Skip system messages in the UI */}
              {msg.role === "system" ? null : (
                <>
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

                    {/* Navigation buttons - only show for assistant messages */}
                    {msg.role === "assistant" && msg.navigationOptions && msg.navigationOptions.length > 0 && (
                      <View style={styles.navigationButtonsContainer}>
                        {msg.navigationOptions.map((option, optionIndex) => (
                          <TouchableOpacity
                            key={optionIndex}
                            style={styles.navigationButton}
                            onPress={() => handleNavigation(option.screen, option.params)}
                          >
                            <Ionicons name="arrow-forward-circle" size={16} color="#fff" style={styles.navigationButtonIcon} />
                            <Text style={styles.navigationButtonText}>{option.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#006a4d" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
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
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={isLoading || !input.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Add new styles for navigation buttons
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
    paddingBottom: 24,
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
  sendButtonDisabled: {
    backgroundColor: "#73a598",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  loadingText: {
    color: "#666",
    fontSize: 12,
    marginLeft: 8,
  },
  navigationButtonsContainer: {
    marginTop: 12,
  },
  navigationButton: {
    backgroundColor: "#006a4d",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  navigationButtonIcon: {
    marginRight: 6,
  },
  navigationButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});