import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Dimensions, SafeAreaView, TouchableOpacity } from 'react-native';
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
  const videoRef = useRef<AV.Video>(null);
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    const loadVideo = async () => {
      try {
        await videoRef.current?.loadAsync(require('../assets/videos/VIDEO-3.mp4'));
        await videoRef.current?.playAsync();
        await videoRef.current?.setIsLoopingAsync(true);
      } catch (error) {
        console.error("Error loading video:", error);
      }
    };

    loadVideo();
  }, []);

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

  return (
    <View style={styles.container}>
      <AV.Video
        ref={videoRef}
        source={require('../assets/videos/VIDEO-3.mp4')}
        style={[styles.video, { width, height }]}
        resizeMode={AV.ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />

      {/* Overlay Content */}
      <SafeAreaView style={styles.overlay}>
        <View style={styles.contentContainer}>
          <Text style={styles.slogan}>Money Made Simple - Let's Begin</Text>
          
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
            <Button
              onPress={handleLogin}
              style={styles.loginButton}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </View>

          {/* Dev Login Button */}
          <TouchableOpacity onPress={handleDevLogin} style={{ marginTop: 16 }}>
            <Text style={{ color: '#ffffffaa', fontSize: 14, textAlign: 'center' }}>
              Dev Login
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 2,
    paddingBottom: 100,
  },
  contentContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  slogan: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 40,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
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
