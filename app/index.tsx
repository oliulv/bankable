import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Modal, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithNames } from '../api/auth';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/button';
import * as AV from 'expo-av';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export default function IndexScreen() {
  const router = useRouter();
  const { setCustomerId, setCustomerName, setCustomerData, fetchAccountsData } = useUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const videoRef = useRef<AV.Video | null>(null);
  const hasSetFinalFrame = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Hardcoded video duration
  const VIDEO_DURATION = 5437;

  useEffect(() => {
    const playSplashVideo = async () => {
      try {
        if (videoRef.current) {
          // Load and play the video
          await videoRef.current.loadAsync(require('../assets/videos/VIDEO.mp4'), {}, false);
          await videoRef.current.setIsLoopingAsync(false);
          await videoRef.current.playAsync();
        }
      } catch (error) {
        console.error("Error loading splash video:", error);
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

  const onPlaybackStatusUpdate = (status: AV.AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    
    // Check if video is near the end (last 100ms)
    if (status.positionMillis > 0 && 
        status.positionMillis >= VIDEO_DURATION - 100 && 
        !hasSetFinalFrame.current) {
      
      console.log('Video near end, freezing on final frame');
      hasSetFinalFrame.current = true;
      
      // Pause the video at the current position (final frame)
      if (videoRef.current) {
        videoRef.current.pauseAsync().catch(err => 
          console.error('Error pausing video:', err)
        );
      }
      
      // Show the login UI with fade-in animation
      setSplashComplete(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
    
    // Alternative check using didJustFinish
    if (status.didJustFinish && !hasSetFinalFrame.current) {
      console.log('Video finished, freezing on final frame');
      hasSetFinalFrame.current = true;
      
      // Set to the last frame and pause
      if (videoRef.current) {
        videoRef.current.setPositionAsync(VIDEO_DURATION - 50)
          .then(() => videoRef.current?.pauseAsync())
          .catch(err => console.error('Error setting final position:', err));
      }
      
      // Show the login UI with fade-in animation
      setSplashComplete(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogin = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Login Error', 'Please enter both Username and Password');
      return;
    }

    setIsLoading(true);
    
    try {
      const user = await signInWithNames(firstName, lastName);
      setCustomerId(user.customer_id);
      setCustomerName(`${user.name} ${user.surname}`);
      setCustomerData(user);
      await fetchAccountsData(user.customer_id);
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

  const showLoginInfo = () => {
    setShowInfoModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Video background - plays during splash and freezes for login */}
      <AV.Video
        ref={videoRef}
        source={require('../assets/videos/VIDEO.mp4')}
        style={styles.video}
        resizeMode={AV.ResizeMode.COVER}
        shouldPlay={true}
        isLooping={false}
        isMuted
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      />

      {/* Only show login content after splash is complete */}
      {splashComplete && (
        <Animated.View 
          style={[
            styles.overlay, 
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.contentContainer}>
            <View style={styles.prototypeInfoContainer}>
              <TouchableOpacity 
                style={styles.infoButton} 
                onPress={showLoginInfo}
                activeOpacity={0.7}
              >
                <Ionicons name="information-circle-outline" size={24} color="white" />
                <Text style={styles.infoButtonText}>Demo Login Info</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Username (First Name)"
              value={firstName}
              onChangeText={setFirstName}
              placeholderTextColor="rgba(255,255,255,0.7)"
            />
            <TextInput
              style={styles.input}
              placeholder="Password (Last Name)"
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
        </Animated.View>
      )}

      {/* Login Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Demo Login Credentials</Text>

            <Text style={styles.prototypeText}>
                This is a prototype application with sample data
              </Text>
            
            <View style={styles.credentialsContainer}>
              <View style={styles.credentialRow}>
                <View style={styles.credentialColumn}>
                  <Text style={styles.credentialHeader}>Username</Text>
                  <Text style={styles.credentialValue}>Oliver</Text>
                  <Text style={styles.credentialValue}>Georgia</Text>
                  <Text style={styles.credentialValue}>Jessica</Text>
                </View>
                <View style={styles.credentialColumn}>
                  <Text style={styles.credentialHeader}>Password</Text>
                  <Text style={styles.credentialValue}>Palmer</Text>
                  <Text style={styles.credentialValue}>Price</Text>
                  <Text style={styles.credentialValue}>Glover</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#015f45',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(1, 95, 69, 0.2)',
  },
  contentContainer: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 180, // Increased to move content down a bit
  },
  prototypeInfoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  infoButtonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '500',
  },
  prototypeText: {
    color: 'rgba(26, 23, 23, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  input: {
    height: 50,
    width: '85%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonContainer: {
    marginTop: 12,
    width: '85%',
  },
  loginButton: {
    backgroundColor: '#015f45',
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  // Simplified modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#015f45',
    marginBottom: 20,
    textAlign: 'center',
  },
  credentialsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  credentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  credentialColumn: {
    flex: 1,
    alignItems: 'center',
  },
  credentialHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  credentialValue: {
    fontSize: 16,
    color: '#015f45',
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#015f45',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});