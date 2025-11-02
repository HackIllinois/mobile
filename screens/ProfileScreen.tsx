import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store'; 
import api from '../api'; 
import axios, { AxiosResponse } from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles/ProfileScreen.styles';
import QRCode from 'react-native-qrcode-svg';

// TODO: 
  // Avatar Upload using Expo ImagePicker and API upload endpoint
  // Enable / Disable Notifications
  // Light / Dark Mode Toggle

interface UserProfile {
  userId: string;
  displayName: string;
  discordTag: string;
  avatarUrl: string | null;
  points: number;
  pointsAccumulated: number;
  foodWave: number;
}

interface QrCodeResponse {
  userId: string;
  qrInfo: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter(); 
  
  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [qrCode, setQrInfo] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  
  // Settings Components
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    const token = await SecureStore.getItemAsync("jwt");
    if (!token) {
      console.log("No token found, redirecting to login");
      router.replace("/AuthScreen");
      return;
    }

    setIsLoading(true);
    try {
      const response: any = await api.get<UserProfile>('profile');
      const data = response.data;
      setProfile(data);
      setDisplayName(data.displayName);
      setDiscordTag(data.discordTag);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      console.log("Could not load profile. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQrCode = useCallback(async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setQrLoading(true);

    const token = await SecureStore.getItemAsync("jwt");
    if (!token) {
      return;
    }

    try {
      const response = await api.get<AxiosResponse<QrCodeResponse>>('user/qr');
      setQrInfo(response.data.qrInfo);
    } catch (error) {
      console.error("Failed to fetch QR code:", error);
    } finally {
      if (showLoadingSpinner) setQrLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let intervalId: NodeJS.Timeout | null = null;

      if (profile) {
        fetchQrCode(true); 

        intervalId = setInterval(() => {
          fetchQrCode(false);
        }, 15000); 
      }

      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }, [profile, fetchQrCode]) 
  );

  const handleSave = async () => {
    if (!profile) return;
    
    if (displayName === profile.displayName && discordTag === profile.discordTag) {
        setIsEditing(false); // Exit editing if nothing changed
        return;
    }

    setIsLoading(true); 
    try {
      const updatedProfile = {
        displayName: displayName,
        discordTag: discordTag,
      };
      
      const response: any = await api.put<UserProfile>('profile', updatedProfile);
      const data = response.data;
      
      setProfile(data);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
      
    } catch (error) {
      console.error("Failed to save profile:", error);
      let message = "An unknown error occurred.";
      if (axios.isAxiosError(error) && error.response) {
        message = error.response.data?.message || 'Failed to update profile. Please check your input.';
      }
      Alert.alert("Update Failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("jwt");
    setProfile(null); 
    setQrInfo(null);  
    Alert.alert("Logged out", "You have been logged out successfully.");
    router.replace("/AuthScreen"); 
  };


  const handleGoBack = () => {
    router.back();
  };

  // Renders while loading profile
  if (isLoading && !profile) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#9A6AFF" />
      </SafeAreaView>
    );
  }

  // Renders if profile fetch failed
  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Could not load profile.</Text>
        <TouchableOpacity style={styles.button} onPress={fetchProfile}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.logoutButton]} 
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  // Main profile view
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Back Arrow Button */}
        <TouchableOpacity 
          onPress={handleGoBack} 
          style={styles.headerIconTouchable} 
        > 
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profile</Text>

        {/* Right Icons Container */}
        <View style={styles.headerRight}>
          {/* Notifications Icon (Dummy) */}
          <TouchableOpacity 
            onPress={() => {
              setIsNotificationsEnabled(!isNotificationsEnabled);
              Alert.alert('Notifications Toggle', `Notifications are now ${isNotificationsEnabled ? 'Disabled' : 'Enabled'}.`);
            }} 
            style={styles.headerIconRight}
          >
            <Ionicons 
              name={isNotificationsEnabled ? "notifications-sharp" : "notifications-off-sharp"} 
              size={24} 
              color={isNotificationsEnabled ? "#9A6AFF" : "#FFFFFF"} 
            />
          </TouchableOpacity>
          
          {/* Dark Mode Toggle (Dummy) */}
          <View style={styles.darkModeToggle}>
            <Ionicons name={isDarkMode ? "moon" : "sunny"} size={16} color={isDarkMode ? "#9A6AFF" : "#FFD700"} />
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isDarkMode ? "#9A6AFF" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={setIsDarkMode}
              value={isDarkMode}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginLeft: 5 }}
            />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Avatar */}
        <Image
          style={styles.avatar}
          source={
            profile.avatarUrl
              ? { uri: profile.avatarUrl }
              : require('../assets/profile.png') // Fallback
          }
          onError={() => console.log('Failed to load avatar image')}
        />

        {/* Display Name */}
        <View style={styles.nameContainer}>
          {isEditing ? (
            <TextInput
              style={[styles.displayName, styles.textInput, styles.inlineTextInput]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display Name"
              placeholderTextColor="#777"
            />
          ) : (
            <Text style={styles.displayName}>{profile.displayName}</Text>
          )}
          <TouchableOpacity onPress={() => {
              if (isEditing) {
                  // Revert changes on cancel
                  setDisplayName(profile.displayName);
                  setDiscordTag(profile.discordTag);
              }
              setIsEditing(!isEditing);
          }} style={styles.editIcon}>
            {isEditing ? (
              <Text style={styles.editText}>Cancel</Text>
            ) : (
              <Ionicons name="pencil-sharp" size={18} color="#9A6AFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Points Banner */}
        <Text style={styles.points}>
          {profile.points.toLocaleString()} PTS
        </Text>

        {/* QR Code */}
        <View style={styles.qrSection}>
          <Text style={styles.qrHelpText}>
          </Text>
          <View style={styles.qrContainer}>
            {qrCode ? (
              <QRCode
                value={qrCode}
                size={220} 
                backgroundColor="#FFFFFF"
                color="#000000"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <ActivityIndicator size="large" color="#9A6AFF" />
                <Text style={styles.qrPlaceholderText}>Loading QR Code...</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.button, styles.refreshButton, qrLoading && styles.buttonDisabled]}
            onPress={() => fetchQrCode(true)}
            disabled={qrLoading}
          >
            {qrLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Refresh QR</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Other Fields */}
        <View style={styles.infoContainer}>
          {/* Discord Tag field */}
          {isEditing ? (
            <View style={styles.infoRow}>
              <Text style={styles.fieldLabel}>Discord Tag</Text>
              <TextInput
                style={[styles.textInput, styles.fieldValueInput]}
                value={discordTag}
                onChangeText={setDiscordTag}
                placeholder="username#0000"
                placeholderTextColor="#777"
                autoCapitalize='none'
              />
            </View>
          ) : (
            <InfoRow label="Discord" value={profile.discordTag} />
          )}

          <InfoRow label="User ID" value={profile.userId} selectable={true} />
          <InfoRow label="Total Points Earned" value={profile.pointsAccumulated.toLocaleString()} />
          <InfoRow label="Food Wave" value={profile.foodWave.toString()} />
        </View>
        
        {/* Action Buttons */}
        {isEditing ? (
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity 
          style={[styles.button, styles.logoutButton]} 
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// Helper component for displaying info
const InfoRow = ({ label, value, selectable = false }: { label: string, value: string, selectable?: boolean }) => (
  <View style={styles.infoRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue} selectable={selectable}>{value || 'Not set'}</Text>
  </View>
);
