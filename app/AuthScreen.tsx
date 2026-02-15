import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { AxiosResponse } from "axios";

import LoginBackground from "../assets/login/login-background.svg";
import WelcomeToSvg from "../assets/login/welcome-to.svg";
import HackIllinoisSvg from "../assets/login/hackillinois.svg";
import LoginSvg from "../assets/login/login.svg";
import AttendeeButtonSvg from "../assets/login/attendee-button.svg";
import OrSvg from "../assets/login/-or-.svg";
import StaffButtonSvg from "../assets/login/staff-button.svg";
import GuestButtonSvg from "../assets/login/guest-button.svg";

import api from "../api";
import { queryClient } from "../lib/queryClient";
import { fetchProfile, prefetchAvatarImage } from "../lib/fetchProfile";
import { prefetchShopImages } from "../lib/fetchShopItems";
import { fetchSavedEvents } from "../lib/fetchSavedEvents";

WebBrowser.maybeCompleteAuthSession();

// Figma design dimensions
const FIGMA_WIDTH = 440;
const FIGMA_HEIGHT = 956;

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token: permission not granted");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

interface AuthRolesResponse {
  id: string;
  roles: string[];
}

export default function AuthScreen({ navigation }: any) {
  const { width, height } = useWindowDimensions();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGitHub, setLoadingGitHub] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const router = useRouter();

  const scaleWidth = (size: number) => (width / FIGMA_WIDTH) * size;
  const scaleHeight = (size: number) => (height / FIGMA_HEIGHT) * size;
  const redirectUri = "hackillinois://auth";

  const handleAuthResult = async (result: any) => {
    console.log("Auth Result:", result);
    if (result.type === "success" && result.url) {
      try {
        const params = new URLSearchParams(result.url.split("?")[1]);
        const token = params.get("token") || params.get("jwt");

        if (!token) throw new Error("No token returned");

        await SecureStore.setItemAsync("jwt", token);

        const roleResponse = await api.get<AxiosResponse<AuthRolesResponse>>(
          "/auth/roles/",
          {
            headers: {
              Authorization: token.startsWith("Bearer ")
                ? token
                : `Bearer ${token}`,
            },
          }
        );

        if (!roleResponse.data || !roleResponse.data.roles) {
          throw new Error("Role data not found in response");
        }

        const roles = roleResponse.data.roles;
        await SecureStore.setItemAsync("userRoles", JSON.stringify(roles));

        try {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            await api.post("/notification", { token: pushToken });
            console.log("Push token registered:", pushToken);
          }
        } catch (notifError) {
          console.error("Failed to register push notifications:", notifError);
        }

        // Pre-fetch profile and shop images in background before navigating
        queryClient.fetchQuery({
          queryKey: ["profile"],
          queryFn: fetchProfile,
        }).then((profile) => {
          prefetchAvatarImage(profile.avatarUrl);
        }).catch(() => {});

        const cachedShopItems = queryClient.getQueryData<any[]>(["shopItems"]);
        if (cachedShopItems) {
          prefetchShopImages(cachedShopItems);
        }

        Alert.alert("Login successful!");
        router.replace("/(tabs)/Home");
      } catch (err) {
        throw err;
      }
    } else {
      Alert.alert("Login canceled or failed");
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoadingGuest(true);
      await SecureStore.setItemAsync("isGuest", "true");
      await SecureStore.setItemAsync("userRoles", JSON.stringify(["GUEST"]));
      router.replace("/(tabs)/Home");
    } catch (err) {
      console.error(err);
      await SecureStore.deleteItemAsync("isGuest");
      await SecureStore.deleteItemAsync("userRoles");
      Alert.alert("Guest login failed", "Please try again.");
    } finally {
      setLoadingGuest(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true);

      const authUrl = `${api.axiosInstance.defaults.baseURL}/auth/login/google?redirect=${encodeURIComponent(
        redirectUri
      )}`;

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
        { preferEphemeralSession: true }
      );

      await handleAuthResult(result);
    } catch (err) {
      console.error(err);
      await SecureStore.deleteItemAsync("jwt");
      await SecureStore.deleteItemAsync("userRoles");
      Alert.alert("Login failed", "Please try again.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGitHubLogin = async () => {
    try {
      setLoadingGitHub(true);
      const authUrl = `${api.axiosInstance.defaults.baseURL}/auth/login/github?redirect=${encodeURIComponent(
        redirectUri
      )}`;
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
        { preferEphemeralSession: true }
      );
      await handleAuthResult(result);
    } catch (err) {
      console.error(err);
      await SecureStore.deleteItemAsync("jwt");
      await SecureStore.deleteItemAsync("userRoles");
      Alert.alert("GitHub login failed", "Please try again.");
    } finally {
      setLoadingGitHub(false);
    }
  };

  const isLoading = loadingGoogle || loadingGitHub || loadingGuest;

  return (
    <View style={styles.container}>
      {/* Full-page background */}
      <View style={styles.backgroundContainer}>
        <LoginBackground
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid slice"
        />
      </View>

      {/* Welcome To */}
      <View
        style={{
          position: "absolute",
          top: scaleHeight(188),
          left: scaleWidth(110),
          width: scaleWidth(221),
          height: scaleHeight(34),
        }}
      >
        <WelcomeToSvg
          width={scaleWidth(221)}
          height={scaleHeight(34)}
          preserveAspectRatio="xMidYMid meet"
        />
      </View>

      {/* HackIllinois */}
      <View
        style={{
          position: "absolute",
          top: scaleHeight(241),
          left: scaleWidth(69),
          width: scaleWidth(302),
          height: scaleHeight(129),
        }}
      >
        <HackIllinoisSvg
          width={scaleWidth(302)}
          height={scaleHeight(129)}
          preserveAspectRatio="xMidYMid meet"
        />
      </View>

      {/* Login */}
      <View
        style={{
          position: "absolute",
          top: scaleHeight(588),
          left: scaleWidth(171),
          width: scaleWidth(96),
          height: scaleHeight(34),
        }}
      >
        <LoginSvg
          width={scaleWidth(96)}
          height={scaleHeight(34)}
          preserveAspectRatio="xMidYMid meet"
        />
      </View>

      {/* Attendee Button (GitHub login) */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: scaleHeight(634),
          left: scaleWidth(102),
          width: scaleWidth(236),
          height: scaleHeight(47),
        }}
        onPress={handleGitHubLogin}
        disabled={loadingGoogle || loadingGitHub || loadingGuest}
        activeOpacity={0.7}
      >
        {loadingGitHub ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <AttendeeButtonSvg
            width={scaleWidth(236)}
            height={scaleHeight(47)}
            preserveAspectRatio="xMidYMid meet"
          />
        )}
      </TouchableOpacity>

      {/* -OR- divider */}
      <View
        style={{
          position: "absolute",
          top: scaleHeight(693),
          left: scaleWidth(197),
          width: scaleWidth(45),
          height: scaleHeight(15),
        }}
      >
        <OrSvg
          width={scaleWidth(45)}
          height={scaleHeight(15)}
          preserveAspectRatio="xMidYMid meet"
        />
      </View>

      {/* Staff button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: scaleHeight(720),
          left: scaleWidth(114),
          width: scaleWidth(212),
          height: scaleHeight(45),
        }}
        onPress={handleGoogleLogin}
        disabled={loadingGoogle || loadingGitHub || loadingGuest}
        activeOpacity={0.7}
      >
        {loadingGoogle ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <StaffButtonSvg
            width={scaleWidth(212)}
            height={scaleHeight(45)}
            preserveAspectRatio="xMidYMid meet"
          />
        )}
      </TouchableOpacity>

      {/* Guest Button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: scaleHeight(780),
          left: scaleWidth(115),
          width: scaleWidth(209),
          height: scaleHeight(45),
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={handleGuestLogin}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <GuestButtonSvg
          width={scaleWidth(209)}
          height={scaleHeight(42)}
          preserveAspectRatio="xMidYMid meet"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
