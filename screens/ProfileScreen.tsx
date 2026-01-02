import React, { useState, useCallback } from 'react';
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import api from '../api';
import axios, { AxiosResponse } from 'axios';
import { ProfileAvatar } from '../components/profile/ProfileAvatar';
import { UserStatsCard } from '../components/profile/UserStatsCard';
import { QRCodeModal } from '../components/profile/QRCodeModal';
import { AvatarSelectionModal } from '../components/profile/AvatarSelectionModal';
import FrontBoxSvg from '../assets/profile/profile-screen/front-box.svg';
import BackBoxSvg from '../assets/profile/profile-screen/back-box.svg';
import ButtonSvg from '../assets/profile/profile-screen/button.svg';
import QRCodeButtonSvg from '../assets/profile/profile-screen/qr-code-button.svg';
import EditButtonSvg from '../assets/profile/profile-screen/edit-button.svg';
import BackgroundSvg from '../assets/profile/background.svg';
import NavBarSvg from '../assets/profile/nav-bar.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const router = useRouter();

  const [qrCode, setQrInfo] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

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
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log("Profile not found - user does not have a profile yet");
      } else {
        console.error("Failed to fetch profile:", error);
      }
      // (Staff/Unauthorized Attendee) Just logging the error and letting the UI handle it for now
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

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("jwt");
    setProfile(null);
    setQrInfo(null);
    Alert.alert("Logged out", "You have been logged out successfully.");
    router.replace("/AuthScreen");
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
      {/* Background */}
      <View style={styles.backgroundWrapper}>
        <BackgroundSvg
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          preserveAspectRatio="xMidYMid slice"
        />
      </View>

      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFILE</Text>
      </View>

      <View style={styles.contentContainer}>
        <ProfileAvatar
          avatarUrl={profile.avatarUrl}
        />

        {/* Boxes */}
        <View style={styles.boxContainer}>
          {/* Back Box */}
          <View style={styles.backBoxWrapper}>
            <BackBoxSvg
              width={SCREEN_WIDTH * (313 / 393)}
              height={SCREEN_WIDTH * (253 / 393)}
            />
          </View>

          {/* Front Box */}
          <View style={styles.frontBoxWrapper}>
            <FrontBoxSvg
              width={SCREEN_WIDTH * (313 / 393)}
              height={SCREEN_WIDTH * (253 / 393)}
            />

            {/* Content */}
            <View style={styles.frontBoxContent}>
              <UserStatsCard
                displayName={profile.displayName}
                foodWave={profile.foodWave}
                track={profile.teamStatus || 'GENERAL'}
                rank={profile.ranking || 0}
                points={profile.points}
                pointsToNextRank={Math.max(0, 100 - (profile.points % 100))}
              />
            </View>
          </View>

          {/* Buttons */}
          {/* QR Code Button */}
          <TouchableOpacity
            style={styles.actionButton1}
            onPress={() => setShowQrModal(true)}
          >
            <ButtonSvg
              width={SCREEN_WIDTH * (83.557 / 393)}
              height={SCREEN_WIDTH * (83.557 / 393)}
            />
            <View style={styles.buttonIconContainer1}>
              <QRCodeButtonSvg
                width={SCREEN_WIDTH * (50.134 / 393)}
                height={SCREEN_WIDTH * (50.134 / 393)}
              />
            </View>
            <Text style={styles.buttonText1}>QR CODE</Text>
          </TouchableOpacity>

          {/* Avatar Button */}
          <TouchableOpacity
            style={styles.actionButton2}
            onPress={() => setShowAvatarModal(true)}
          >
            <ButtonSvg
              width={SCREEN_WIDTH * (83.557 / 393)}
              height={SCREEN_WIDTH * (83.557 / 393)}
            />
            <View style={styles.buttonIconContainer2}>
              <EditButtonSvg
                width={SCREEN_WIDTH * (50.134 / 393)}
                height={SCREEN_WIDTH * (50.134 / 393)}
              />
            </View>
            <Text style={styles.buttonText2}>EDIT AVATAR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={isLoading}
      >
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

      <QRCodeModal
        visible={showQrModal}
        qrCode={qrCode}
        qrLoading={qrLoading}
        onClose={() => setShowQrModal(false)}
        onRefresh={() => fetchQrCode(true)}
        displayName={profile.displayName}
      />

      <AvatarSelectionModal
        visible={showAvatarModal}
        currentAvatarId={profile.avatarUrl?.split('/').pop()?.replace('.png', '').replace('.svg', '') || null}
        onClose={() => setShowAvatarModal(false)}
      />

      {/* Navbar */}
      <View style={styles.navbarWrapper}>
        <NavBarSvg
          width={SCREEN_WIDTH}
          height={SCREEN_WIDTH * (108 / 393)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    fontFamily: 'Montserrat',
  },
  backgroundWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: -1,
  },
  navbarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * (108 / 393),
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH * (313 / 393),
    height: SCREEN_WIDTH * (253 / 393),
    top: SCREEN_WIDTH * ((462 - 130) / 393),
    left: SCREEN_WIDTH * (36 / 393),
    borderRadius: 2,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  backBoxWrapper: {
    position: 'absolute',
    top: 0,
    left: SCREEN_WIDTH * 0.053,
  },
  frontBoxWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  frontBoxContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: SCREEN_WIDTH * 0.06,
    paddingLeft: SCREEN_WIDTH * 0.08,
    paddingRight: SCREEN_WIDTH * 0.06,
    paddingBottom: SCREEN_WIDTH * 0.04,
  },
  actionButton1: {
    position: 'absolute',
    top: SCREEN_WIDTH * ((189 - 462) / 393), 
    left: SCREEN_WIDTH * ((244 - 36) / 393), 
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton2: {
    position: 'absolute',
    top: SCREEN_WIDTH * ((299 - 462) / 393), 
    left: SCREEN_WIDTH * ((244 - 36) / 393), 
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIconContainer1: {
    position: 'absolute',
    top: SCREEN_WIDTH * (7.24 / 393),
    left: SCREEN_WIDTH * (16.71 / 393),
    width: SCREEN_WIDTH * (50.134 / 393),
    height: SCREEN_WIDTH * (50.134 / 393),
  },
  buttonIconContainer2: {
    position: 'absolute',
    top: SCREEN_WIDTH * (7.24 / 393),
    left: SCREEN_WIDTH * (16.71 / 393),
    width: SCREEN_WIDTH * (50.134 / 393),
    height: SCREEN_WIDTH * (50.134 / 393),
  },
  buttonText1: {
    position: 'absolute',
    top: SCREEN_WIDTH * (62 / 393),
    left: SCREEN_WIDTH * (12 / 393),
    width: SCREEN_WIDTH * (60 / 393),
    fontFamily: 'Tsukimi Rounded',
    fontWeight: '700',
    fontSize: SCREEN_WIDTH * (8.91 / 393),
    lineHeight: SCREEN_WIDTH * (11 / 393),
    letterSpacing: 0,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  buttonText2: {
    position: 'absolute',
    top: SCREEN_WIDTH * (62 / 393),
    left: SCREEN_WIDTH * (8 / 393),
    width: SCREEN_WIDTH * (68 / 393),
    fontFamily: 'Tsukimi Rounded',
    fontWeight: '700',
    fontSize: SCREEN_WIDTH * (8.91 / 393),
    lineHeight: SCREEN_WIDTH * (11 / 393),
    letterSpacing: 0,
    textAlign: 'center',
    color: '#FFFFFF',
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
    position: 'absolute',
    top: SCREEN_WIDTH * (60 / 393),
    right: SCREEN_WIDTH * (20 / 393),
    backgroundColor: '#E936F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 100,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    height: SCREEN_WIDTH * (51 / 393),
    marginTop: SCREEN_WIDTH * ((55 - 30) / 393), 
  },
  headerTitle: {
    position: 'absolute',
    left: SCREEN_WIDTH * (31 / 393),
    top: 0,
    width: SCREEN_WIDTH * (222 / 393),
    height: SCREEN_WIDTH * (51 / 393),
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'left',
    letterSpacing: 1.5,
    fontFamily: 'Tsukimi Rounded',
  },
  closeButton: {
    position: 'absolute',
    left: SCREEN_WIDTH * (20 / 393),
    top: SCREEN_WIDTH * (50 / 393),
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
  },
});