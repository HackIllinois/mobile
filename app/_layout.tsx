import { useEffect, useRef, useState } from "react";
import { Animated, Easing, View, StyleSheet, ImageBackground } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import StartupAnimation from "../components/hackrocket/StartupAnimation";
import OnboardingScreens from "../components/onboarding/OnboardingScreen";
import LoadingScreen from "../src/components/loading/LoadingScreen";
import WelcomePage from "../components/onboarding/WelcomePage";
import * as SecureStore from "expo-secure-store";
import { AnimationProvider, useAnimations } from "../contexts/OnboardingAnimationContext";
import { queryClient } from "../lib/queryClient";
import { fetchEvents } from "../lib/fetchEvents";
import { fetchShopItems, prefetchShopImages } from "../lib/fetchShopItems";
import { fetchProfile, prefetchAvatarImage } from "../lib/fetchProfile";
import { setupNotificationListeners } from "../lib/notifications";
import { checkVersion } from "../lib/versionCheck";
import UpdateRequiredScreen from "../components/UpdateRequiredScreen";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showUpdateRequired, setShowUpdateRequired] = useState(false);
  const [versionGateChecked, setVersionGateChecked] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const welcomeFadeAnim = useRef(new Animated.Value(0)).current;
  const onboardingContentFadeAnim = useRef(new Animated.Value(0)).current;

  // Get shared animations from context
  const { cloudX1, cloudX2, starOpacity } = useAnimations();

  const [fontsLoaded] = useFonts({
    'Tsukimi-Rounded-Bold': require('../assets/fonts/TsukimiRounded-Bold.ttf'),
    'Jedi-Font': require('../assets/fonts/StarJedi-DRGW.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat.ttf'),
    'Montserrat-Bold-700': require('../assets/fonts/Montserrat-Bold-700.ttf'),
  });

  useEffect(() => {
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, []);

  useEffect(() => {
    const loadAppData = async () => {
      const startTime = Date.now();
      let completedTasks = 0;
      const totalTasks = 5; // onboarding, jwt, public data, version check, + 1 for minimum wait

      const markProgress = () => {
        completedTasks++;
        setLoadingProgress(completedTasks / totalTasks);
      };

      try {
        // Task 0: Persisted version gate - if we already know update is required, block immediately
        const versionUpdateRequired = await AsyncStorage.getItem("versionUpdateRequired");
        if (versionUpdateRequired === "true") {
          setShowUpdateRequired(true);
        }
        setVersionGateChecked(true);

        // Task 1: Check onboarding status
        const hasCompleted = TESTING_MODE
          ? false
          : await AsyncStorage.getItem("hasCompletedOnboarding");
        setShowOnboarding(!hasCompleted);
        markProgress();

        // Task 2: Check JWT or guest flag
        const jwt = await SecureStore.getItemAsync("jwt");
        const isGuest = await SecureStore.getItemAsync("isGuest");
        setIsLoggedIn(!!jwt || !!isGuest);
        markProgress();

        // Task 3: Public data + profile if logged in
        const publicDataPromises: Promise<any>[] = [
          queryClient.fetchQuery({
            queryKey: ["events"],
            queryFn: fetchEvents,
          }),
          queryClient.fetchQuery({
            queryKey: ["shopItems"],
            queryFn: fetchShopItems,
          }).then((items) => {
            prefetchShopImages(items);
            return items;
          }),
        ];

        // Pre-fetch profile data if user has a JWT (logged in)
        if (jwt) {
          publicDataPromises.push(
            queryClient.fetchQuery({
              queryKey: ["profile"],
              queryFn: fetchProfile,
            }).then((profile) => {
              prefetchAvatarImage(profile.avatarUrl);
              return profile;
            }).catch(() => {})
          );
        }

        const versionPromise = checkVersion()
        .then((r) => {
          if (r.updateRequired) {
            setShowUpdateRequired(true);
            void AsyncStorage.setItem("versionUpdateRequired", "true");
          } else {
            void AsyncStorage.setItem("versionUpdateRequired", "false");
          }
          return r;
        })
        .catch(() => ({ updateRequired: false }))
        .then(markProgress);

        await Promise.all([...publicDataPromises, versionPromise]);
      } catch (e) {
        console.error("Error during app initialization:", e);
        setShowOnboarding(true);
      }

      // Ensure minimum 0.75s loading time for smooth animation
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 750 - elapsed);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      setLoadingProgress(1);
    };

    loadAppData();
  }, []);

  // Poll for new required version every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      checkVersion().then((r) => {
        if (r.updateRequired) {
          setShowUpdateRequired(true);
          void AsyncStorage.setItem("versionUpdateRequired", "true");
        }
      });
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
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
    // Update UI immediately for instant response
    setShowWelcome(false);
    setShowOnboarding(false);

    // Save to storage in the background
    try {
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");
    } catch (e) {
      console.error("Error saving onboarding status:", e);
    }
  };

  if (!fontsLoaded || showOnboarding === null) {
    return null;
  }

  // Don't show any app UI until we've at least checked persisted version gate
  if (!versionGateChecked) {
    return null;
  }

  // Version gate first
  if (showUpdateRequired) {
    return <UpdateRequiredScreen />;
  }

  if (showLoading) {
    return <LoadingScreen onFinish={handleLoadingFinish} progress={loadingProgress} cloudX1={cloudX1} cloudX2={cloudX2} starOpacity={starOpacity} />;
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
     <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'fade' }}>
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

import { MAX_APP_WIDTH } from "../lib/layout";

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  outerContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_APP_WIDTH,
    overflow: 'hidden',
  },
});

export default function RootLayout() {
  return (
    <ImageBackground 
      source={require("../assets/duels/duels-background.png")} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.outerContainer}>
        <View style={styles.innerContainer}>
          <QueryClientProvider client={queryClient}>
            <AnimationProvider>
              <AnimationInitializer />
              <RootLayoutContent />
            </AnimationProvider>
          </QueryClientProvider>
        </View>
      </View>
    </ImageBackground>
  );
}
