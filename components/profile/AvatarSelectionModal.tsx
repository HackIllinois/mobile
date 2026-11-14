import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ModalWindow } from '../layout/ModalLayout';
import { SafeAreaView } from "react-native-safe-area-context";
import { layoutStyles } from "../../lib/layout";
import api from '../../api';


import { AVATARS } from './avatarConfig';

interface AvatarSelectionModalProps {
  visible: boolean;
  currentAvatarId: string | null;
  displayName: string;
  discordTag: string;
  onClose: () => void;
  onAvatarSelected: (avatarUrl: string) => void;
}

interface ProfileUpdateResponse {
  data: {
    avatarUrl: string;
  };
}


export const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  visible,
  currentAvatarId,
  displayName,
  discordTag,
  onClose,
  onAvatarSelected,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);


  useEffect(() => {
    if (visible && currentAvatarId) {
      const index = AVATARS.findIndex(avatar => avatar.id === currentAvatarId);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }

    if (visible) {
      setError(null);
    }
  }, [visible, currentAvatarId]);

  const handlePreviousAvatar = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? AVATARS.length - 1 : prevIndex - 1
    );
  };

  const handleNextAvatar = () => {
    setCurrentIndex((prevIndex) =>
      (prevIndex + 1) % AVATARS.length
    );
  };

  const handleSelect = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      const selectedAvatarId = AVATARS[currentIndex].id;
      const response = await api.put<ProfileUpdateResponse>('profile', {
        displayName,
        discordTag,
        avatarId: selectedAvatarId,
      });

      if (response.data && response.data.avatarUrl) {
        onAvatarSelected(response.data.avatarUrl);
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to update avatar:', error);
      setError(error.response?.data?.message || 'Failed to update avatar. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const { component: AvatarComponent, modalDimensions } = AVATARS[currentIndex];
  const avatarRatio = modalDimensions.width / modalDimensions.height;

  return (
    <ModalWindow
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onClose={onClose}
    >
      <SafeAreaView style={[layoutStyles.fill, styles.screen]}>
        <ScrollView contentContainerStyle={[layoutStyles.column, styles.content]}>
          <Text style={styles.headerText}>Choose your avatar!</Text>

          <View style={styles.selector}>
            <TouchableOpacity
              onPress={handlePreviousAvatar}
              disabled={isUpdating}
              style={styles.arrowButton}
              accessibilityLabel="Previous avatar"
            >
              <Text style={styles.arrow}>‹</Text>
            </TouchableOpacity>
            <View style={[styles.avatar, { aspectRatio: avatarRatio }]}>
              <AvatarComponent width="100%" height="100%" />
            </View>
            <TouchableOpacity
              onPress={handleNextAvatar}
              disabled={isUpdating}
              style={styles.arrowButton}
              accessibilityLabel="Next avatar"
            >
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            onPress={handleSelect}
            disabled={isUpdating}
            style={[styles.saveButton, isUpdating && styles.disabled]}
          >
            {isUpdating ? (
              <ActivityIndicator color="#1d1ab5ff" />
            ) : (
              <Text style={styles.buttonText}>Save Avatar</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} disabled={isUpdating} style={styles.cancelButton}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ModalWindow>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#1a0040',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  headerText: {
    textAlign: 'center',
    fontSize: 20,
    color: '#fff',
  },
  selector: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButton: {
    width: 48,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 40,
    color: '#fff',
  },
  avatar: {
    flex: 1,
    minWidth: 0,
    maxWidth: 156,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 200,
    padding: 12,
    borderWidth: 5,
    borderRadius: 10,
    borderColor: '#fff',
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#fff',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 140,
    padding: 12,
    borderWidth: 5,
    borderRadius: 10,
    borderColor: '#fff',
  },
  errorText: {
    textAlign: 'center',
    color: '#FFB4B4',
  },
});
