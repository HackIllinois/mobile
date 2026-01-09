import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';

import ChooseTitleSvg from '../../assets/profile/avatar-screen/choose-title.svg';
import UfoTractorBeamSvg from '../../assets/profile/avatar-screen/ufo-tractor-beam.svg';
import SelectAvatarButtonsSvg from '../../assets/profile/avatar-screen/select-avatar-buttons.svg';
import BackgroundSvg from '../../assets/profile/background.svg';
import NavBarSvg from '../../assets/profile/nav-bar.svg';

import BlueGreyAvatarSvg from '../../assets/profile/avatar-screen/avatars/blue-grey.svg';
import OrangeBlackAvatarSvg from '../../assets/profile/avatar-screen/avatars/orange-black.svg';
import OrangeWhiteAvatarSvg from '../../assets/profile/avatar-screen/avatars/orange-white.svg';
import PinkBlackAvatarSvg from '../../assets/profile/avatar-screen/avatars/pink-black.svg';
import PurpleWhiteAvatarSvg from '../../assets/profile/avatar-screen/avatars/purple-white.svg';
import RedWhiteAvatarSvg from '../../assets/profile/avatar-screen/avatars/red-white.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HEADER_WIDTH = SCREEN_WIDTH * (222 / 393);
const HEADER_HEIGHT = SCREEN_WIDTH * (51 / 393);
const HEADER_TOP = SCREEN_WIDTH * (55 / 393);
const HEADER_LEFT = SCREEN_WIDTH * (31 / 393);

const BUTTON_BORDER_WIDTH = SCREEN_WIDTH * (248 / 393);
const BUTTON_BORDER_HEIGHT = SCREEN_WIDTH * (40 / 393);
const BUTTON_BORDER_TOP = SCREEN_WIDTH * (125 / 393);
const BUTTON_BORDER_LEFT = SCREEN_WIDTH * (74 / 393);

const AVATAR_WIDTH = SCREEN_WIDTH * (156 / 393);
const AVATAR_HEIGHT = SCREEN_WIDTH * (300 / 393);
const AVATAR_TOP = SCREEN_WIDTH * (288 / 393);
const AVATAR_LEFT = SCREEN_WIDTH * (125 / 393);

const NAV_BUTTONS_WIDTH = SCREEN_WIDTH * (317 / 393);
const NAV_BUTTONS_HEIGHT = SCREEN_WIDTH * (48 / 393);
const NAV_BUTTONS_TOP = SCREEN_WIDTH * (667 / 393);
const NAV_BUTTONS_LEFT = SCREEN_WIDTH * (38 / 393);

const UFO_BEAM_WIDTH = SCREEN_WIDTH * (244 / 393);
const UFO_BEAM_HEIGHT = SCREEN_WIDTH * (382 / 393);
const UFO_BEAM_TOP = SCREEN_WIDTH * (270 / 393);
const UFO_BEAM_LEFT = SCREEN_WIDTH * (78 / 393);

const LEFT_AVATAR_WIDTH = SCREEN_WIDTH * (85.456 / 393);
const LEFT_AVATAR_HEIGHT = SCREEN_WIDTH * (190 / 393);
const LEFT_AVATAR_TOP = SCREEN_WIDTH * (340 / 393);
const LEFT_AVATAR_LEFT = SCREEN_WIDTH * (16 / 393);

const RIGHT_AVATAR_WIDTH = SCREEN_WIDTH * (100.976 / 393);
const RIGHT_AVATAR_HEIGHT = SCREEN_WIDTH * (204 / 393);
const RIGHT_AVATAR_TOP = SCREEN_WIDTH * (326 / 393);
const RIGHT_AVATAR_LEFT = SCREEN_WIDTH * (287 / 393);

interface AvatarSelectionModalProps {
  visible: boolean;
  currentAvatarId: string | null;
  onClose: () => void;
}

const AVATARS = [
  { id: 'blue-grey', component: BlueGreyAvatarSvg },
  { id: 'orange-black', component: OrangeBlackAvatarSvg },
  { id: 'orange-white', component: OrangeWhiteAvatarSvg },
  { id: 'pink-black', component: PinkBlackAvatarSvg },
  { id: 'purple-white', component: PurpleWhiteAvatarSvg },
  { id: 'red-white', component: RedWhiteAvatarSvg },
];

export const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  visible,
  currentAvatarId,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

  // Floating animation effect
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

  const handleSelect = () => {
    onClose();
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
      <View style={styles.modalContent}>
          <View style={styles.backgroundWrapper}>
            <BackgroundSvg
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              preserveAspectRatio="xMidYMid slice"
            />
          </View>

          {/* Header */}
          <Text style={styles.headerText}>PROFILE</Text>

          {/* Choose Title */}
          <View style={styles.chooseTitleContainer}>
            <ChooseTitleSvg
              width={BUTTON_BORDER_WIDTH}
              height={BUTTON_BORDER_HEIGHT}
            />
          </View>

          {/* UFO Beam */}
          <View style={styles.ufoBeamContainer}>
            <UfoTractorBeamSvg
              width={UFO_BEAM_WIDTH}
              height={UFO_BEAM_HEIGHT}
            />
          </View>

          {/* Previous Avatar */}
          <View style={styles.leftAvatarContainer}>
            <PreviousAvatarComponent
              width={LEFT_AVATAR_WIDTH}
              height={LEFT_AVATAR_HEIGHT}
            />
          </View>

          {/* Center Avatar */}
          <Animated.View
            style={[
              styles.avatarContainer,
              {
                transform: [{ translateY: floatAnim }],
              },
            ]}
          >
            <AvatarComponent
              width={AVATAR_WIDTH}
              height={AVATAR_HEIGHT}
            />
          </Animated.View>

          {/* Next Avatar */}
          <View style={styles.rightAvatarContainer}>
            <NextAvatarComponent
              width={RIGHT_AVATAR_WIDTH}
              height={RIGHT_AVATAR_HEIGHT}
            />
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            <SelectAvatarButtonsSvg
              width={NAV_BUTTONS_WIDTH}
              height={NAV_BUTTONS_HEIGHT}
            />
            {/* Left arrow */}
            <TouchableOpacity
              style={styles.leftArrowHitbox}
              onPress={handlePreviousAvatar}
            />
            {/* Center select button */}
            {/* Just exit for now, TODO: API Handling */}
            <TouchableOpacity
              style={styles.centerSelectHitbox}
              onPress={handleSelect}
            />
            {/* Right arrow */}
            <TouchableOpacity
              style={styles.rightArrowHitbox}
              onPress={handleNextAvatar}
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Navbar */}
          {/* TODO: Doesn't work, make it fixed */}
          <View style={styles.navbarWrapper}>
            <NavBarSvg
              width={SCREEN_WIDTH}
              height={SCREEN_WIDTH * (108 / 393)}
            />
          </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  backgroundWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 0,
  },
  navbarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * (108 / 393),
    zIndex: 5,
  },
  headerText: {
    position: 'absolute',
    top: HEADER_TOP,
    left: HEADER_LEFT,
    width: HEADER_WIDTH,
    height: HEADER_HEIGHT,
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'left',
    letterSpacing: 1.5,
    fontFamily: 'Tsukimi Rounded',
    zIndex: 5,
  },
  chooseTitleContainer: {
    position: 'absolute',
    top: BUTTON_BORDER_TOP,
    left: BUTTON_BORDER_LEFT,
    width: BUTTON_BORDER_WIDTH,
    height: BUTTON_BORDER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  ufoBeamContainer: {
    position: 'absolute',
    top: UFO_BEAM_TOP,
    left: UFO_BEAM_LEFT,
    width: UFO_BEAM_WIDTH,
    height: UFO_BEAM_HEIGHT,
    opacity: 0.5,
    zIndex: 1,
  },
  leftAvatarContainer: {
    position: 'absolute',
    top: LEFT_AVATAR_TOP,
    left: LEFT_AVATAR_LEFT,
    width: LEFT_AVATAR_WIDTH,
    height: LEFT_AVATAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
    zIndex: 1,
  },
  avatarContainer: {
    position: 'absolute',
    top: AVATAR_TOP,
    left: AVATAR_LEFT,
    width: AVATAR_WIDTH,
    height: AVATAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  rightAvatarContainer: {
    position: 'absolute',
    top: RIGHT_AVATAR_TOP,
    left: RIGHT_AVATAR_LEFT,
    width: RIGHT_AVATAR_WIDTH,
    height: RIGHT_AVATAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
    zIndex: 1,
  },
  navigationContainer: {
    position: 'absolute',
    top: NAV_BUTTONS_TOP,
    left: NAV_BUTTONS_LEFT,
    width: NAV_BUTTONS_WIDTH,
    height: NAV_BUTTONS_HEIGHT,
    zIndex: 3,
  },
  leftArrowHitbox: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: NAV_BUTTONS_WIDTH / 3,
    height: NAV_BUTTONS_HEIGHT,
  },
  centerSelectHitbox: {
    position: 'absolute',
    left: NAV_BUTTONS_WIDTH / 3,
    top: 0,
    width: NAV_BUTTONS_WIDTH / 3,
    height: NAV_BUTTONS_HEIGHT,
  },
  rightArrowHitbox: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: NAV_BUTTONS_WIDTH / 3,
    height: NAV_BUTTONS_HEIGHT,
  },
  errorContainer: {
    position: 'absolute',
    bottom: SCREEN_WIDTH * (100 / 393),
    left: SCREEN_WIDTH * (40 / 393),
    right: SCREEN_WIDTH * (40 / 393),
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    borderRadius: 10,
    padding: 12,
    zIndex: 10,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
