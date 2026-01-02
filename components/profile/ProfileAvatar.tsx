import React from 'react';
import { Image, View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AVATAR_WIDTH = SCREEN_WIDTH * (140 / 393);
const AVATAR_HEIGHT = SCREEN_WIDTH * (300 / 393);

interface ProfileAvatarProps {
  avatarUrl: string | null;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ avatarUrl }) => {
  return (
    <View style={styles.avatarContainer}>
      <Image
        style={styles.avatar}
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

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'absolute',
    top: SCREEN_WIDTH * ((129 - 130) / 393), 
    left: SCREEN_WIDTH * (74 / 393),
    width: AVATAR_WIDTH,
    height: AVATAR_HEIGHT,
  },
  avatar: {
    width: AVATAR_WIDTH,
    height: AVATAR_HEIGHT,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: '#333',
  },
});
