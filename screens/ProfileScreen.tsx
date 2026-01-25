import React, { useState, useCallback } from 'react';
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  View,
  useWindowDimensions,
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
import LogoutButtonSvg from '../assets/profile/profile-screen/logout-button.svg';

interface UserProfile {
  userId: string;
  displayName: string;
  discordTag: string;
  avatarUrl: string | null;
  avatarId?: string | null;  // Character ID (e.g., 'character2')
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
  const { width, height } = useWindowDimensions();

  const figmaWidth = 393;
  const figmaHeight = 852;
  const scaleWidth = (size: number) => (width / figmaWidth) * size;
  const scaleHeight = (size: number) => (height / figmaHeight) * size;
  const scaleFontSize = (size: number) => Math.min(scaleWidth(size), scaleHeight(size));

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

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync("jwt");
            setProfile(null);
            setQrInfo(null);
            router.replace("/AuthScreen");
          }
        }
      ]
    );
  };

  if (isLoading && !profile) {
    return (
      <SafeAreaView style={{
        flex: 1,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color="#888" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{
        flex: 1,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{
          color: '#FF5555',
          fontSize: scaleFontSize(30),
          textAlign: 'center',
          width: '80%',
          marginBottom: scaleHeight(30),
        }}>Could not load profile.</Text>
        <Text style={{
          color: '#180161',
          fontSize: scaleFontSize(18),
          textAlign: 'center',
          width: '80%',
          marginBottom: scaleHeight(5),
        }}>Staff currently do not have profiles.</Text>
        <Text style={{
          color: '#180161',
          fontSize: scaleFontSize(18),
          textAlign: 'center',
          width: '80%',
          marginBottom: scaleHeight(20),
        }}>If you are an attendee, please email contact@hackillinois.org for support.</Text>
        <TouchableOpacity style={{
          backgroundColor: '#180161',
          padding: scaleWidth(15),
          borderRadius: scaleWidth(40),
          alignItems: 'center',
          width: '30%',
          marginBottom: scaleHeight(70),
        }} onPress={fetchProfile}>
          <Text style={{
            color: '#FFFFFF',
            fontSize: scaleFontSize(16),
            fontWeight: 'bold',
          }}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: '#FF5555',
            padding: scaleWidth(15),
            borderRadius: scaleWidth(40),
            alignItems: 'center',
            width: '50%',
            marginBottom: scaleHeight(15),
          }}
          onPress={handleLogout}
        >
          <Text style={{
            color: '#FFFFFF',
            fontSize: scaleFontSize(18),
            fontWeight: 'bold',
          }}>Log Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: '#F5F5F5',
    }}>
      {/* Background */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        zIndex: -1,
      }}>
        <BackgroundSvg
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid slice"
        />
      </View>

      {/* Page Title with layered glow */}
      <View style={{
        marginLeft: scaleWidth(20),
        marginTop: scaleWidth(0),
        marginBottom: scaleWidth(30),
      }}>
        {/* Glow layers */}
        <Text style={{
          position: 'absolute',
          fontSize: scaleFontSize(26),
          fontWeight: 'bold',
          color: 'transparent',
          letterSpacing: scaleWidth(1.5),
          fontFamily: 'Tsukimi Rounded',
          textShadowColor: 'rgba(243, 77, 255, 0.4)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 15,
        }}>PROFILE</Text>
        <Text style={{
          position: 'absolute',
          fontSize: scaleFontSize(26),
          fontWeight: 'bold',
          color: 'transparent',
          letterSpacing: scaleWidth(1.5),
          fontFamily: 'Tsukimi Rounded',
          textShadowColor: 'rgba(243, 77, 255, 0.6)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 8,
        }}>PROFILE</Text>
        {/* Main text */}
        <Text style={{
          fontSize: scaleFontSize(26),
          fontWeight: 'bold',
          color: '#FFFFFF',
          letterSpacing: scaleWidth(1.5),
          fontFamily: 'Tsukimi Rounded',
          textShadowColor: 'rgba(243, 77, 255, 0.9)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 4,
        }}>PROFILE</Text>
      </View>

      <View style={{ flex: 1 }}>
        <ProfileAvatar
          avatarUrl={profile.avatarUrl}
          avatarId={profile.avatarId}
        />

        {/* Boxes */}
        <View style={{
          position: 'absolute',
          width: scaleWidth(313),
          height: scaleWidth(253),
          top: scaleWidth(332),
          left: scaleWidth(36),
          borderRadius: scaleWidth(2),
          borderWidth: scaleWidth(4),
          borderColor: 'transparent',
        }}>
          {/* Back Box */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: width * 0.053,
          }}>
            <BackBoxSvg
              width={scaleWidth(313)}
              height={scaleWidth(253)}
            />
          </View>

          {/* Front Box */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}>
            <FrontBoxSvg
              width={scaleWidth(313)}
              height={scaleWidth(253)}
            />

            {/* Content */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              paddingTop: scaleWidth(23.6),
              paddingLeft: scaleWidth(31.4),
              paddingRight: scaleWidth(23.6),
              paddingBottom: scaleWidth(15.7),
            }}>
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
            style={{
              position: 'absolute',
              top: scaleWidth(-273),
              left: scaleWidth(208),
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setShowQrModal(true)}
          >
            <ButtonSvg
              width={scaleWidth(83.557)}
              height={scaleWidth(83.557)}
            />
            <View style={{
              position: 'absolute',
              top: scaleWidth(7.24),
              left: scaleWidth(16.71),
              width: scaleWidth(50.134),
              height: scaleWidth(50.134),
            }}>
              <QRCodeButtonSvg
                width={scaleWidth(50.134)}
                height={scaleWidth(50.134)}
              />
            </View>
            <Text
              style={{
                position: 'absolute',
                top: scaleWidth(62),
                left: scaleWidth(12),
                width: scaleWidth(60),
                fontFamily: 'Tsukimi Rounded',
                fontWeight: '700',
                fontSize: scaleWidth(9),
                lineHeight: scaleWidth(11),
                letterSpacing: 0,
                textAlign: 'center',
                color: '#FFFFFF',
              }}
              numberOfLines={2}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >QR CODE</Text>
          </TouchableOpacity>

          {/* Avatar Button */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: scaleWidth(-163),
              left: scaleWidth(208),
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setShowAvatarModal(true)}
          >
            <ButtonSvg
              width={scaleWidth(83.557)}
              height={scaleWidth(83.557)}
            />
            <View style={{
              position: 'absolute',
              top: scaleWidth(7.24),
              left: scaleWidth(16.71),
              width: scaleWidth(50.134),
              height: scaleWidth(50.134),
            }}>
              <EditButtonSvg
                width={scaleWidth(50.134)}
                height={scaleWidth(50.134)}
              />
            </View>
            <Text
              style={{
                position: 'absolute',
                top: scaleWidth(62),
                left: scaleWidth(5),
                width: scaleWidth(74),
                fontFamily: 'Tsukimi Rounded',
                fontWeight: '700',
                fontSize: scaleWidth(9),
                lineHeight: scaleWidth(11),
                letterSpacing: 0,
                textAlign: 'center',
                color: '#FFFFFF',
              }}
              numberOfLines={2}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >EDIT AVATAR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: scaleWidth(55),
          right: scaleWidth(10),
          marginTop: scaleWidth(5),
          zIndex: 100,
        }}
        onPress={handleLogout}
        disabled={isLoading}
      >
        <LogoutButtonSvg
          width={scaleWidth(70)}
          height={scaleWidth(28)}
        />
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
        displayName={profile.displayName}
        discordTag={profile.discordTag}
        onClose={() => setShowAvatarModal(false)}
        onAvatarSelected={(avatarUrl) => {
          setProfile((prev) => prev ? { ...prev, avatarUrl } : null);
        }}
      />

    </SafeAreaView>
  );
}
