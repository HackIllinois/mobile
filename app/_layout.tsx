import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import StartupAnimation from "../src/components/hackrocket/StartupAnimation";
import OnboardingScreens from "../src/components/onboarding/OnboardingScreen";
// Simulate Login
import * as SecureStore from 'expo-secure-store';

/**
 * Global developer hook to auto-login with a mock JWT.
 */
function SimulateLogin() {
  useEffect(() => {
    if (__DEV__) {
      const mockToken = process.env.EXPO_PUBLIC_MOCK_JWT;
      if (mockToken) {
        SecureStore.getItemAsync("jwt").then(existingToken => {
          if (!existingToken) {
            SecureStore.setItemAsync("jwt", mockToken);
            console.log("DEV: Mock JWT saved to SecureStore!");
          }
        });
      }
    }
  }, []);
}


export default function RootLayout() {
  const [showAnimation, setShowAnimation] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  SimulateLogin();
  
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasCompleted = await AsyncStorage.getItem("hasCompletedOnboarding");
        setShowOnboarding(!hasCompleted);
      } catch (e) {
        console.error("Error checking onboarding status:", e);
        setShowOnboarding(true);
      }
    };
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setShowAnimation(false);
      });
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleOnboardingFinish = async () => {
    try {
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");
      setShowOnboarding(false);
    } catch (e) {
      console.error("Error saving onboarding status:", e);
    }
  };

  if (showOnboarding === null) return null;

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

  if (showOnboarding) {
    return <OnboardingScreens onFinish={handleOnboardingFinish} />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}