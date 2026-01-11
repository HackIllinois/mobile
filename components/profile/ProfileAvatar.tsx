import React from 'react';
import { Image, View, useWindowDimensions } from 'react-native';
import { getAvatarById, getCharacterIdFromUrl } from './avatarConfig';

interface ProfileAvatarProps {
  avatarUrl: string | null;
  avatarId?: string | null; 
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ avatarUrl, avatarId }) => {
  const { width, height } = useWindowDimensions();

  const figmaWidth = 393;
  const figmaHeight = 852;
  const scaleWidth = (size: number) => (width / figmaWidth) * size;
  const scaleHeight = (size: number) => (height / figmaHeight) * size;

  const characterId = avatarId || getCharacterIdFromUrl(avatarUrl);
  const avatarConfig = getAvatarById(characterId);

  const DEFAULT_WIDTH = 140;
  const baseAvatarWidth = avatarConfig?.profileDimensions.width || DEFAULT_WIDTH;
  const baseAvatarHeight = avatarConfig?.profileDimensions.height || 300;

  const widthDifference = baseAvatarWidth - DEFAULT_WIDTH;
  const leftOffset = -(widthDifference / 2);

  const AVATAR_CONTAINER_WIDTH = scaleWidth(baseAvatarWidth + 55);
  const AVATAR_WIDTH = scaleWidth(baseAvatarWidth);
  const AVATAR_HEIGHT = scaleWidth(baseAvatarHeight);

  return (
    <View style={{
      position: 'absolute',
      top: scaleWidth(-1),
      left: scaleWidth(45 + leftOffset),
      width: AVATAR_CONTAINER_WIDTH,
      height: AVATAR_HEIGHT,
      overflow: 'visible',
    }}>
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
            : require('../../assets/profile.png')
        }
        onError={() => console.log('Failed to load avatar image')}
      />
    </View>
  );
};
