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
import { useRouter } from "expo-router";
import Constants from "expo-constants";

// Access API Key from Expo constants
const togetherAiApiKey = Constants.expoConfig?.extra?.togetherAiApiKey;

// Define the structure for a chat message
interface Message {
  role: "assistant" | "user" | "system"; // Role of the message sender
  content: string; // Text content of the message
  navigationOptions?: NavigationButton[]; // Optional navigation buttons for assistant messages
}

// Define the structure for navigation buttons within assistant messages
interface NavigationButton {
  label: string; // Text displayed on the button
  screen: string; // Target screen name (must be in SCREEN_PATHS)
  params?: Record<string, string>; // Optional parameters for navigation
}

// TogetherAI API key
const TOGETHER_API_KEY = togetherAiApiKey;

// Define valid screen paths for secure navigation
type ValidScreenPath =
  | "/HomeScreen"
  | "/AccountsOverviewScreen"
  | "/AccountDetailsScreen"
  | "/EcoFinancialImpactScreen"
  | "/BankableVirtualPetScreen"
  | "/InvestmentsScreen"
  | "/BudgetingScreen"
  | "/GroupSavingGoalsScreen"
  | "/LifeEventSupportScreen"
  | "/SettingsScreen"
  | "/LoansScreen";

// Mapping from user-friendly screen names to their valid Expo Router paths
const SCREEN_PATHS: Record<string, ValidScreenPath> = {
  "HomeScreen": "/HomeScreen",
  "AccountsOverviewScreen": "/AccountsOverviewScreen",
  "AccountDetailsScreen": "/AccountDetailsScreen",
  "EcoFinancialImpactScreen": "/EcoFinancialImpactScreen",
  "BankableVirtualPetScreen": "/BankableVirtualPetScreen",
  "InvestmentsScreen": "/InvestmentsScreen",
  "BudgetingScreen": "/BudgetingScreen",
  "GroupSavingGoalsScreen": "/GroupSavingGoalsScreen",
  "LifeEventSupportScreen": "/LifeEventSupportScreen",
  "SettingsScreen": "/SettingsScreen",
  "LoansScreen": "/LoansScreen"
};

// Define hard-coded responses for specific user questions
const hardcodedResponses: Record<string, string> = {
  "How many adults demonstrate adequate financial literacy globally?": "Only 33%!! Insane right? Did you also know that in the UK, 20% of households struggle to cover unexpected expenses?",
  "Well shouldn't the UK be worried then?": "Good question, in fact around 17.7M UK adults suffer daily anxiety about their finances, and nearly 48% of UK adults rely on overdrafts...",
  "This is concerning me, how many families in the UK skip their meals?": "1 in 5 UK households skip meals because of financial reasons.",
  "Okey you've really scared me here, what are some other statistics that can get me a real picture of the problem here?": "It really is a problem, here are some more statistics:\n\n - 11.5 million people in the UK have less than £100 in savings.\n - Nearly 9 million face serious debt, yet only a third receive any help.\n - In response: nearly 90% of banks worldwide are ramping up digital investments to meet evolving customer needs."
};

/**
 * Bankable AI Screen Component.
 * Provides a chat interface for users to interact with a financial AI assistant.
 * Fetches user financial data to provide context for the AI.
 * Handles user input, displays chat history, and manages loading states.
 * Includes functionality for hard-coded responses and AI-driven navigation suggestions.
 */
export default function BankableAIScreen() {
  // State for storing the chat message history
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm Bankable AI, your AI Financial Health Coach. How can I assist you with your finances today?",
    },
  ]);
  // State for the user's current input text
  const [input, setInput] = useState("");
  // State to indicate if the AI is currently processing a request
  const [isLoading, setIsLoading] = useState(false);
  // Ref for the ScrollView to enable auto-scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  // Expo Router instance for navigation
  const router = useRouter();
  // State to track if the chat view has been scrolled (for header shadow)
  const [isScrolled, setIsScrolled] = useState(false);

  // Function to handle scroll events and update the isScrolled state
  const handleScroll = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setIsScrolled(scrollY > 5); // Add shadow after scrolling 5px
  };

  // Get user data and account information from the UserContext
  const { customerData, accounts, isLoading: userDataLoading } = useUser();

  /**
   * Handles navigation requests triggered by AI response buttons.
   * Validates the target screen against SCREEN_PATHS before navigating.
   * @param screen - The target screen name.
   * @param params - Optional navigation parameters.
   */
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

  /**
   * Parses the AI's response text to extract navigation commands.
   * Removes the commands from the text and returns the clean content
   * along with an array of navigation options (buttons).
   * @param responseText - The raw text response from the AI.
   * @returns An object containing the cleaned content and navigation options.
   */
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

  /**
   * Asynchronously generates a comprehensive financial summary string.
   * Includes customer details, account information, and ALL transactions for each account.
   * Fetches transactions using getAccountTransactions.
   * @returns A string containing the formatted financial summary.
   */
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

  /**
   * Calls the TogetherAI API to get a response based on the user's message
   * and the generated financial context.
   * Includes system prompts, financial summary, message history, and the user's input.
   * Handles API errors and parses the response for content and navigation commands.
   * @param userMessage - The message entered by the user.
   * @returns An object containing the AI's response content and navigation options.
   */
  const callTogetherAI = async (userMessage: string) => {
    try {
      setIsLoading(true);

      // Generate the financial context asynchronously
      const financialSummary = await generateFinancialSummary();

      // Construct the messages array for the API call
      const apiMessages = [
        // System prompt defining the AI's role, capabilities, and navigation format
        {
          role: "system",
          content: "You are Bankable AI, a personal finance assistant for Bankable. You help users understand their finances, provide advice, and answer questions about their accounts. You have access to the user's complete transaction history and financial details. Use this data to provide highly personalized insights about spending patterns, savings opportunities, and financial health. Always be helpful, concise, and focus on personal finance topics. If asked about banking products, explain you can only provide general information and suggest visiting a branch for specific product offerings.\n\n" +
          "NAVIGATION CAPABILITIES: When users ask where to find features in the app, or how to navigate to certain screens, you should provide very concise navigation instructions and add a navigation command at the end of your response.\n\n" +
          "Navigation command format: [NAVIGATE:ScreenName] or [NAVIGATE:ScreenName:param1=value1,param2=value2]\n\n" +
          "Available screens are ONLY:\n" +
          "- HomeScreen: The main dashboard of the app that provides an overview of key account information and recent activity\n" +
          "- AccountsOverviewScreen: Displays a summary of all user accounts along with available balance information\n" +
          "- AccountDetailsScreen: Provides detailed information for a selected account, typically requiring an accountId parameter to load specifics such as recent transactions and account history\n" +
          "- EcoFinancialImpactScreen: Highlights the environmental and financial impacts of the user's spending and investment choices, promoting eco-friendly banking practices\n" +
          "- BankableVirtualPetScreen: Offers an engaging, gamified feature where users can interact with a virtual pet tied to their saving habits, encouraging regular saving and budgeting\n" +
          "- InvestmentsScreen: Showcases the user's investment portfolio including stocks, bonds, and other financial instruments with relevant market performance data\n" +
          "- BudgetingScreen: Presents a calendar-based tool for tracking and managing budgets, income, and expenses dynamically over time\n" +
          "- GroupSavingGoalsScreen: Enables collaborative saving where users can create or join saving goals with friends or family, fostering a community-driven approach to financial goals\n" +
          "- LifeEventSupportScreen: Provides tailored financial advice and support tools during major life events such as buying a home, starting a family, or retirement planning\n" +
          "- SettingsScreen: Contains configuration options allowing users to customize their app experience, manage security settings, and update personal information\n" +
          "- LoansScreen: Lists available loan products along with detailed information on terms, interest rates, and application requirements for prospective borrowing\n\n" +
          "Examples:\n" +
          "- For 'Where can I see all my accounts?': End with [NAVIGATE:AccountsOverviewScreen]\n" +
          "- For specific account: [NAVIGATE:AccountDetailsScreen:accountId=account_123]"
        },
        // Include the generated financial summary as system context
        {
          role: "system",
          content: `Here is the user's complete financial information including all transaction history:\n${financialSummary}`
        },
        // Include previous messages for conversation context
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        // Add the current user message
        {
          role: "user",
          content: userMessage
        }
      ];

      console.log("Sending request to TogetherAI...");

      // Make the API request to TogetherAI
      const response = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${TOGETHER_API_KEY}`
        },
        body: JSON.stringify({
          // Use a fixed model name instead of selectedModel
          model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      console.log("Response status:", response.status);

      // Handle API errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error details:", errorText);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response received:", data);

      // Process the successful response
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const responseText = data.choices[0].message.content;
        // Parse for navigation commands
        const { content, navigationOptions } = parseNavigationCommands(responseText);
        return { content, navigationOptions };
      } else {
        // Handle unexpected response format
        console.error("Unexpected API response format:", data);
        return {
          content: "I'm sorry, I received an unexpected response format. Please try again.",
          navigationOptions: []
        };
      }
    } catch (error) {
      // Handle network or other errors during the API call
      console.error("Error calling TogetherAI:", error);
      return {
        content: "I'm sorry, I encountered an error connecting to my knowledge base. Please try again later.",
        navigationOptions: []
      };
    } finally {
      // Ensure loading state is turned off
      setIsLoading(false);
    }
  };

  /**
   * Handles the action when the user presses the send button or submits the input.
   * Adds the user's message to the chat.
   * Checks for hard-coded responses first.
   * If no hard-coded response matches, calls the TogetherAI API.
   * Adds the AI's response (or hard-coded response) to the chat.
   */
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage = input.trim();
    const userMessageObj: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, userMessageObj]);
    setInput("");

    // Check for hard-coded responses
    if (hardcodedResponses[userMessage]) {
      setIsLoading(true); // Show loading indicator
      setTimeout(() => {
        const hardcodedAnswer = hardcodedResponses[userMessage];
        setMessages(prev => [...prev, {
          role: "assistant",
          content: hardcodedAnswer,
          navigationOptions: [] // No navigation for hard-coded responses
        }]);
        setIsLoading(false); // Hide loading indicator
      }, 1000); // Simulate 1 second delay
    } else {
      // Get AI response if not a hard-coded question
      const aiResponse = await callTogetherAI(userMessage);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: aiResponse.content,
        navigationOptions: aiResponse.navigationOptions
      }]);
    }
  };

  // Effect hook to automatically scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Main component render
  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header Section: Displays title and subtitle, with dynamic shadow */}
        <View style={[styles.header, isScrolled && styles.headerWithShadow]}>
          <Text style={styles.headerTitle}>Chat with Bankable AI</Text>
          <Text style={styles.headerSubtitle}>Get personalized financial advice</Text>
        </View>

        {/* Chat Area: Displays the conversation history */}
        <View style={styles.chatContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll} // Attach scroll handler
            scrollEventThrottle={16} // Optimize scroll event frequency
          >
            {/* Map through messages and render each one */}
            {messages.map((msg, index) => (
              // Skip rendering system messages
              msg.role === "system" ? null : (
                <View
                  key={index}
                  style={[
                    styles.messageRow,
                    // Apply different styles based on message role (user or assistant)
                    msg.role === "assistant" ? styles.assistantRow : styles.userRow,
                  ]}
                >
                  {/* Display assistant icon for assistant messages */}
                  {msg.role === "assistant" && (
                    <Image
                      source={{
                        uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_2024-11-17_at_7.03.16_PM-removebg-preview-qYVjiMHoaYBDi7UFT0Diy07RmwLjrH.png",
                      }}
                      style={styles.assistantIcon}
                    />
                  )}
                  {/* Message bubble containing the text content */}
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

                    {/* Display navigation buttons if available for assistant messages */}
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
                </View>
              )
            ))}

            {/* Loading Indicator: Shown while waiting for AI response */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#006a4d" />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Input Area: Contains text input and send button */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask your financial question..."
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend} // Send message on keyboard submit
            returnKeyType="send" // Show "send" on keyboard
            editable={!isLoading} // Disable input while loading
          />
          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.sendButtonDisabled]} // Style changes when disabled
            onPress={handleSend}
            disabled={isLoading || !input.trim()} // Disable button while loading or if input is empty
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

// Styles definition
const styles = StyleSheet.create({
  // Main container for the screen
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  // Header section style
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    zIndex: 10, // Keep header above scrolling content
    // Default shadow (invisible)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // Style for the main header title
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000", // Use hex code for black
    marginBottom: 4,
  },
  // Style for the header subtitle
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  // Style applied to the header when scrolled to add shadow
  headerWithShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // Android shadow
  },
  // Container for the chat messages area
  chatContainer: {
    flex: 1, // Take remaining vertical space
    backgroundColor: "#ffffff",
  },
  // ScrollView containing the messages
  scrollView: {
    flex: 1,
  },
  // Content container style for the ScrollView (adds padding)
  scrollContent: {
    padding: 16,
    paddingBottom: 24, // Extra padding at the bottom
  },
  // Style for a single message row (holds icon and bubble)
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end", // Align bubble bottom with icon bottom
    marginBottom: 12,
  },
  // Style specific to assistant message rows (align left)
  assistantRow: {
    justifyContent: "flex-start",
  },
  // Style specific to user message rows (align right)
  userRow: {
    justifyContent: "flex-end",
  },
  // Style for the assistant's icon (turtle)
  assistantIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  // General style for message bubbles
  messageBubble: {
    maxWidth: "80%", // Limit bubble width
    borderRadius: 8,
    padding: 10,
  },
  // Background color for assistant messages
  assistantBubble: {
    backgroundColor: '#015F45', // Bankable dark green
  },
  // Background color for user messages
  userBubble: {
    backgroundColor: "#f3fee8", // Bankable light green
  },
  // Text color for assistant messages
  assistantText: {
    color: "#ffffff", // White text on dark green
  },
  // Text color for user messages
  userText: {
    color: "#000000", // Black text on light green
  },
  // General text style within message bubbles
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Container for the text input and send button
  inputContainer: {
    flexDirection: "row",
    padding: 8,
    marginBottom: 16, // Margin below input area
    backgroundColor: '#ffffff',
    alignItems: "center",
  },
  // Style for the text input field
  textInput: {
    flex: 1, // Take available horizontal space
    height: 50,
    backgroundColor: "#f3fee8", // Light green background
    borderRadius: 24, // Rounded corners
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8, // Space between input and button
    color: "#333", // Dark text color
    // Subtle shadow for input field
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  // Style for the send button
  sendButton: {
    backgroundColor: "#006a4d", // Bankable primary green
    padding: 12,
    borderRadius: 24, // Circular button
  },
  // Style for the send button when disabled
  sendButtonDisabled: {
    backgroundColor: "#73a598", // Lighter, muted green
  },
  // Container for the loading indicator and text
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  // Style for the "Thinking..." text
  loadingText: {
    color: "#666",
    fontSize: 12,
    marginLeft: 8,
  },
  // Container for navigation buttons below an assistant message
  navigationButtonsContainer: {
    marginTop: 12, // Space above buttons
  },
  // Style for individual navigation buttons
  navigationButton: {
    backgroundColor: "#f3fee8", // Light green background
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16, // Pill shape
    marginTop: 8, // Space between multiple buttons
  },
  // Style for the icon within navigation buttons
  navigationButtonIcon: {
    marginRight: 6,
    color: "#000000", // Black icon
  },
  // Style for the text within navigation buttons
  navigationButtonText: {
    color: "#000000", // Black text
    fontSize: 14,
    fontWeight: "500",
  },
});