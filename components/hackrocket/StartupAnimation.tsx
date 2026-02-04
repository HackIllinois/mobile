import React, { useRef, useEffect } from 'react';
import { StyleSheet, Animated, Easing, useWindowDimensions, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import HackRocket from '../../assets/onboarding/hack-rocket.svg';
import Clouds from '../../assets/onboarding/loading/clouds.svg';
import TinyStars from '../../assets/onboarding/loading/tiny stars.svg';
import Hackastra from '../../assets/onboarding/welcome/hackastra.svg';
import StartButton from '../../assets/onboarding/welcome/start-button.svg';

type StartupAnimationProps = {
  cloudX1: Animated.Value;
  cloudX2: Animated.Value;
  starOpacity: Animated.Value;
};

export default function StartupAnimation({ cloudX1, cloudX2, starOpacity }: StartupAnimationProps) {
  const { width, height } = useWindowDimensions();

  // Figma design dimensions (matching WelcomePage.tsx)
  const figmaWidth = 393;
  const figmaHeight = 852;

  // Responsive scaling functions (matching WelcomePage.tsx)
  const scaleWidth = (size: number) => (width / figmaWidth) * size;
  const scaleHeight = (size: number) => (height / figmaHeight) * size;
  const scaleFontSize = (size: number) => Math.min(scaleWidth(size), scaleHeight(size));

  // Scale rocket so it's wider than the screen (wings get clipped)
  const ROCKET_SCALE = (width * 1.8) / 352.3;

  const CLOUDS_WIDTH = scaleWidth(669.17);
  const CLOUDS_HEIGHT = scaleHeight(720.11);
  const CLOUDS_TOP = height * 0.07;
  const CLOUDS_LEFT = -width * 0.39;

  const STARS_WIDTH = scaleWidth(499.59);
  const STARS_HEIGHT = scaleHeight(614);
  const STARS_TOP = height * 0.04;
  const STARS_LEFT = -width * 0.12;

  // Position rocket to align with HalfRocket from WelcomePage
  const ROCKET_TOP = scaleHeight(450);
  const ROCKET_LEFT = (width - 260) / 2;

  // Component positions matching WelcomePage.tsx
  const HACKASTRA_WIDTH = scaleWidth(289);
  const HACKASTRA_HEIGHT = scaleHeight(125.84);
  const HACKASTRA_TOP = scaleHeight(80);
  const HACKASTRA_LEFT = scaleWidth(54);

  const HEADER_TOP = scaleHeight(260);
  const HEADER_WIDTH = scaleWidth(327);
  const HEADER_LEFT = scaleWidth(33);

  const SUBTITLE_WIDTH = scaleWidth(327 * 0.8);

  const BUTTON_TOP = scaleHeight(365);
  const BUTTON_LEFT = scaleWidth(125);
  const BUTTON_WIDTH = scaleWidth(143);
  const BUTTON_HEIGHT = scaleHeight(94);

  // Font sizes matching WelcomePage.tsx
  const HEADER_FONT_SIZE = scaleFontSize(28);
  const HEADER_LINE_HEIGHT = scaleHeight(32);
  const HEADER_LETTER_SPACING = scaleWidth(0.14);
  const SUBTITLE_FONT_SIZE = scaleFontSize(16);
  const SUBTITLE_LINE_HEIGHT = scaleHeight(22);
  const SUBTITLE_LETTER_SPACING = scaleWidth(0.28);
  const SKIP_FONT_SIZE = scaleFontSize(18);

  const translateY = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Rocket flies up from bottom and content fades out simultaneously
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -(height + 864.7 * ROCKET_SCALE),
        duration: 1100,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 850,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#11104A', '#721984']}
      style={styles.background}
    >
      {/* Background clouds */}
      <Animated.View
        style={[
          styles.cloudsContainer,
          {
            top: CLOUDS_TOP,
            left: CLOUDS_LEFT,
            transform: [{ translateX: cloudX1 }]
          },
        ]}
      >
        <Clouds width={CLOUDS_WIDTH} height={CLOUDS_HEIGHT} />
      </Animated.View>

      {/* Second cloud layer */}
      <Animated.View
        style={[
          styles.cloudsContainer,
          {
            top: CLOUDS_TOP,
            left: CLOUDS_LEFT,
            opacity: 0.5,
            transform: [{ translateX: cloudX2 }]
          },
        ]}
      >
        <Clouds width={CLOUDS_WIDTH} height={CLOUDS_HEIGHT} />
      </Animated.View>

      {/* Stars */}
      <Animated.View
        style={[
          styles.starsContainer,
          {
            top: STARS_TOP,
            left: STARS_LEFT,
            opacity: starOpacity
          }
        ]}
      >
        <TinyStars width={STARS_WIDTH} height={STARS_HEIGHT} />
      </Animated.View>

      {/* Welcome page content - fades out as rocket moves up */}
      <Animated.View style={{ opacity: contentOpacity }}>
        <View style={{
          position: 'absolute',
          top: HACKASTRA_TOP,
          left: HACKASTRA_LEFT,
        }}>
          <Hackastra width={HACKASTRA_WIDTH} height={HACKASTRA_HEIGHT} />
        </View>
        <View style={{
          position: 'absolute',
          top: HEADER_TOP,
          left: HEADER_LEFT,
          width: HEADER_WIDTH,
        }}>
          <Text style={[styles.headerText, {
            fontSize: HEADER_FONT_SIZE,
            lineHeight: HEADER_LINE_HEIGHT,
            letterSpacing: HEADER_LETTER_SPACING,
          }]}>WELCOME ABOARD!</Text>
          <Text style={[styles.subtitleText, {
            fontSize: SUBTITLE_FONT_SIZE,
            lineHeight: SUBTITLE_LINE_HEIGHT,
            letterSpacing: SUBTITLE_LETTER_SPACING,
            marginTop: scaleHeight(10),
            width: SUBTITLE_WIDTH,
          }]}>
            Start your journey by exploring the features of our app
          </Text>
        </View>
        <View style={{
          position: 'absolute',
          top: BUTTON_TOP,
          left: BUTTON_LEFT,
          flexDirection: 'column',
          alignItems: 'center',
          gap: height * 0.002,
        }}>
          <StartButton width={BUTTON_WIDTH} height={BUTTON_HEIGHT} />
          <View style={{ paddingVertical: height * 0.01 }}>
            <Text style={[styles.skipButtonText, { fontSize: SKIP_FONT_SIZE }]}>Skip</Text>
          </View>
        </View>
      </Animated.View>

      {/* Rocket */}
      <Animated.View
        style={{
          position: 'absolute',
          top: ROCKET_TOP,
          left: ROCKET_LEFT,
          transform: [{ translateY }, { scale: ROCKET_SCALE }],
        }}
      >
        <HackRocket width={260} height={864.7} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  cloudsContainer: {
    position: 'absolute',
  },
  starsContainer: {
    position: 'absolute',
  },
  headerText: {
    fontFamily: 'Tsukimi-Rounded-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: 'Montserrat',
    fontWeight: '500',
    textAlign: 'center',
    color: '#FFFFFF',
    alignSelf: 'center',
  },
  skipButtonText: {
    fontFamily: 'Tsukimi-Rounded-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
