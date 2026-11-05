import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
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
  const { height } = useWindowDimensions();
  const avatarHeight = Math.min(400, height * 0.45);


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

  const AvatarComponent = AVATARS[currentIndex].component;

  return (
   <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <View style={styles.header}>
            <Text style={styles.headerText}>
              Choose your avatar!
            </Text>
          </View>

          {/* Choose an avatar */}
          <View style={styles.selector}>
            <TouchableOpacity 
              onPress={handlePreviousAvatar}
              disabled={isUpdating}
              style={styles.arrowButton}
              >
                <Text style={styles.arrow}>‹</Text>
            </TouchableOpacity>
            <View style={styles.avatar}>
              <AvatarComponent
                width="100%"
                height={avatarHeight}
              />
            </View>
            <TouchableOpacity 
              onPress={handleNextAvatar}
              disabled={isUpdating}
              style={styles.arrowButton}
              >
                <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Handle errors */}
          {error && (
            <Text style={{textAlign: "center", color: "#f80000ff"}}>{error}</Text>
          )}
          
          {/* Save Avatar */}
          <TouchableOpacity 
            onPress={handleSelect}
            disabled={isUpdating}
            style={[styles.saveButton,
              isUpdating && styles.disabled,
            ]}
            >
              {isUpdating? (
                <ActivityIndicator color= "#1d1ab5ff"/>
              ) : (
                <Text style={styles.buttonText}>
                  Save Avatar
                </Text>
              )}
            </TouchableOpacity>
            
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            disabled={isUpdating}
            style={styles.cancelButton}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );

 

};
 const styles =  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#1a0040',
    },
    header: {
      paddingTop: 20,
      alignItems: "center",
    },
    headerText: {
      alignItems: "center",
      fontSize: 20,
      color: "#ffff",
    },
    selector: {
      flex: 1,
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    arrowButton:{
      width: 48,
      height: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrow: {
      fontSize: 40,
      alignItems: 'center',
      color: "#fff"
    },
    avatar: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    saveButton: {
      alignItems: "center",
      alignSelf: "center",
      justifyContent: "center",
      width: "50%",
      padding: 15,
      borderWidth: 5,
      borderRadius: 10,
      borderColor: "#ffff"
    },
    disabled: {
      opacity: 0.5
    }, 
    buttonText: {
      fontSize: 13,
      color: "#ffff"
    },
    cancelButton: {
      marginTop: 10,
      alignItems: "center",
      alignSelf: "center",
      justifyContent: "center",
      width: "30%",
      padding: 15,
      borderWidth: 5,
      borderRadius: 10,
      borderColor: "#ffff"
    }
});
