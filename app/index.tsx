import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Dimensions, SafeAreaView, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithNames } from '../api/auth';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/button';
import * as AV from 'expo-av';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

export default function IndexScreen() {
  const router = useRouter();
  const { setCustomerId, setCustomerName, setCustomerData, fetchAccountsData } = useUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);
  const videoRef = useRef<AV.Video | null>(null);
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    const playSplashVideo = async () => {
      try {
        if (videoRef.current) {
          await videoRef.current.loadAsync(require('../assets/videos/VIDEO.mp4'));
          await videoRef.current.playAsync();
          await videoRef.current.setIsLoopingAsync(false);
        }
      } catch (error) {
        console.error("Error loading splash video:", error);
        // If video fails to load, proceed directly to the login screen
        setSplashComplete(true);
      }
    };

    playSplashVideo();
    
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  // Handle video playback status updates
  const onPlaybackStatusUpdate = (status: AV.AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      // Video has finished playing, transition to login screen with background image
      setSplashComplete(true);
    }
  };

  const handleLogin = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Login Error', 'Please enter both User ID and Password');
      return;
    }

    setIsLoading(true);
    
    try {
      // Get user data from authentication
      const user = await signInWithNames(firstName, lastName);
      
      // Set all relevant user data in context
      setCustomerId(user.customer_id);
      setCustomerName(`${user.name} ${user.surname}`);
      setCustomerData(user);
      
      // Pre-fetch accounts data for the user
      await fetchAccountsData(user.customer_id);
      
      // Navigate to home screen
      router.push('/HomeScreen');
    } catch (error) {
      Alert.alert(
        'Login Error',
        error instanceof Error ? error.message : 'An unexpected error occurred.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Simplified Dev Login: direct navigation
  const handleDevLogin = () => {
    // For dev login, we can set a fixed customer ID to fetch real data
    const devCustomerId = "C0001"; // Replace with a valid customer ID from your database
    setCustomerId(devCustomerId);
    setCustomerName("Dev User");
    
    // Optional: Pre-fetch accounts for the dev user
    fetchAccountsData(devCustomerId).catch(console.error);
    
    router.push('/HomeScreen');
  };

  // Render splash screen during video playback
  if (!splashComplete) {
    return (
      <View style={styles.container}>
        <AV.Video
          ref={videoRef}
          source={require('../assets/videos/VIDEO.mp4')}
          style={styles.video}
          resizeMode={AV.ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          isMuted
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />
      </View>
    );
  }

  // Render login screen with background image after splash video completes
  return (
    <View style={styles.container}>
      <AV.Video
        ref={videoRef}
        source={require('../assets/videos/VIDEO.mp4')}
        style={styles.video}
        resizeMode={AV.ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        isMuted
      />
      <View style={styles.overlay}>
        <View style={styles.contentContainer}>
          <TextInput
            style={styles.input}
            placeholder="User ID"
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor="rgba(255,255,255,0.7)"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={lastName}
            onChangeText={setLastName}
            placeholderTextColor="rgba(255,255,255,0.7)"
            secureTextEntry={true}
          />
          <View style={styles.buttonContainer}>
            <Button onPress={handleLogin} style={styles.loginButton}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#277846',
  },
  video: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  contentContainer: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 200,
  },
  input: {
    height: 48,
    width: '80%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  buttonContainer: {
    marginTop: 12,
    width: '80%',
  },
  loginButton: {
    backgroundColor: '#006a4d',
    height: 48,
    borderRadius: 8,
  },
});