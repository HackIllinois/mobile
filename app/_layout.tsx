import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import StartupAnimation from "../components/hackrocket/StartupAnimation";
import OnboardingScreens from "../components/onboarding/OnboardingScreen";
import LoadingScreen from "../src/components/loading/LoadingScreen";
import WelcomePage from "../components/onboarding/WelcomePage";
import * as SecureStore from "expo-secure-store";
import { AnimationProvider, useAnimations } from "../contexts/OnboardingAnimationContext";

// Onboarding testing:
// true = show onboarding every reload
// false = normal behavior
const TESTING_MODE = false;

function RootLayoutContent() {
  const [showLoading, setShowLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const welcomeFadeAnim = useRef(new Animated.Value(0)).current;
  const onboardingContentFadeAnim = useRef(new Animated.Value(0)).current;

  // Get shared animations from context
  const { cloudX1, cloudX2, starOpacity } = useAnimations();

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
    return <LoadingScreen onFinish={handleLoadingFinish} cloudX1={cloudX1} cloudX2={cloudX2} starOpacity={starOpacity} />;
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
            <OnboardingScreens onFinish={handleOnboardingFinish} cloudX1={cloudX1} cloudX2={cloudX2} starOpacity={starOpacity} />
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
            <WelcomePage onFinish={handleOnboardingFinish} onStart={handleWelcomeStart} cloudX1={cloudX1} cloudX2={cloudX2} starOpacity={starOpacity} />
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
            <StartupAnimation cloudX1={cloudX1} cloudX2={cloudX2} starOpacity={starOpacity} />
          </Animated.View>
        )}
      </>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreens onFinish={handleOnboardingFinish} cloudX1={cloudX1} cloudX2={cloudX2} starOpacity={starOpacity} />;
  }

  return (
     <Stack screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="AuthScreen" />
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  );
}

// Component to initialize cloud animations once at app start
// Animations run continuously in loops and never stop
function AnimationInitializer() {
  const { cloudX1, cloudX2, starOpacity } = useAnimations();

  useEffect(() => {
    // Start cloud 1 animation - loops forever
    const cloud1Animation = Animated.loop(
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
    );
    cloud1Animation.start();

    // Start cloud 2 animation - loops forever
    const cloud2Animation = Animated.loop(
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
    );
    cloud2Animation.start();

    // Start star opacity animation - loops forever
    const starAnimation = Animated.loop(
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
    );
    starAnimation.start();

    // Cleanup function to stop animations if component unmounts (won't happen in practice)
    return () => {
      cloud1Animation.stop();
      cloud2Animation.stop();
      starAnimation.stop();
    };
  }, []); // Empty dependency array - run once on mount and animations continue forever

  return null;
}

export default function RootLayout() {
  return (
    <AnimationProvider>
      <AnimationInitializer />
      <RootLayoutContent />
    </AnimationProvider>
  );
}
