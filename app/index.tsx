import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithNames } from '../api/auth';
import { supabase } from '../supabaseClient';

export default function IndexScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Temporary state for DB connection test result.
  const [dbStatus, setDbStatus] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      const user = await signInWithNames(firstName, lastName);
      // Optionally query user-related data here
      router.push('/HomeScreen');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Login Error', error.message);
      } else {
        Alert.alert('Login Error', 'An unexpected error occurred.');
      }
    }
  };

  // Temporary function to check DB connection
  const checkDBConnection = async () => {
    try {
      const { data, error } = await supabase.from('customer').select('*').limit(1);
      if (error) {
        setDbStatus(`DB Error: ${error.message}`);
        Alert.alert('DB Connection', `Error: ${error.message}`);
      } else {
        setDbStatus('Connected to DB!');
        Alert.alert('DB Connection', 'Successfully connected to the database!');
      }
    } catch (err) {
      setDbStatus('Unexpected error occurred');
      Alert.alert('DB Connection', 'Unexpected error occurred');
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
      <View style={{ marginTop: 20 }}>
        <Button title="Test DB Connection" onPress={checkDBConnection} />
      </View>
      {dbStatus && (
        <Text style={styles.statusText}>Status: {dbStatus}</Text>
      )}
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
  statusText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
  },
});