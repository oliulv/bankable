import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithNames } from '../api/auth';
import { useUser } from '../context/UserContext';

export default function IndexScreen() {
  const router = useRouter();
  const { setCustomerId, setCustomerName } = useUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleLogin = async () => {
    try {
      const user = await signInWithNames(firstName, lastName);
      
      // Save to context
      setCustomerId(user.customer_id);
      setCustomerName(firstName); // Or use user.name if returned from API
      
      router.push('/HomeScreen');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Login Error', error.message);
      } else {
        Alert.alert('Login Error', 'An unexpected error occurred.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />

      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});