import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { AxiosResponse } from "axios";
import { SafeAreaView } from "react-native-safe-area-context";


import api from "../api";
import { queryClient } from "../lib/queryClient";
import { fetchProfile, prefetchAvatarImage, setCachedRoles } from "../lib/fetchProfile";
import { prefetchShopImages } from "../lib/fetchShopItems";
import { registerForPushNotificationsAsync } from "../lib/notifications";

WebBrowser.maybeCompleteAuthSession();

interface AuthRolesResponse {
  id: string;
  roles: string[];
}

export default function AuthScreen() {
  type LoginMethod = "github" | "google" | "guest";

  // If trying to login, store in method of logging in: activeMethod
  const [activeMethod, setActiveMethod] = useState<LoginMethod | null>(null);
  const isLoading = activeMethod !== null; 
  const router = useRouter();


  const redirectUri = "hackillinois://auth";

  const signInWithProvider = async (provider: "github" | "google") => {
    if (isLoading) return;
    setActiveMethod(provider);
    try{
      const authUrl = `${api.axiosInstance.defaults.baseURL}/auth/login/${provider}?redirect=${encodeURIComponent(redirectUri)}`;
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
        { preferEphemeralSession: true }
      );
      if(result.type === "cancel" || result.type === "dismiss") {
        Alert.alert("Login canceled or failed");
        return;
      }
      await handleAuthResult(result);
    } catch (err){
      await SecureStore.deleteItemAsync("jwt");
      await SecureStore.deleteItemAsync("userRoles");
      Alert.alert("Login failed", "Please try again.")
    } finally {
      setActiveMethod(null);
    }
  };
  const handleAuthResult = async (result: any) => {
    // console.log("Auth Result:", result);
    if (result.type === "success" && result.url) {
      try {
        const params = new URLSearchParams(result.url.split("?")[1]);
        const token = params.get("token") || params.get("jwt");

        if (!token) throw new Error("No token returned");

        await SecureStore.setItemAsync("jwt", token);
        await SecureStore.deleteItemAsync("isGuest");

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
        setCachedRoles(roles);

        try {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            // console.log("Sending push token to backend:", pushToken);
            await api.post("/notification", { deviceToken: pushToken });
            // console.log("Push token registered successfully");
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
    if(isLoading) return;
    try {
      setActiveMethod("guest");
      await SecureStore.setItemAsync("isGuest", "true");
      await SecureStore.setItemAsync("userRoles", JSON.stringify(["GUEST"]));
      setCachedRoles(["GUEST"]);
      router.replace("/(tabs)/Home");
    } catch (err) {
      console.error(err);
      await SecureStore.deleteItemAsync("isGuest");
      await SecureStore.deleteItemAsync("userRoles");
      Alert.alert("Guest login failed", "Please try again.");
    } finally {
      setActiveMethod(null);
    }
  };

  return (
  <SafeAreaView style={styles.screen}>
    <View style={styles.content}>
      <Text style={styles.title}>
        Welcome to HackIllinois
      </Text>

      <Button
        title="Attendee login with GitHub"
        onPress={() => void signInWithProvider("github")}
        disabled={isLoading}
      />
      <Button
        title="Staff login with Google"
        onPress={() => void signInWithProvider("google")}
        disabled={isLoading}
      />
      <Button
        title="Continue as guest"
        onPress={handleGuestLogin}
        disabled={isLoading}
      />

      <View style={styles.spinnerSlot}>
        {isLoading && <ActivityIndicator accessibilityLabel="Signing in" />}
      </View>
    </View>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: 
    "white" 
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "600", 
    textAlign: "center" 
  },
  spinnerSlot: { 
    minHeight: 24, 
    justifyContent: "center" 
  },
});
