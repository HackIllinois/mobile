import React, { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { Stack } from "expo-router";
import StartupAnimation from "../src/components/hackrocket/StartupAnimation";

export default function RootLayout() {
  const [showAnimation, setShowAnimation] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Wait a bit, then fade out the startup animation
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800, // fade duration (ms)
        useNativeDriver: true,
      }).start(() => {
        setShowAnimation(false); // hide animation after fade completes
      });
    }, 1800); // display animation for ~1.8s before fading
    return () => clearTimeout(timer);
  }, []);

  if (showAnimation) {
    return (
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
        }}
      >
        <StartupAnimation />
      </Animated.View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
