import React from 'react';
import { Image, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = SCREEN_WIDTH * 0.35;

interface ProfileAvatarProps {
  avatarUrl: string | null;
  onQRCodePress: () => void;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ avatarUrl, onQRCodePress }) => {
  return (
    <>
      <Image
        style={styles.avatar}
        source={
          avatarUrl
            ? { uri: avatarUrl }
            : require('../../assets/profile.png')
        }
        onError={() => console.log('Failed to load avatar image')}
      />

      <TouchableOpacity
        style={styles.qrCodeButton}
        onPress={onQRCodePress}
      >
        <Text style={styles.qrCodeButtonText}>QR Code</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 0,
    marginBottom: 15,
    backgroundColor: '#333',
  },
  qrCodeButton: {
    backgroundColor: '#BEBEBE',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 15,
    marginBottom: 10,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  qrCodeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
