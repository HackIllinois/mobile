import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requireNativeModule } from "expo-modules-core";
import { useRouter } from 'expo-router'; // Assuming you use expo-router, or use navigation prop
import AsyncStorage from '@react-native-async-storage/async-storage';

const LocalConnection = requireNativeModule("LocalConnection");

export default function DuelLobby() {
  {/* Temporary until fake username until we have access to profile usernames*/}
  const [username, setUsername] = useState('');
  const router = useRouter(); 
  

  const handleHost = async () => {
    if (!username.trim()) {
      Alert.alert("Missing Name", "Please enter a username first.");
      return;
    }

    try {
      // 1. Set Name
      LocalConnection.InitPeerName(username);
      // 2. Start Advertising (I am the Host)
      LocalConnection.startAdvertising();
      
      // 3. Navigate to Game/Lobby Screen
      // Pass 'isHost: true' so the next screen knows to listen for invites
      router.push({ pathname: "/Duel", params: { isHost: "true", username } });
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoin = async () => {
    if (!username.trim()) {
      Alert.alert("Missing Name", "Please enter a username first.");
      return;
    }

    try {
      // 1. Set Name
      LocalConnection.InitPeerName(username);
      // 2. Start Scanning (I am looking for a Host)
      LocalConnection.startScanning();

      // 3. Navigate to Game/Lobby Screen
      // Pass 'isHost: false' so the next screen knows to listen for found rooms
      router.push({ pathname: "/Duel", params: { isHost: "false", username } });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Space Fight</Text>
        
        {/* Username Input */}
        <TextInput
          style={styles.input}
          placeholder="Enter Username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          autoCorrect={false}
        />

        {/* Buttons */}
        <View style={styles.buttonWrapper}>
          <Button 
            title="Host Game" 
            onPress={handleHost} 
          />
        </View>

        <View style={styles.buttonWrapper}>
          <Button 
            title="Join Game" 
            onPress={handleJoin} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',    
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,        
    color: '#000',
  },
  input: {
    width: 200,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 30,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  buttonWrapper: {
    width: 200,              
    marginVertical: 10,      
  },
});