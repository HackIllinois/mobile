import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { AxiosResponse } from "axios";
import LoginBackground from "../assets/login-background.svg";

import api from "../api";

WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token: permission not granted");
    return null;
  }

  // Get the push token
  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // Configure Android channel
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

// SVG viewBox dimensions
const SVG_WIDTH = 440;
const SVG_HEIGHT = 956;

// Attendee button position in SVG coordinates
const ATTENDEE_BTN = { x: 103, y: 605, width: 236, height: 47 };

interface AuthRolesResponse {
  id: string;
  roles: string[];
}

export default function AuthScreen({ navigation }: any) {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGitHub, setLoadingGitHub] = useState(false);
  const router = useRouter();

  const redirectUri = "hackillinois://auth";

  const handleAuthResult = async (result: any) => {
    console.log("Auth Result:", result);
    if (result.type === "success" && result.url) {
      try {
      const params = new URLSearchParams(result.url.split("?")[1]);
      const token = params.get("token") || params.get("jwt");

      if (!token) throw new Error("No token returned");

      await SecureStore.setItemAsync("jwt", token);

      // Caching User Roles
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

      // Request notification permissions and register push token
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          await api.post("/notification", { token: pushToken });
          console.log("Push token registered:", pushToken);
        }
      } catch (notifError) {
        // Don't block login if notification registration fails
        console.error("Failed to register push notifications:", notifError);
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

  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true);

      const authUrl = `${api.axiosInstance.defaults.baseURL}/auth/login/google?redirect=${encodeURIComponent(
        redirectUri
      )}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
        preferEphemeralSession: true,
      });

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
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
        preferEphemeralSession: true,
      });
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

  // Convert SVG coordinates to screen coordinates, accounting for
  // preserveAspectRatio="xMidYMid slice" which scales uniformly to cover
  // the entire screen and then centers/crops the overflow axis.
  const screenRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
  const svgRatio = SVG_WIDTH / SVG_HEIGHT;

  // "slice" picks the larger scale so the SVG fully covers the screen
  const scale =
    screenRatio > svgRatio
      ? SCREEN_WIDTH / SVG_WIDTH   // screen is wider → scale to width
      : SCREEN_HEIGHT / SVG_HEIGHT; // screen is taller → scale to height

  // Offset caused by centering the oversized axis
  const offsetX = (SCREEN_WIDTH - SVG_WIDTH * scale) / 2;
  const offsetY = (SCREEN_HEIGHT - SVG_HEIGHT * scale) / 2;

  const attendeeBtnStyle = {
    position: "absolute" as const,
    left: ATTENDEE_BTN.x * scale + offsetX,
    top: ATTENDEE_BTN.y * scale + offsetY,
    width: ATTENDEE_BTN.width * scale,
    height: ATTENDEE_BTN.height * scale,
    borderRadius: 23.5 * scale,
  };

  return (
    <View style={styles.container}>
      <View style={styles.svgContainer}>
        <LoginBackground
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          preserveAspectRatio="xMidYMid slice"
        />
      </View>

      {/* Attendee button overlay (GitHub login) */}
      <TouchableOpacity
        style={[styles.overlayButton, attendeeBtnStyle]}
        onPress={handleGitHubLogin}
        disabled={loadingGoogle || loadingGitHub}
        activeOpacity={0.7}
      >
        {loadingGitHub && <ActivityIndicator color="#fff" />}
      </TouchableOpacity>

      {/* Staff button below attendee */}
      <TouchableOpacity
        style={[
          styles.staffButton,
          {
            position: "absolute",
            top: (ATTENDEE_BTN.y + ATTENDEE_BTN.height) * scale + offsetY + 20,
            alignSelf: "center",
          },
        ]}
        onPress={handleGoogleLogin}
        disabled={loadingGoogle || loadingGitHub}
        activeOpacity={0.7}
      >
        {loadingGoogle ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.staffText}>Staff</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  svgContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlayButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  staffButton: {
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: 12,
  },
  staffText: {
    fontFamily: "Tsukimi-Rounded-Bold",
    fontSize: 18,
    color: "#FFFFFF",
  },
});
