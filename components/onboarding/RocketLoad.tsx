import { useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import HackRocket from "../../assets/onboarding/hack-rocket.svg";
import Clouds from "../../assets/onboarding/loading/clouds.svg";
import TinyStars from "../../assets/onboarding/loading/tiny stars.svg";

type RocketLoadProps = {
    onFinish: () => void;
}

const AnimatedHackRocket = Animated.createAnimatedComponent(HackRocket);

export default function RocketLoad({onFinish}: RocketLoadProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const cloudX1 = useRef(new Animated.Value(0)).current;
  const cloudX2 = useRef(new Animated.Value(0)).current;
  const starOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Native-driven shake animation
    const shake = Animated.loop(
        Animated.sequence([
        Animated.timing(rotate, { toValue: 0.25, duration: 50, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -0.25, duration: 50, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 50, useNativeDriver: true }),
        ])
    );

    shake.start(); 

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

    // Fly up animation
    Animated.timing(translateY, {
        toValue: -800,
        duration: 1300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
    }).start(() => {
        shake.stop();
        onFinish();
    });
  }, []);


  const rotateInterpolate = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  return (
    <LinearGradient
      colors={['#11104A', '#721984']}
      style={styles.background}
    >
      {/* Background clouds */}
      <Animated.View
        style={[
          styles.cloudsContainer,
          { transform: [{ translateX: cloudX1 }] },
        ]}
      >
        <Clouds width={669.17} height={720.11} />
      </Animated.View>

      {/* Second cloud layer */}
      <Animated.View
        style={[
          styles.cloudsContainer,
          { opacity: 0.5, transform: [{ translateX: cloudX2 }] },
        ]}
      >
        <Clouds width={669.17} height={720.11} />
      </Animated.View>

      {/* Stars */}
      <Animated.View
        style={[styles.starsContainer, { opacity: starOpacity }]}
      >
        <TinyStars width={499.59} height={614} />
      </Animated.View>

      {/* Rocket */}
      <View style={styles.rocketContainer}>
        <AnimatedHackRocket
          width={600}
          height={600}
          style={{
            transform: [{ translateY }, { rotate: rotateInterpolate }],
          }}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cloudsContainer: {
    position: "absolute",
    top: 60,
    left: -154,
  },
  starsContainer: {
    position: "absolute",
    top: 30,
    left: -46.51,
  },
  rocketContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});