import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import StartupAnimation from "../src/components/hackrocket/StartupAnimation";
import OnboardingScreens from "../src/components/onboarding/OnboardingScreen";
import LoadingScreen from "../src/components/loading/LoadingScreen";
import WelcomePage from "../src/components/onboarding/WelcomePage";
import * as SecureStore from "expo-secure-store";

// Onboarding testing: 
// true = show onboarding every reload
// false = normal behavior
const TESTING_MODE = false;

export default function RootLayout() {
  const [showLoading, setShowLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const welcomeFadeAnim = useRef(new Animated.Value(0)).current;
  const onboardingContentFadeAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    'Tsukimi-Rounded-Bold': require('../assets/fonts/TsukimiRounded-Bold.ttf'),
  });

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasCompleted = TESTING_MODE
          ? false
          : await AsyncStorage.getItem("hasCompletedOnboarding");
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

  const handleLoadingFinish = () => {
    setShowLoading(false);
    if (showOnboarding) {
      setShowWelcome(true);
    }
  };

  useEffect(() => {
    if (showWelcome) {
      Animated.timing(welcomeFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [showWelcome]);

  const handleWelcomeStart = () => {
    setShowAnimation(true);
    // Fade out welcome page as rocket goes up
    Animated.timing(welcomeFadeAnim, {
      toValue: 0,
      duration: 1500, 
      useNativeDriver: true,
    }).start(() => {
      setShowWelcome(false);
    });
  };

  useEffect(() => {
    if (showAnimation) {
      fadeAnim.setValue(1);

      // Show onboarding content immediately when animation starts
      onboardingContentFadeAnim.setValue(1);

      // Fade out animation to reveal onboarding content 
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
    }
  }, [showAnimation]);

  const handleOnboardingFinish = async () => {
    try {
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");
      setShowOnboarding(false);
    } catch (e) {
      console.error("Error saving onboarding status:", e);
    }
  };

  if (!fontsLoaded || showOnboarding === null) {
    return null;
  }

  if (showLoading) {
    return <LoadingScreen onFinish={handleLoadingFinish} />;
  }

  if (showWelcome || showAnimation) {
    return (
      <>
        {showAnimation && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: onboardingContentFadeAnim,
            }}
          >
            <OnboardingScreens onFinish={handleOnboardingFinish} />
          </Animated.View>
        )}
        {/* Welcome page layer */}
        {showWelcome && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: welcomeFadeAnim,
            }}
          >
            <WelcomePage onFinish={handleOnboardingFinish} onStart={handleWelcomeStart} />
          </Animated.View>
        )}
        {/* Animation layer on top */}
        {showAnimation && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: fadeAnim,
            }}
          >
            <StartupAnimation />
          </Animated.View>
        )}
      </>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreens onFinish={handleOnboardingFinish} />;
  }

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