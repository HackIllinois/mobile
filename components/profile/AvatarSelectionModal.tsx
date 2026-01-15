import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import api from '../../api';

import ChooseTitleSvg from '../../assets/profile/avatar-screen/choose-title.svg';
import UfoTractorBeamSvg from '../../assets/profile/avatar-screen/ufo-tractor-beam.svg';
import SelectAvatarButtonsSvg from '../../assets/profile/avatar-screen/select-avatar-buttons.svg';
import BackgroundSvg from '../../assets/profile/background.svg';
import NavBarSvg from '../../assets/profile/nav-bar.svg';

import Character1AvatarSvg from '../../assets/profile/avatar-screen/avatars/character1.svg';
import Character2AvatarSvg from '../../assets/profile/avatar-screen/avatars/character2.svg';
import Character3AvatarSvg from '../../assets/profile/avatar-screen/avatars/character3.svg';
import Character4AvatarSvg from '../../assets/profile/avatar-screen/avatars/character4.svg';
import Character5AvatarSvg from '../../assets/profile/avatar-screen/avatars/character5.svg';

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

const AVATARS = [
  { id: 'character1', component: Character1AvatarSvg },
  { id: 'character2', component: Character2AvatarSvg },
  { id: 'character3', component: Character3AvatarSvg },
  { id: 'character4', component: Character4AvatarSvg },
  { id: 'character5', component: Character5AvatarSvg },
];

export const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  visible,
  currentAvatarId,
  displayName,
  discordTag,
  onClose,
  onAvatarSelected,
}) => {
  const { width, height } = useWindowDimensions();

  const figmaWidth = 393;
  const figmaHeight = 852;
  const scaleWidth = (size: number) => (width / figmaWidth) * size;
  const scaleHeight = (size: number) => (height / figmaHeight) * size;
  const scaleFontSize = (size: number) => Math.min(scaleWidth(size), scaleHeight(size));

  const HEADER_WIDTH = scaleWidth(222);
  const HEADER_HEIGHT = scaleWidth(51);
  const HEADER_TOP = scaleWidth(55);
  const HEADER_LEFT = scaleWidth(31);

  const BUTTON_BORDER_WIDTH = scaleWidth(248);
  const BUTTON_BORDER_HEIGHT = scaleWidth(40);
  const BUTTON_BORDER_TOP = scaleWidth(125);
  const BUTTON_BORDER_LEFT = scaleWidth(74);

  const AVATAR_WIDTH = scaleWidth(156);
  const AVATAR_HEIGHT = scaleWidth(300);
  const AVATAR_TOP = scaleWidth(300);
  const AVATAR_LEFT = scaleWidth(118);

  const NAV_BUTTONS_WIDTH = scaleWidth(317);
  const NAV_BUTTONS_HEIGHT = scaleWidth(48);
  const NAV_BUTTONS_TOP = scaleWidth(667);
  const NAV_BUTTONS_LEFT = scaleWidth(38);

  const UFO_BEAM_WIDTH = scaleWidth(244);
  const UFO_BEAM_HEIGHT = scaleWidth(382);
  const UFO_BEAM_TOP = scaleWidth(270);
  const UFO_BEAM_LEFT = scaleWidth(78);

  const LEFT_AVATAR_WIDTH = scaleWidth(85.456);
  const LEFT_AVATAR_HEIGHT = scaleWidth(190);
  const LEFT_AVATAR_TOP = scaleWidth(352);
  const LEFT_AVATAR_LEFT = scaleWidth(10);

  const RIGHT_AVATAR_WIDTH = scaleWidth(100.976);
  const RIGHT_AVATAR_HEIGHT = scaleWidth(204);
  const RIGHT_AVATAR_TOP = scaleWidth(338);
  const RIGHT_AVATAR_LEFT = scaleWidth(280);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const floatAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (visible) {
      const floatAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -10,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      floatAnimation.start();
      return () => floatAnimation.stop();
    }
  }, [visible, floatAnim]);

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
  const previousIndex = currentIndex === 0 ? AVATARS.length - 1 : currentIndex - 1;
  const nextIndex = (currentIndex + 1) % AVATARS.length;
  const PreviousAvatarComponent = AVATARS[previousIndex].component;
  const NextAvatarComponent = AVATARS[nextIndex].component;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={{
        flex: 1,
        width: width,
        height: height,
        backgroundColor: '#F5F5F5',
        position: 'relative',
      }}>
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: width,
            height: height,
            zIndex: 0,
          }}>
            <BackgroundSvg
              width={width}
              height={height}
              preserveAspectRatio="xMidYMid slice"
            />
          </View>

          {/* Header */}
          <Text style={{
            position: 'absolute',
            top: HEADER_TOP,
            left: HEADER_LEFT,
            width: HEADER_WIDTH,
            height: HEADER_HEIGHT,
            fontSize: scaleFontSize(26),
            fontWeight: 'bold',
            color: '#FFFFFF',
            textAlign: 'left',
            letterSpacing: scaleWidth(1.5),
            fontFamily: 'Tsukimi Rounded',
            zIndex: 5,
          }}>PROFILE</Text>

          {/* Choose Title */}
          <View style={{
            position: 'absolute',
            top: BUTTON_BORDER_TOP,
            left: BUTTON_BORDER_LEFT,
            width: BUTTON_BORDER_WIDTH,
            height: BUTTON_BORDER_HEIGHT,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 5,
          }}>
            <ChooseTitleSvg
              width={BUTTON_BORDER_WIDTH}
              height={BUTTON_BORDER_HEIGHT}
            />
          </View>

          {/* UFO Beam */}
          <View style={{
            position: 'absolute',
            top: UFO_BEAM_TOP,
            left: UFO_BEAM_LEFT,
            width: UFO_BEAM_WIDTH,
            height: UFO_BEAM_HEIGHT,
            opacity: 0.5,
            zIndex: 1,
          }}>
            <UfoTractorBeamSvg
              width={UFO_BEAM_WIDTH}
              height={UFO_BEAM_HEIGHT}
            />
          </View>

          {/* Previous Avatar */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: LEFT_AVATAR_TOP,
              left: LEFT_AVATAR_LEFT,
              width: LEFT_AVATAR_WIDTH,
              height: LEFT_AVATAR_HEIGHT,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: 0.5,
              zIndex: 1,
            }}
            onPress={handlePreviousAvatar}
            disabled={isUpdating}
            activeOpacity={0.7}
          >
            <PreviousAvatarComponent
              width={LEFT_AVATAR_WIDTH}
              height={LEFT_AVATAR_HEIGHT}
            />
          </TouchableOpacity>

          {/* Center Avatar */}
          <Animated.View
            style={{
              position: 'absolute',
              top: AVATAR_TOP,
              left: AVATAR_LEFT,
              width: AVATAR_WIDTH,
              height: AVATAR_HEIGHT,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2,
              transform: [{ translateY: floatAnim }],
            }}
          >
            <AvatarComponent
              width={AVATAR_WIDTH}
              height={AVATAR_HEIGHT}
            />
          </Animated.View>

          {/* Next Avatar */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: RIGHT_AVATAR_TOP,
              left: RIGHT_AVATAR_LEFT,
              width: RIGHT_AVATAR_WIDTH,
              height: RIGHT_AVATAR_HEIGHT,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: 0.5,
              zIndex: 1,
            }}
            onPress={handleNextAvatar}
            disabled={isUpdating}
            activeOpacity={0.7}
          >
            <NextAvatarComponent
              width={RIGHT_AVATAR_WIDTH}
              height={RIGHT_AVATAR_HEIGHT}
            />
          </TouchableOpacity>

          {/* Navigation Buttons */}
          <View style={{
            position: 'absolute',
            top: NAV_BUTTONS_TOP,
            left: NAV_BUTTONS_LEFT,
            width: NAV_BUTTONS_WIDTH,
            height: NAV_BUTTONS_HEIGHT,
            zIndex: 3,
          }}>
            <SelectAvatarButtonsSvg
              width={NAV_BUTTONS_WIDTH}
              height={NAV_BUTTONS_HEIGHT}
            />
            {/* Left arrow */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: NAV_BUTTONS_WIDTH / 3,
                height: NAV_BUTTONS_HEIGHT,
              }}
              onPress={handlePreviousAvatar}
              disabled={isUpdating}
            />
            {/* Center select button */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                left: NAV_BUTTONS_WIDTH / 3,
                top: 0,
                width: NAV_BUTTONS_WIDTH / 3,
                height: NAV_BUTTONS_HEIGHT,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleSelect}
              disabled={isUpdating}
            >
              {isUpdating && (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                  style={{
                    position: 'absolute',
                  }}
                />
              )}
            </TouchableOpacity>
            {/* Right arrow */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: NAV_BUTTONS_WIDTH / 3,
                height: NAV_BUTTONS_HEIGHT,
              }}
              onPress={handleNextAvatar}
              disabled={isUpdating}
            />
          </View>

          {error && (
            <View style={{
              position: 'absolute',
              bottom: scaleWidth(100),
              left: scaleWidth(40),
              right: scaleWidth(40),
              backgroundColor: 'rgba(255, 0, 0, 0.9)',
              borderRadius: scaleWidth(10),
              padding: scaleWidth(12),
              zIndex: 10,
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: scaleFontSize(14),
                fontWeight: '600',
                textAlign: 'center',
              }}>{error}</Text>
            </View>
          )}

          {/* Navbar */}
          {/* TODO: Doesn't work, make it fixed */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: width,
            height: scaleWidth(108),
            zIndex: 5,
          }}>
            <NavBarSvg
              width={width}
              height={scaleWidth(108)}
            />
          </View>
      </View>
    </Modal>
  );
};
