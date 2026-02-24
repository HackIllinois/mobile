import React, { useRef } from 'react';
import { Animated, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MAX_APP_WIDTH } from '../../lib/layout';
import { getAvatarById, getCharacterIdFromUrl } from './avatarConfig';
import * as Haptics from 'expo-haptics';

interface ProfileAvatarProps {
  avatarUrl: string | null;
  avatarId?: string | null;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ avatarUrl, avatarId }) => {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, MAX_APP_WIDTH);

  const figmaWidth = 393;
  const scaleWidth = (size: number) => (width / figmaWidth) * size;

  const characterId = avatarId || getCharacterIdFromUrl(avatarUrl);
  const avatarConfig = getAvatarById(characterId);

  const DEFAULT_WIDTH = 140;
  const baseAvatarWidth = avatarConfig?.profileDimensions.width || DEFAULT_WIDTH;
  const baseAvatarHeight = avatarConfig?.profileDimensions.height || 300;
  const resolvedLeft = avatarConfig?.profileLeft ?? 45;
  const glowColor = avatarConfig?.profileGlowColor ?? '#FFFFFF';

  const AVATAR_CONTAINER_WIDTH = scaleWidth(baseAvatarWidth + 55);
  const AVATAR_WIDTH = scaleWidth(baseAvatarWidth);
  const AVATAR_HEIGHT = scaleWidth(baseAvatarHeight);

  // Single animated value drives both scale and opacity
  const glowAnim = useRef(new Animated.Value(0)).current;
  const handlePress = () => {
    Haptics.selectionAsync();
    triggerGlow();
  }

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.3, 1.2, 1.5],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 0.5, 0],
  });

  const triggerGlow = () => {
    glowAnim.setValue(0);
    Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 2, duration: 500, useNativeDriver: true }),
    ]).start(() => glowAnim.setValue(0));
  };

  const CIRCLE_SIZE = scaleWidth(140);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      style={{
        position: 'absolute',
        top: scaleWidth(-11),
        left: scaleWidth(resolvedLeft),
        width: AVATAR_CONTAINER_WIDTH,
        height: AVATAR_HEIGHT,
        overflow: 'visible',
      }}
    >
      {/* Glow: circle with large shadow to soften the edge */}
      <Animated.View
        style={{
          position: 'absolute',
          width: CIRCLE_SIZE,
          height: CIRCLE_SIZE,
          borderRadius: CIRCLE_SIZE / 2,
          left: (AVATAR_WIDTH - CIRCLE_SIZE) / 2,
          top: AVATAR_HEIGHT / 2 - CIRCLE_SIZE / 2,
          backgroundColor: glowColor,
          shadowColor: glowColor,
          shadowRadius: scaleWidth(30),
          shadowOpacity: 1,
          shadowOffset: { width: 0, height: 0 },
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        }}
      />
      <Image
        style={{
          width: AVATAR_WIDTH,
          height: AVATAR_HEIGHT,
          borderRadius: 0,
          borderWidth: 0,
          backgroundColor: 'transparent',
        }}
        source={
          avatarUrl
            ? { uri: avatarUrl }
            : require('../../assets/profile/avatar-screen/avatars/character1.svg')
        }
        onError={() => console.log('Failed to load avatar image')}
      />
    </TouchableOpacity>
  );
};
