import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import StartupAnimation from "../components/hackrocket/StartupAnimation";
import OnboardingScreens from "../components/onboarding/OnboardingScreen";
import * as SecureStore from "expo-secure-store";
import { useFonts } from 'expo-font';

export default function RootLayout() {
  const [showAnimation, setShowAnimation] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [fontsLoaded] = useFonts({
    'Tsukimi Rounded': require('../assets/fonts/Tsukimi_Rounded/TsukimiRounded-Bold.ttf'),
    'Montserrat': require('../assets/fonts/Montserrat/Montserrat-Italic-VariableFont_wght.ttf'),
  });

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasCompleted = await AsyncStorage.getItem("hasCompletedOnboarding");
        const jwt = await SecureStore.getItemAsync("jwt");
        setIsLoggedIn(!!jwt);
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

  if (!fontsLoaded) {
    return null; // maybe change to loading screen?
  }

  if (showOnboarding) {
    return <OnboardingScreens onFinish={handleOnboardingFinish} />;
  }
  console.log("showOnboarding:", showOnboarding, "isLoggedIn:", isLoggedIn);
  return (
     <Stack screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="AuthScreen" />
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
      <Stack.Screen
        name="Profile"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}