import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
import { AVATARS, getAvatarById, getCharacterIdFromUrl } from './avatarConfig';

interface ProfileAvatarProps {
  avatarUrl: string | null;
  avatarId?: string | null;
  onPress: () => void;
}

const AVATAR_HEIGHT = 152;

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ avatarUrl, avatarId, onPress }) => {
  const avatar = getAvatarById(avatarId || getCharacterIdFromUrl(avatarUrl)) ?? AVATARS[0];
  const LocalAvatar = avatar.component;
  const aspectRatio = avatar.profileDimensions.width / avatar.profileDimensions.height;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Change avatar"
      style={{ width: AVATAR_HEIGHT * aspectRatio, maxWidth: "100%", height: AVATAR_HEIGHT }}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.image} resizeMode="contain" />
      ) : (
        <LocalAvatar width="100%" height="100%" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  image: { width: "100%", height: "100%" },
});
