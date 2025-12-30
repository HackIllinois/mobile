import React, { useState, useCallback } from 'react';
import {
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import api from '../api';
import axios, { AxiosResponse } from 'axios';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileAvatar } from '../components/profile/ProfileAvatar';
import { UserStatsCard } from '../components/profile/UserStatsCard';
import { QRCodeModal } from '../components/profile/QRCodeModal';
import { EditButtons } from '../components/profile/EditButtons';

interface UserProfile {
  userId: string;
  displayName: string;
  discordTag: string;
  avatarUrl: string | null;
  points: number;
  pointsAccumulated: number;
  foodWave: number;
  teamStatus?: string;
  ranking?: number;
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
  
  const [displayName, setDisplayName] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [qrCode, setQrInfo] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

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
        setIsEditing(false);
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

  if (isLoading && !profile) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#888" />
      </SafeAreaView>
    );
  }

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
  
  return (
    <SafeAreaView style={styles.container}>
      <ProfileHeader onGoBack={handleGoBack} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ProfileAvatar
          avatarUrl={profile.avatarUrl}
          onQRCodePress={() => setShowQrModal(true)}
        />

        <UserStatsCard
          displayName={profile.displayName}
          foodWave={profile.foodWave}
          track={profile.teamStatus || 'GENERAL'}
          rank={profile.ranking || 0}
          points={profile.points}
          pointsToNextRank={Math.max(0, 100 - (profile.points % 100))}
          isEditing={isEditing}
          editedDisplayName={displayName}
          onDisplayNameChange={setDisplayName}
          onEditPress={() => setIsEditing(!isEditing)}
        />

        {isEditing && (
          <EditButtons
            isLoading={isLoading}
            onSave={handleSave}
            onCancel={() => {
              setDisplayName(profile.displayName);
              setDiscordTag(profile.discordTag);
              setIsEditing(false);
            }}
          />
        )}

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <QRCodeModal
        visible={showQrModal}
        qrCode={qrCode}
        qrLoading={qrLoading}
        onClose={() => setShowQrModal(false)}
        onRefresh={() => fetchQrCode(true)}
        displayName={displayName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    fontFamily: 'Montserrat',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF5555',
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#888',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#C70039',
    borderRadius: 40,
    alignItems: 'center',
    width: '40%',
    marginTop: 20,
  },
});