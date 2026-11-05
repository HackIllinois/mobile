import React from 'react';
import { Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MAX_APP_WIDTH } from '../../lib/layout';
import { AVATARS, getAvatarById, getCharacterIdFromUrl } from './avatarConfig';

interface ProfileAvatarProps {
  avatarUrl: string | null;
  avatarId?: string | null;
  onPress: () => void;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ avatarUrl, avatarId, onPress }) => {
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(windowWidth, MAX_APP_WIDTH, 393) / 393;
  const avatar = getAvatarById(avatarId || getCharacterIdFromUrl(avatarUrl)) ?? AVATARS[0];
  const LocalAvatar = avatar.component;
  const height = 220 * scale;
  const width = height * avatar.profileDimensions.width / avatar.profileDimensions.height;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Change avatar"
      style={{ width, height }}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width, height }} resizeMode="contain" />
      ) : (
        <LocalAvatar width={width} height={height} />
      )}
    </TouchableOpacity>
  );
};
