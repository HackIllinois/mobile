import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import api from '../api';
import { AxiosResponse } from 'axios';
import { ProfileAvatar } from '../components/profile/ProfileAvatar';
import { QRCodeModal } from '../components/profile/QRCodeModal';
import { AvatarSelectionModal } from '../components/profile/AvatarSelectionModal';
import {
  useProfile,
  loadCachedRoles,
  hasNonProfileRole,
  getNonProfileRoleLabel,
} from '../lib/fetchProfile';
import { UserProfile } from '../types';
import * as Haptics from 'expo-haptics';
import { queryClient } from '../lib/queryClient';
import QRCode from 'react-native-qrcode-svg';
import { getCharacterIdFromUrl } from '../components/profile/avatarConfig';

interface QrCodeResponse {
  userId: string;
  qrInfo: string;
}



export default function ProfileScreen() {
  const [rolesLoaded, setRolesLoaded] = useState(() => hasNonProfileRole());
  const [isNonProfileRole, setIsNonProfileRole] = useState(() => hasNonProfileRole());
  const [qrError, setQrError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(() => getNonProfileRoleLabel());

  useEffect(() => {
    if (rolesLoaded) return;
    loadCachedRoles().then(() => {
      setIsNonProfileRole(hasNonProfileRole());
      setUserRole(getNonProfileRoleLabel());
      setRolesLoaded(true);
    });
  }, [rolesLoaded]);

  const { profile: attendeeProfile, loading, refetch: refetchProfile } = useProfile(rolesLoaded && !isNonProfileRole);
  const profile = isNonProfileRole ? null : attendeeProfile;
  const isLoading = !rolesLoaded || loading;

  const [qrCode, setQrInfo] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(false);
  const [cooldownStartedAt, setCooldownStartedAt] = useState<number | null>(null);
  const cooldownTimer = useRef<NodeJS.Timeout | null>(null);



  useFocusEffect(
    useCallback(() => {
      if (rolesLoaded && !isNonProfileRole) {
        refetchProfile();
      }
    }, [refetchProfile, rolesLoaded, isNonProfileRole])
  );

  const fetchQrCode = useCallback(async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setQrLoading(true);

    const token = await SecureStore.getItemAsync("jwt");
    if (!token) {
      setQrLoading(false);
      return;
    }

    try {
      const response = await api.get<AxiosResponse<QrCodeResponse>>('user/qr');
      setQrInfo(response.data.qrInfo);
      setQrError(null);
    } catch (error) {
      setQrError('Could not refresh QR code. Please try again.');
      console.error("Failed to fetch QR code:", error);
    } finally {
      if (showLoadingSpinner) setQrLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let intervalId: NodeJS.Timeout | null = null;

      if (rolesLoaded && profile) {
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
    }, [profile, fetchQrCode, rolesLoaded])
  );

  const handleManualQrRefresh = useCallback(() => {
    fetchQrCode(true);
    setRefreshCooldown(true);
    setCooldownStartedAt(Date.now());
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    cooldownTimer.current = setTimeout(() => {
      setRefreshCooldown(false);
      setCooldownStartedAt(null);
    }, 5000);
  }, [fetchQrCode]);

  const handleRefetchProfile = () => {
    Haptics.selectionAsync();
    if (rolesLoaded && !isNonProfileRole) refetchProfile();
  }

  const handlePressQrCode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowQrModal(true);
  }

  const handleEditAvatar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAvatarModal(true);
  }

  return (
    <SafeAreaView 
      style={styles.screen}
      edges={['top', 'left', 'right']}
    >
      
      {isLoading? (
         <View style={styles.status}>
          <ActivityIndicator
            size="large"
            color="#FFE0B4"
          />
        </View>
      ): !profile ?(
        <View style={styles.status}>
          <Text style={styles.message}>
            {isNonProfileRole ? `${userRole === 'GUEST' ? 'Guests': 'Staff'} you do not have an attendee profile`: 'Could not load your profile'} 
          </Text>

          {!isNonProfileRole && (
            <TouchableOpacity
              onPress={handleRefetchProfile}
              style={styles.retryButton}
              accessibilityRole="button"
            >
              <Text style={styles.detail}>Try again</Text>
            </TouchableOpacity>
          )}
        </View>
      ): (
        <>
          <View style={styles.content}>
            <ProfileAvatar
              avatarUrl={profile.avatarUrl}
              avatarId={profile.avatarId}
              onPress={handleEditAvatar}
              />
            <TouchableOpacity
              onPress={handlePressQrCode}
              style={styles.qrContainer}
            >
             {qrCode ? (
              <QRCode
                value={qrCode}
                size={180}
                backgroundColor="#FFFFFF"
                color="#000000"
              /> 
              ) : qrLoading ? (
                <ActivityIndicator color="#1a0040"/>
              ) : (
                <Text style={styles.qrMessage}>
                  QR code unavalible
                </Text>
              )}
            </TouchableOpacity>
            {/* Display QRCode error*/}
            {qrError && (
              <Text
                style={{
                  color: '#FFB4B4',
                  fontSize: 14,
                  textAlign: 'center',
                }}
              >
                {qrError}
                {qrCode
                  ? ' The displayed code may have expired.'
                  : ''}
              </Text>
            )}

            <View style={styles.details}>
                <Text style={styles.name}>
                  {profile.displayName}
                </Text>

                 <Text style={styles.detail}>
                  {profile.track?? 'Unavalible'}
                </Text>

                <Text style={styles.detail}>
                  food wave: {profile.foodWave}
                </Text>
            </View>
          </View>
          
           <QRCodeModal
            visible={showQrModal}
            qrCode={qrCode}
            qrLoading={qrLoading}
            onClose={() => setShowQrModal(false)}
            onRefresh={handleManualQrRefresh}
            refreshCooldown={refreshCooldown}
            cooldownStartedAt={cooldownStartedAt}
            qrError={qrError}
          />

          <AvatarSelectionModal 
            visible={showAvatarModal}
            currentAvatarId={
              profile.avatarId || getCharacterIdFromUrl(profile.avatarUrl)
            }
            displayName={profile.displayName}
            discordTag={profile.discordTag}
            onClose={()=>{setShowAvatarModal(false)}}
            onAvatarSelected={(avatarUrl) => {
              queryClient.setQueryData<UserProfile>(
                ['profile'],
                (previous) => previous ? {
                  ...previous,
                  avatarUrl,
                  avatarId: getCharacterIdFromUrl(avatarUrl),
                } : previous,
              );
            }}
            />
        </>
      )}
    </SafeAreaView>
  );
  
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1a0040',
  },
  content: {
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 20,
  },
  status: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#FFE0B4',
    borderRadius: 24,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
  },
  qrContainer: {
    width: 212,
    height: 212,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrMessage: {
    color: '#1a0040',
    textAlign: 'center',
  },
  details: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: '#FFFFFF',
    fontFamily: 'Tsukimi-Rounded-Bold',
    fontSize: 26,
    textAlign: 'center',
  },
  detail: {
    color: '#FFE0B4',
    fontSize: 18,
    textAlign: 'center',
  },
});