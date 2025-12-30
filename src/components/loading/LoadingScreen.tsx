import { useEffect, useRef } from "react";
import { StyleSheet, Animated, Easing, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Clouds from "../../../assets/onboarding/loading/clouds.svg";
import TinyStars from "../../../assets/onboarding/loading/tiny stars.svg";
const AstronautImage = require("../../../assets/onboarding/loading/astronaut.png");
const TextImage = require("../../../assets/onboarding/loading/hackillinois text.png");

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const CLOUDS_TOP = SCREEN_HEIGHT * 0.07; 
const CLOUDS_LEFT = -SCREEN_WIDTH * 0.39; 
const STARS_TOP = SCREEN_HEIGHT * 0.04; 
const STARS_LEFT = -SCREEN_WIDTH * 0.12; 
const ASTRONAUT_TOP = SCREEN_HEIGHT * 0.21; 
const TEXT_TOP = SCREEN_HEIGHT * 0.59; 
const LOADING_BAR_TOP = SCREEN_HEIGHT * 0.75; 
const LOADING_BAR_WIDTH = SCREEN_WIDTH * 0.76; 

type LoadingScreenProps = {
  onFinish: () => void;
};

export default function LoadingScreen({ onFinish }: LoadingScreenProps) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const astronautY = useRef(new Animated.Value(0)).current;
  const astronautRotate = useRef(new Animated.Value(0)).current;
  const cloudX1 = useRef(new Animated.Value(0)).current;
  const cloudX2 = useRef(new Animated.Value(0)).current;
  const starOpacity = useRef(new Animated.Value(0.8)).current;
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

    // Cloud animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudX1, {
          toValue: 30,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cloudX1, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudX2, {
          toValue: 40,
          duration: 10000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cloudX2, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Star twinkling animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(starOpacity, {
          toValue: 0.4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(starOpacity, {
          toValue: 0.8,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Loading bar animation 
    Animated.timing(loadingBarWidth, {
      toValue: 1,
      duration: 2500,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start(() => {
      onFinish();
    });
  }, [onFinish]);

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
        <Animated.View
          style={[
            styles.cloudsContainer,
            { transform: [{ translateX: cloudX1 }] },
          ]}
        >
          <Clouds width={669.17} height={720.11} />
        </Animated.View>

        <Animated.View
          style={[
            styles.cloudsContainer,
            { opacity: 0.5, transform: [{ translateX: cloudX2 }] },
          ]}
        >
          <Clouds width={669.17} height={720.11} />
        </Animated.View>

        <Animated.View
          style={[styles.starsContainer, { opacity: starOpacity }]}
        >
          <TinyStars width={499.59} height={614} />
        </Animated.View>

        <Animated.View
          style={[
            styles.astronautContainer,
            {
              transform: [
                { translateY: astronautY },
                { rotate: astronautRotateInterpolate },
              ],
            },
          ]}
        >
          <Image
            source={AstronautImage}
            style={{ width: 270.86, height: 292 }}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Image
            source={TextImage}
            style={{ width: 186, height: 104 }}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={styles.loadingBarContainer}>
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
    alignItems: "center",
    justifyContent: "center",
  },
  cloudsContainer: {
    position: "absolute",
    top: CLOUDS_TOP,
    left: CLOUDS_LEFT,
  },
  starsContainer: {
    position: "absolute",
    top: STARS_TOP,
    left: STARS_LEFT,
  },
  astronautContainer: {
    position: "absolute",
    top: ASTRONAUT_TOP,
    alignSelf: "center",
  },
  textContainer: {
    position: "absolute",
    top: TEXT_TOP,
    alignSelf: "center",
  },
  loadingBarContainer: {
    position: "absolute",
    top: LOADING_BAR_TOP,
    alignSelf: "center",
    width: LOADING_BAR_WIDTH,
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
