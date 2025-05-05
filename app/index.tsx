import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Modal, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router'; // Hook for navigation
import { signInWithNames } from '../api/auth'; // API function for user authentication
import { useUser } from '../context/UserContext'; // Context hook to access user state and actions
import { Button } from '../components/ui/button'; // Custom Button component
import { VideoView, useVideoPlayer } from 'expo-video'; // Video player components from expo-video
import 'react-native-gesture-handler'; // Required for gesture handling (likely for navigation or other libraries)
import 'react-native-reanimated'; // Required for animations
import { Ionicons } from '@expo/vector-icons'; // Icon library

/**
 * IndexScreen Component: The initial screen of the app, handling the splash video and user login.
 */
export default function IndexScreen() {
  // --- Hooks ---
  const router = useRouter(); // Navigation router instance
  const { setCustomerId, setCustomerName, setCustomerData, fetchAccountsData } = useUser(); // User context actions

  // --- State ---
  const [firstName, setFirstName] = useState(''); // State for the username (first name) input
  const [lastName, setLastName] = useState(''); // State for the password (last name) input
  const [isLoading, setIsLoading] = useState(false); // State to indicate if login is in progress
  const [splashComplete, setSplashComplete] = useState(false); // State to track if the splash video has finished
  const [showInfoModal, setShowInfoModal] = useState(false); // State to control the visibility of the demo login info modal
  const [inputStage, setInputStage] = useState('username'); // State to manage which input field is currently active ('username' or 'password')

  // --- Refs ---
  const hasSetFinalFrame = useRef(false); // Ref to track if the video has reached its intended end point
  const fadeAnim = useRef(new Animated.Value(0)).current; // Ref for the fade-in animation of the login UI
  const usernameInputRef = useRef<TextInput>(null); // Ref for the username input field
  const passwordInputRef = useRef<TextInput>(null); // Ref for the password input field
  const startTime = useRef(Date.now()); // Ref to store the timestamp when the video started playing

  // --- Constants ---
  // Hardcoded video duration - adjusted to stop before the logo fully fades in the video
  const VIDEO_DURATION = 5300; // Milliseconds

  // --- Video Player Setup ---
  // Create video player instance using the hook, providing the video source and configuration
  const videoPlayer = useVideoPlayer(require('../assets/videos/VIDEO.mp4'), (player) => {
    player.loop = false; // Don't loop the video
    player.play(); // Start playing immediately
  });

  // --- Animation Values ---
  // Refs for opacity and translation animations for the username and password input fields
  const usernameAnimOpacity = useRef(new Animated.Value(1)).current; // Opacity for username input
  const passwordAnimOpacity = useRef(new Animated.Value(0)).current; // Opacity for password input
  const usernameAnimTranslate = useRef(new Animated.Value(0)).current; // Translation (horizontal) for username input
  const passwordAnimTranslate = useRef(new Animated.Value(20)).current; // Translation (horizontal) for password input

  // --- Effects ---
  // Effect to monitor video playback progress and transition to the login UI
  useEffect(() => {
    // Set up an interval timer to check elapsed time
    const timer = setInterval(() => {
      // Check only if splash isn't marked complete and the final frame logic hasn't run yet
      if (!splashComplete && !hasSetFinalFrame.current) {
        const elapsed = Date.now() - startTime.current; // Calculate time since video started
        // Check if elapsed time is near the target video duration
        if (elapsed >= VIDEO_DURATION - 100) {
          console.log('Video near end, showing login UI');
          hasSetFinalFrame.current = true; // Mark final frame logic as run
          clearInterval(timer); // Stop the interval timer

          try {
            videoPlayer.pause(); // Attempt to pause the video player
          } catch (err) {
            console.error('Error pausing video:', err); // Log any errors during pause
          }

          // Mark splash as complete and set the login UI opacity to 1 immediately
          // This avoids a fade-in that might occur after the video logo has faded
          setSplashComplete(true);
          fadeAnim.setValue(1); // Set opacity directly to 1
        }
      }
    }, 100); // Check every 100ms

    // Cleanup function: clear the interval timer when the component unmounts or dependencies change
    return () => clearInterval(timer);
  }, [videoPlayer, splashComplete, fadeAnim]); // Dependencies: run effect if these change

  // --- Event Handlers ---
  /**
   * Handles the login process when the user submits their credentials.
   * Validates input, calls the authentication API, updates user context, and navigates to HomeScreen on success.
   * Shows an alert on error.
   */
  const handleLogin = async () => {
    // Basic validation: check if both fields are filled
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Login Error', 'Please enter both Username and Password');
      return;
    }

    setIsLoading(true); // Set loading state to true

    try {
      // Call the authentication API with first and last names
      const user = await signInWithNames(firstName, lastName);
      // Update user context with the retrieved user data
      setCustomerId(user.customer_id);
      setCustomerName(`${user.name} ${user.surname}`);
      setCustomerData(user);
      // Fetch the user's account data after successful login
      await fetchAccountsData(user.customer_id);
      // Navigate to the main HomeScreen
      router.push('/HomeScreen');
    } catch (error) {
      // Show an error alert if login fails
      Alert.alert(
        'Login Error',
        error instanceof Error ? error.message : 'An unexpected error occurred.'
      );
    } finally {
      setIsLoading(false); // Set loading state back to false
    }
  };

  /**
   * Shows the modal containing demo login information.
   */
  const showLoginInfo = () => {
    setShowInfoModal(true);
  };

  /**
   * Handles the transition from the username input field to the password input field.
   * Includes animations for a smooth visual transition.
   */
  const moveToPasswordInput = () => {
    // Validate that username is entered
    if (!firstName.trim()) {
      Alert.alert('Username Required', 'Please enter your username to continue');
      return;
    }

    // Animate out the username field (fade out and move up)
    Animated.parallel([
      Animated.timing(usernameAnimOpacity, {
        toValue: 0, // Fade out
        duration: 200,
        useNativeDriver: true, // Use native driver for performance
      }),
      Animated.timing(usernameAnimTranslate, {
        toValue: -20, // Move up slightly
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After username animation completes, update the input stage
      setInputStage('password');

      // Animate in the password field (fade in and move from bottom)
      Animated.parallel([
        Animated.timing(passwordAnimOpacity, {
          toValue: 1, // Fade in
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(passwordAnimTranslate, {
          toValue: 0, // Move to original position
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Focus the password input field shortly after animation starts
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 50);
      });
    });
  };

  /**
   * Handles the transition from the password input field back to the username input field.
   * Includes animations for a smooth visual transition.
   */
  const moveToUsernameInput = () => {
    // Animate out the password field (fade out and move down)
    Animated.parallel([
      Animated.timing(passwordAnimOpacity, {
        toValue: 0, // Fade out
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(passwordAnimTranslate, {
        toValue: 20, // Move down slightly
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After password animation completes, update the input stage
      setInputStage('username');

      // Animate in the username field (fade in and move from top)
      Animated.parallel([
        Animated.timing(usernameAnimOpacity, {
          toValue: 1, // Fade in
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(usernameAnimTranslate, {
          toValue: 0, // Move to original position
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Focus the username input field shortly after animation starts
        setTimeout(() => {
          usernameInputRef.current?.focus();
        }, 50);
      });
    });
  };

  // --- Render ---
  return (
    <View style={styles.container}>
      {/* Video Background Section */}
      <View style={styles.videoWrapper}>
        <VideoView
          player={videoPlayer} // Assign the created video player instance
          style={styles.video}
          nativeControls={false} // Hide native video controls
        />
      </View>

      {/* Login UI Overlay - Shown only after splash video completes */}
      {splashComplete && (
        <Animated.View
          style={[
            styles.overlay, // Base overlay styles
            { opacity: fadeAnim } // Apply fade-in animation
          ]}
        >
          {/* Keyboard Avoiding View to adjust layout when keyboard is open */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Platform-specific behavior
            style={styles.contentContainer}
          >
            {/* Demo Info Button Section */}
            <View style={styles.prototypeInfoContainer}>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={showLoginInfo} // Show modal on press
                activeOpacity={0.7} // Opacity feedback on press
              >
                <Ionicons name="information-circle-outline" size={24} color="white" />
                <Text style={styles.infoButtonText}>Demo Login Info</Text>
              </TouchableOpacity>
            </View>

            {/* Username Input Section (Animated) */}
            <Animated.View
              style={[
                styles.inputContainer, // Base container style
                {
                  opacity: usernameAnimOpacity, // Apply opacity animation
                  transform: [{ translateX: usernameAnimTranslate }], // Apply translation animation
                  // Conditionally position off-screen when not active
                  position: inputStage === 'username' ? 'relative' : 'absolute',
                  zIndex: inputStage === 'username' ? 1 : 0 // Ensure active input is on top
                }
              ]}
            >
              <TextInput
                ref={usernameInputRef} // Assign ref
                style={styles.input}
                placeholder="Username (First Name)"
                value={firstName}
                onChangeText={setFirstName} // Update state on change
                placeholderTextColor="rgba(255,255,255,0.7)"
                returnKeyType="done" // Keyboard return key type
                onSubmitEditing={moveToPasswordInput} // Move to password on submit
                autoFocus={inputStage === 'username'} // Autofocus when this stage is active
              />
              <View style={styles.buttonContainer}>
                <Button onPress={moveToPasswordInput} style={styles.loginButton}>
                  Next
                </Button>
              </View>
            </Animated.View>

            {/* Password Input Section (Animated) */}
            <Animated.View
              style={[
                styles.inputContainer, // Base container style
                {
                  opacity: passwordAnimOpacity, // Apply opacity animation
                  transform: [{ translateX: passwordAnimTranslate }], // Apply translation animation
                  // Conditionally position off-screen when not active
                  position: inputStage === 'password' ? 'relative' : 'absolute',
                  zIndex: inputStage === 'password' ? 1 : 0 // Ensure active input is on top
                }
              ]}
            >
              {/* Header for password input showing username and back button */}
              <View style={styles.passwordHeader}>
                <TouchableOpacity
                  onPress={moveToUsernameInput} // Go back to username input
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                {/* Display the entered username */}
                <Text style={styles.usernameDisplay}>{firstName}</Text>
              </View>
              <TextInput
                ref={passwordInputRef} // Assign ref
                style={styles.input}
                placeholder="Password (Last Name)"
                value={lastName}
                onChangeText={setLastName} // Update state on change
                placeholderTextColor="rgba(255,255,255,0.7)"
                secureTextEntry={true} // Mask password input
                returnKeyType="done" // Keyboard return key type
                onSubmitEditing={handleLogin} // Attempt login on submit
                autoFocus={inputStage === 'password'} // Autofocus when this stage is active
              />
              <View style={styles.buttonContainer}>
                {/* Ensure the disabled prop receives an explicit boolean value */}
                <Button onPress={handleLogin} style={styles.loginButton}>
                  {/* Show loading text or default text */}
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

      {/* Login Info Modal */}
      <Modal
        visible={showInfoModal} // Controlled by state
        transparent={true} // Allows overlay background
        animationType="fade" // Fade animation for modal
        onRequestClose={() => setShowInfoModal(false)} // Handle Android back button
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Demo Login Credentials</Text>

            {/* Prototype disclaimer */}
            <Text style={styles.prototypeText}>
                This is a prototype application with sample data
              </Text>

            {/* Container for displaying demo usernames and passwords */}
            <View style={styles.credentialsContainer}>
              <View style={styles.credentialRow}>
                {/* Username Column */}
                <View style={styles.credentialColumn}>
                  <Text style={styles.credentialHeader}>Username</Text>
                  <Text style={styles.credentialValue}>Oliver</Text>
                  <Text style={styles.credentialValue}>Georgia</Text>
                  <Text style={styles.credentialValue}>Jessica</Text>
                </View>
                {/* Password Column */}
                <View style={styles.credentialColumn}>
                  <Text style={styles.credentialHeader}>Password</Text>
                  <Text style={styles.credentialValue}>Palmer</Text>
                  <Text style={styles.credentialValue}>Price</Text>
                  <Text style={styles.credentialValue}>Glover</Text>
                </View>
              </View>
            </View>

            {/* Close button for the modal */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowInfoModal(false)} // Close modal on press
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  // Main container covering the entire screen
  container: {
    flex: 1,
    backgroundColor: '#015F45', // Fallback background color, matches video start/end
    overflow: 'hidden', // Prevent content spilling
  },
  // Wrapper for the video to allow scaling and positioning
  videoWrapper: {
    position: 'absolute',
    width: '120%', // Scale slightly larger than screen
    height: '120%',
    left: '-10%', // Center the oversized video
    top: '-10%',
    backgroundColor: '#015F45', // Background color during video load/transition
    overflow: 'hidden', // Clip the video to the wrapper bounds
    zIndex: 1, // Place video behind the overlay
  },
  // Video element style
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#015F45', // Background color for the video component itself
    margin: 0,
    padding: 0,
  },
  // Overlay container for login UI, positioned absolutely over the video
  overlay: {
    ...StyleSheet.absoluteFillObject, // Take up the entire screen
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    backgroundColor: 'rgba(1, 95, 69, 0.0)', // Fully transparent background initially
    zIndex: 2, // Place overlay above the video
  },
  // Container for the main login form content within the overlay
  contentContainer: {
    width: '100%',
    paddingHorizontal: 24, // Horizontal padding
    alignItems: 'center', // Center items horizontally
    marginTop: 180, // Push content down from the top
  },
  // Container for the "Demo Login Info" button
  prototypeInfoContainer: {
    alignItems: 'center',
    marginBottom: 20, // Space below the info button
  },
  // Style for the "Demo Login Info" button
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.2)', // Semi-transparent white background
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20, // Rounded corners
    alignSelf: 'center', // Center the button itself
  },
  // Text style for the "Demo Login Info" button
  infoButtonText: {
    color: 'white',
    marginLeft: 6, // Space between icon and text
    fontWeight: '500',
  },
  // Text style for the prototype disclaimer in the modal
  prototypeText: {
    color: 'rgba(26, 23, 23, 0.8)', // Dark semi-transparent text
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20, // Space below the text
  },
  // Style for the TextInput fields (username and password)
  input: {
    height: 50,
    width: '85%', // Input field width relative to container
    backgroundColor: 'rgba(255,255,255,0.2)', // Semi-transparent white background
    borderRadius: 10, // Rounded corners
    marginBottom: 16, // Space below input field
    paddingHorizontal: 16, // Inner horizontal padding
    fontSize: 16,
    color: '#ffffff', // White text color
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)', // Subtle border
  },
  // Container for the login/next button
  buttonContainer: {
    marginTop: 12, // Space above the button
    width: '85%', // Button width relative to container
  },
  // Style for the main login/next button
  loginButton: {
    backgroundColor: '#015f45', // Bankable green background
    height: 50,
    borderRadius: 10, // Rounded corners
    borderWidth: 1.5,
    borderColor: 'white', // White border
  },
  // Style for the semi-transparent overlay behind the modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // Padding around the modal content
  },
  // Style for the main content area of the modal
  modalContent: {
    backgroundColor: 'white', // White background
    borderRadius: 16, // Rounded corners
    padding: 20, // Inner padding
    width: '85%', // Modal width relative to screen
    maxWidth: 350, // Maximum width for larger screens
    alignItems: 'center', // Center content horizontally
  },
  // Style for the modal title text
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#015f45', // Bankable green text
    marginBottom: 20, // Space below title
    textAlign: 'center',
  },
  // Container for the demo credentials display within the modal
  credentialsContainer: {
    width: '100%',
    marginBottom: 24, // Space below credentials
  },
  // Row layout for username/password columns
  credentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space out columns
    width: '100%',
  },
  // Column layout for username or password list
  credentialColumn: {
    flex: 1, // Each column takes equal space
    alignItems: 'center', // Center text within the column
  },
  // Header text style for "Username" and "Password"
  credentialHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333', // Dark text
    marginBottom: 12, // Space below header
  },
  // Text style for the actual demo credential values
  credentialValue: {
    fontSize: 16,
    color: '#015f45', // Bankable green text
    marginBottom: 10, // Space between values
  },
  // Style for the modal close button
  closeButton: {
    backgroundColor: '#015f45', // Bankable green background
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25, // Pill shape
    alignItems: 'center',
  },
  // Text style for the modal close button
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Header container for the password input stage (back button + username)
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%', // Match input width
    marginBottom: 16, // Space below header
  },
  // Style for the back button (arrow icon)
  backButton: {
    padding: 8, // Increase touchable area
  },
  // Style for displaying the entered username in the password stage header
  usernameDisplay: {
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
    marginLeft: 10, // Space between back button and username
  },
  // Container for each input field (username or password) to manage layout and animation
  inputContainer: {
    width: '100%',
    alignItems: 'center', // Center input and button within the container
  },
});