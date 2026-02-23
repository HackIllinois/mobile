import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Text,
  TouchableOpacity,
  Animated,
  View,
  Image,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import api from '../api';
import { AxiosResponse } from 'axios';
import { ProfileAvatar } from '../components/profile/ProfileAvatar';
import { UserStatsCard } from '../components/profile/UserStatsCard';
import { QRCodeModal } from '../components/profile/QRCodeModal';
import { AvatarSelectionModal } from '../components/profile/AvatarSelectionModal';
import FrontBoxSvg from '../assets/profile/profile-screen/front-box.svg';
import ButtonSvg from '../assets/profile/profile-screen/button.svg';
import QRCodeButtonSvg from '../assets/profile/profile-screen/qr-code-button.svg';
import TeamBadgeSvg from '../assets/profile/profile-screen/team-badge.svg';
import EditProfileIconSvg from '../assets/profile/profile-screen/edit-profile-icon.svg';
import BackgroundSvg from '../assets/profile/background.svg';
import StarryBackground from '../components/eventScreen/StarryBackground';
import {
  useProfile,
  UserProfile,
  loadCachedRoles,
  hasNonProfileRole,
  getNonProfileRoleLabel,
} from '../lib/fetchProfile';
import * as Haptics from 'expo-haptics';
import { queryClient } from '../lib/queryClient';

interface QrCodeResponse {
  userId: string;
  qrInfo: string;
}

interface TeamStanding {
  id: string;
  name: string;
  points: number;
  members: number;
}

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700',   // Gold
  2: '#C0C0C0',   // Silver
  3: '#CD7F32',   // Bronze
  4: '#B76E79',   // Rose gold
};

const getRankSuffix = (rank: number): string => {
  if (rank === 1) return 'st';
  if (rank === 2) return 'nd';
  if (rank === 3) return 'rd';
  return 'th';
};

export default function ProfileScreen() {
  const { width, height } = useWindowDimensions();

  const figmaWidth = 393;
  const figmaHeight = 852;
  const scaleWidth = (size: number) => (width / figmaWidth) * size;
  const scaleHeight = (size: number) => (height / figmaHeight) * size;
  const scaleFontSize = (size: number) => Math.min(scaleWidth(size), scaleHeight(size));

  const [rolesLoaded, setRolesLoaded] = useState(() => hasNonProfileRole());
  const [isNonProfileRole, setIsNonProfileRole] = useState(() => hasNonProfileRole());
  const [userRole, setUserRole] = useState<string | null>(() => getNonProfileRoleLabel());

  useEffect(() => {
    if (rolesLoaded) return;
    loadCachedRoles().then(() => {
      setIsNonProfileRole(hasNonProfileRole());
      setUserRole(getNonProfileRoleLabel());
      setRolesLoaded(true);
    });
  }, [rolesLoaded]);

  const { profile, loading: isLoading, refetch: refetchProfile } = useProfile(!isNonProfileRole);

  const [qrCode, setQrInfo] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [teamRank, setTeamRank] = useState<number | null>(null);
  const [refreshCooldown, setRefreshCooldown] = useState(false);
  const [cooldownStartedAt, setCooldownStartedAt] = useState<number | null>(null);
  const cooldownTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!profile?.team) return;
    const fetchTeamRank = async () => {
      try {
        const res = await api.get<AxiosResponse<TeamStanding[]>>('attendee-team/');
        const raw = res.data as unknown as TeamStanding[] | { data: TeamStanding[] };
        const standings: TeamStanding[] = Array.isArray(raw) ? raw : raw.data;
        standings.sort((a: TeamStanding, b: TeamStanding) => b.points - a.points);
        const rank = standings.findIndex(
          (t: TeamStanding) => t.name.toLowerCase() === profile.team!.toLowerCase()
        );
        setTeamRank(rank >= 0 ? rank + 1 : null);
      } catch (error) {
        console.error('Failed to fetch team standings:', error);
      }
    };
    fetchTeamRank();
  }, [profile?.team]);

  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useFocusEffect(
    useCallback(() => {
      if (!isNonProfileRole) {
        refetchProfile();
      }
    }, [refetchProfile, isNonProfileRole])
  );

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    refetchProfile();
  }

  const handlePressQrCode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowQrModal(true);
  }

  const handleEditAvatar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAvatarModal(true);
  }

  if (isLoading && !isNonProfileRole) {
    const SkeletonBox = ({ style }: { style?: any }) => (
      <Animated.View style={[{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 8, opacity: pulseAnim }, style]} />
    );

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a0040' }}>
        <View style={{
          position: 'absolute', top: 0, left: 0, width, height, zIndex: -1,
        }}>
          <BackgroundSvg width={width} height={height} preserveAspectRatio="xMidYMid slice" />
        </View>
        <View style={{ flex: 1, marginTop: scaleWidth(50) }}>
          
          {/* Avatar skeleton */}
          <SkeletonBox style={{
            width: scaleWidth(140),
            height: scaleWidth(300),
            position: 'absolute',
            top: scaleWidth(-1),
            left: scaleWidth(45),
            borderRadius: scaleWidth(12),
          }} />

          {/* Stats box skeleton */}
          <View style={{
            position: 'absolute',
            top: scaleWidth(332),
            left: scaleWidth(36),
            width: scaleWidth(313),
            height: scaleWidth(253),
          }}>
            <SkeletonBox style={{
              width: scaleWidth(313),
              height: scaleWidth(253),
              borderRadius: scaleWidth(12),
              backgroundColor: 'rgba(180, 160, 210, 0.3)',
            }} />
          </View>
          {/* Button skeleton */}
          <SkeletonBox style={{
            position: 'absolute',
            top: scaleWidth(332) + scaleWidth(-163),
            left: scaleWidth(36) + scaleWidth(208),
            width: scaleWidth(83),
            height: scaleWidth(83),
            borderRadius: scaleWidth(42),
            backgroundColor: 'rgba(180, 160, 210, 0.3)',
          }} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <StarryBackground>
        <View style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          zIndex: 0,
        }} />
        <SafeAreaView style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            style={{
            color: '#FFE0B4',
            fontSize: scaleFontSize(28),
            fontFamily: 'Tsukimi Rounded',
            fontWeight: '700',
            textAlign: 'center',
            width: '80%',
            marginBottom: scaleHeight(20),
          }}>Could not load profile.</Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: scaleFontSize(16),
            fontFamily: 'Tsukimi Rounded',
            fontWeight: '700',
            textAlign: 'center',
            width: '80%',
            marginBottom: scaleHeight(15),
          }}>{userRole === 'GUEST' ? 'Guests' : 'Staff'} currently do not have profiles.</Text>
          <Text style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: scaleFontSize(14),
            fontWeight: '600',
            textAlign: 'center',
            width: '80%',
            marginBottom: scaleHeight(30),
          }}>If you are an attendee, please email contact@hackillinois.org for support.</Text>
          <TouchableOpacity style={{
            backgroundColor: 'rgba(24, 1, 97, 0.8)',
            paddingVertical: scaleWidth(12),
            paddingHorizontal: scaleWidth(30),
            borderRadius: scaleWidth(40),
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 224, 180, 0.3)',
          }} onPress={() => handleRefetchProfile()}>
            <Text style={{
              color: '#FFFFFF',
              fontSize: scaleFontSize(14),
              fontFamily: 'Tsukimi Rounded',
              fontWeight: '700',
            }}>Try Again</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </StarryBackground>
    );
  }

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: '#1a0040',
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

      <View style={{ flex: 1, marginTop: scaleWidth(65) }}>
        <ProfileAvatar
          avatarUrl={profile.avatarUrl}
          avatarId={profile.avatarId}
        />

        {/* Edit Avatar Button */}
        <TouchableOpacity
          onPress={handleEditAvatar}
          style={{
            position: 'absolute',
            top: scaleWidth(322),
            left: scaleWidth(210),
            flexDirection: 'row',
            alignItems: 'center',
            gap: scaleWidth(5),
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            paddingVertical: scaleWidth(6),
            paddingHorizontal: scaleWidth(12),
            borderRadius: scaleWidth(20),
          }}
        >
          <EditProfileIconSvg
            width={scaleWidth(16)}
            height={scaleWidth(16)}
          />
          <Text style={{
            fontFamily: 'Tsukimi Rounded',
            fontWeight: '700',
            fontSize: scaleWidth(10),
            color: '#FFFFFF',
          }}>EDIT AVATAR</Text>
        </TouchableOpacity>

        {/* Boxes */}
        <View style={{
          position: 'absolute',
          width: scaleWidth(313),
          height: scaleWidth(253),
          top: scaleWidth(352),
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
          </View>

          {/* Front Box */}
          <View style={{
            position: 'absolute',
            top: -10,
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
                track={profile.track || 'GENERAL'}
                teamBadge={profile.teamBadge || ''}
                tier={profile.tier}
                pointsAccumulated={profile.pointsAccumulated}
              />
            </View>
          </View>

          {/* Team Badge */}
          <View
            style={{
              position: 'absolute',
              top: scaleWidth(-313),
              left: scaleWidth(20),
              alignItems: 'center',
            }}
          >
            <View style={{
              width: scaleWidth(83.557),
              height: scaleWidth(83.557),
              overflow: 'visible',
            }}>
              <TeamBadgeSvg
                width={scaleWidth(83.557)}
                height={scaleWidth(83.557)}
              />
              {profile.teamBadge && (
                <Image
                  source={{ uri: profile.teamBadge }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: scaleWidth(83.557),
                    height: scaleWidth(83.557),
                  }}
                  resizeMode="contain"
                />
              )}
              <View style={{
                position: 'absolute',
                bottom: scaleWidth(-4),
                right: scaleWidth(-4),
                width: scaleWidth(28),
                height: scaleWidth(28),
                borderRadius: scaleWidth(14),
                backgroundColor: teamRank !== null && teamRank <= 4 ? RANK_COLORS[teamRank] : '#888',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: scaleWidth(2),
                borderColor: '#1a0040',
                zIndex: 1,
              }}>
                {teamRank !== null ? (
                  <Text style={{
                    fontFamily: 'Tsukimi Rounded',
                    fontWeight: '700',
                    fontSize: scaleWidth(10),
                    color: '#1a0040',
                    lineHeight: scaleWidth(12),
                  }}>{teamRank}<Text style={{ fontSize: scaleWidth(6) }}>{getRankSuffix(teamRank)}</Text></Text>
                ) : (
                  <Text style={{
                    fontFamily: 'Tsukimi Rounded',
                    fontWeight: '700',
                    fontSize: scaleWidth(8),
                    color: '#1a0040',
                  }}>--</Text>
                )}
              </View>
            </View>
            <Text
              style={{
                marginTop: scaleWidth(8),
                width: scaleWidth(83.557),
                fontFamily: 'Tsukimi Rounded',
                fontWeight: '700',
                fontSize: scaleWidth(9),
                lineHeight: scaleWidth(11),
                textAlign: 'center',
                color: '#FFFFFF',
              }}
              numberOfLines={2}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >{profile.team ? profile.team.toUpperCase() : 'NO TEAM'}</Text>
          </View>

          {/* QR Code Button */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: scaleWidth(-183),
              left: scaleWidth(20),
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handlePressQrCode}
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
        displayName={profile.displayName}
      />

      <AvatarSelectionModal
        visible={showAvatarModal}
        currentAvatarId={profile.avatarUrl?.split('/').pop()?.replace('.png', '').replace('.svg', '') || null}
        displayName={profile.displayName}
        discordTag={profile.discordTag}
        onClose={() => setShowAvatarModal(false)}
        onAvatarSelected={(avatarUrl) => {
          queryClient.setQueryData<UserProfile>(["profile"], (prev) =>
            prev ? { ...prev, avatarUrl } : prev
          );
        }}
      />

    </SafeAreaView>
  );
}
