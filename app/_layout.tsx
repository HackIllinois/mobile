import { useEffect, useRef, useState } from "react";
import { Animated, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import StartupAnimation from "../src/components/hackrocket/StartupAnimation";
import OnboardingScreens from "../src/components/onboarding/OnboardingScreen";
import {
  getAndSendExpoPushToken,
  setupNotificationListeners,
} from "../lib/notifications";
import * as SecureStore from "expo-secure-store";

export default function RootLayout() {
  const [showAnimation, setShowAnimation] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // check if we have onboarded yet
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasCompleted = await AsyncStorage.getItem(
          "hasCompletedOnboarding"
        );
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

  // load animation
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

  // notification listeners
  // by returning the cleanup function, that function will run when app unmounts/rerenders
  // saves us from duplicate listeners and mem leaks
  useEffect(() => {
    const cleanup = setupNotificationListeners(
      (notification: Notifications.Notification) => {
        console.log("notification received in foreground:", notification);
      },
      (response: Notifications.NotificationResponse) => {
        console.log("user interacted with notification:", response);
        const data = response.notification.request.content.data;
        // TODO: add notification interaction logic
      }
    );
    return cleanup;
  }, []);

  // sends the expo push token to axonix IF:
  // 1) we have notifications permissions
  // 2) we haven't already sent token
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (nextAppState === "active") {
          const { status } = await Notifications.getPermissionsAsync();
          const hasRegisteredToken = await AsyncStorage.getItem(
            "hasRegisteredPushToken"
          );
          if (status === "granted" && !hasRegisteredToken) {
            const token = await getAndSendExpoPushToken();
            if (token) {
              await AsyncStorage.setItem("hasRegisteredPushToken", "true");
              console.log("Push token registered after permission change");
            }
          }
        }
      }
    );

    return () => subscription.remove();
  }, []);

  const handleOnboardingFinish = async () => {
    try {
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");
      await getAndSendExpoPushToken();
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
  console.log("showOnboarding:", showOnboarding, "isLoggedIn:", isLoggedIn);
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
