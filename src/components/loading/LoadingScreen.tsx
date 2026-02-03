import { useEffect, useRef } from "react";
import { StyleSheet, Animated, Easing, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Clouds from "../../../assets/onboarding/loading/clouds.svg";
import TinyStars from "../../../assets/onboarding/loading/tiny stars.svg";
import Astronaut from "../../../assets/onboarding/loading/astronaut.svg";
import HackIllinoisText from "../../../assets/onboarding/loading/hackillinois-text.svg";

type LoadingScreenProps = {
  onFinish: () => void;
  progress: number; // 0 to 1
  cloudX1: Animated.Value;
  cloudX2: Animated.Value;
  starOpacity: Animated.Value;
};

export default function LoadingScreen({ onFinish, progress, cloudX1, cloudX2, starOpacity }: LoadingScreenProps) {
  const { width, height } = useWindowDimensions();

  const figmaWidth = 393;
  const figmaHeight = 852;
  const scaleWidth = (size: number) => (width / figmaWidth) * size;
  const scaleHeight = (size: number) => (height / figmaHeight) * size;

  const CLOUDS_WIDTH = scaleWidth(669.17);
  const CLOUDS_HEIGHT = scaleHeight(720.11);
  const STARS_WIDTH = scaleWidth(499.59);
  const STARS_HEIGHT = scaleHeight(614);
  const ASTRONAUT_WIDTH = scaleWidth(270.8583068847656);
  const ASTRONAUT_HEIGHT = scaleHeight(292);
  const ASTRONAUT_TOP = scaleHeight(171);
  const ASTRONAUT_LEFT = scaleWidth(62.15);
  const LOGO_WIDTH = scaleWidth(186);
  const LOGO_HEIGHT = scaleHeight(104);
  const LOGO_TOP = scaleHeight(476);
  const LOGO_LEFT = scaleWidth(104);
  const LOADING_BAR_WIDTH = width * 0.76;
  const LOADING_BAR_TOP = height * 0.75;

  const fadeIn = useRef(new Animated.Value(0)).current;
  const astronautY = useRef(new Animated.Value(0)).current;
  const astronautRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const loadingBarWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    // Text fade-in
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 500,
      delay: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    // Astronaut Floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(astronautY, {
          toValue: -20,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(astronautY, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Astronaut Rotating
    Animated.loop(
      Animated.sequence([
        Animated.timing(astronautRotate, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(astronautRotate, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(astronautRotate, {
          toValue: -1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(astronautRotate, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Animate loading bar based on progress prop
  useEffect(() => {
    Animated.timing(loadingBarWidth, {
      toValue: progress,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start(() => {
      if (progress >= 1) {
        onFinish();
      }
    });
  }, [progress, onFinish]);

  const astronautRotateInterpolate = astronautRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-3deg", "3deg"],
  });

  const loadingBarWidthInterpolate = loadingBarWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, LOADING_BAR_WIDTH],
  });

  return (
    <Animated.View style={{ flex: 1, opacity: fadeIn }}>
      <LinearGradient
        colors={['#11104A', '#721984']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        {/* Background clouds */}
        <Animated.View
          style={[
            styles.cloudsContainer,
            {
              top: height * 0.07,
              left: -width * 0.39,
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
              top: height * 0.07,
              left: -width * 0.39,
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
              top: height * 0.04,
              left: -width * 0.12,
              opacity: starOpacity
            }
          ]}
        >
          <TinyStars width={STARS_WIDTH} height={STARS_HEIGHT} />
        </Animated.View>

        {/* Astronaut */}
        <Animated.View
          style={{
            position: 'absolute',
            top: ASTRONAUT_TOP,
            left: ASTRONAUT_LEFT,
            width: ASTRONAUT_WIDTH,
            height: ASTRONAUT_HEIGHT,
            transform: [
              { translateY: astronautY },
              { rotate: astronautRotateInterpolate },
            ],
          }}
        >
          <Astronaut width={ASTRONAUT_WIDTH} height={ASTRONAUT_HEIGHT} />
        </Animated.View>

        {/* HackIllinois logo */}
        <Animated.View
          style={{
            position: 'absolute',
            top: LOGO_TOP,
            left: LOGO_LEFT,
            width: LOGO_WIDTH,
            height: LOGO_HEIGHT,
            opacity: textOpacity,
          }}
        >
          <HackIllinoisText width={LOGO_WIDTH} height={LOGO_HEIGHT} />
        </Animated.View>

        {/* Loading bar */}
        <Animated.View style={[styles.loadingBarContainer, {
          top: LOADING_BAR_TOP,
          width: LOADING_BAR_WIDTH,
        }]}>
          <Animated.View
            style={[
              styles.loadingBarFillWrapper,
              { width: loadingBarWidthInterpolate },
            ]}
          >
            <LinearGradient
              colors={['#A315D6', '#FDAB60', '#A315D6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loadingBarFill}
            />
          </Animated.View>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cloudsContainer: {
    position: "absolute",
  },
  starsContainer: {
    position: "absolute",
  },
  loadingBarContainer: {
    position: "absolute",
    alignSelf: "center",
    height: 7,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 20,
    overflow: "hidden",
  },
  loadingBarFillWrapper: {
    height: "100%",
    borderRadius: 20,
    overflow: "hidden",
  },
  loadingBarFill: {
    height: "100%",
    width: "100%",
    borderRadius: 20,
  },
});
