import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { makeRedirectUri } from "expo-auth-session";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";

import api from "../lib/api";

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen({ navigation }: any) {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGitHub, setLoadingGitHub] = useState(false);
  const router = useRouter();

  const redirectUri = "hackillinois://auth";

  const handleAuthResult = async (result: any) => {
    console.log("Auth Result:", result);
    if (result.type === "success" && result.url) {
      const params = new URLSearchParams(result.url.split("?")[1]);
      const token = params.get("token") || params.get("jwt");

      if (!token) throw new Error("No token returned");

      await SecureStore.setItemAsync("jwt", token);
      Alert.alert("Login successful!");
      router.replace("/(tabs)/Home");
    } else {
      Alert.alert("Login canceled or failed");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true);

      console.log("Redirect URI:", redirectUri);

      const authUrl = `${
        api.axiosInstance.defaults.baseURL
      }/auth/login/google?redirect=${encodeURIComponent(redirectUri)}`;
      console.log("Auth URL:", authUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );
      console.log("Auth Result:", result);

      await handleAuthResult(result);
    } catch (err) {
      console.error(err);
      Alert.alert("Login failed", "Please try again.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGitHubLogin = async () => {
    try {
      setLoadingGitHub(true);
      const authUrl = `${
        api.axiosInstance.defaults.baseURL
      }/auth/login/github?redirect=${encodeURIComponent(redirectUri)}`;
      console.log("GitHub Auth URL:", authUrl);
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );
      await handleAuthResult(result);
    } catch (err) {
      console.error(err);
      Alert.alert("GitHub login failed", "Please try again.");
    } finally {
      setLoadingGitHub(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0a0a0a", "#1b1b1b", "#0a0a0a"]}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/Hack-Logo-png.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>HACK{"\n"}ILLINOIS</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleGoogleLogin}
        disabled={loadingGoogle || loadingGitHub}
      >
        {loadingGoogle ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 20 }} />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#24292e" }]}
        onPress={handleGitHubLogin}
        disabled={loadingGoogle || loadingGitHub}
      >
        {loadingGitHub ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with GitHub</Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  logoContainer: { alignItems: "center", marginBottom: 120 },
  logo: { width: 140, height: 140, marginBottom: 24, tintColor: "#f5f5f5" },
  title: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "900",
    color: "#f5f5f5",
    letterSpacing: 1.2,
  },
  button: {
    backgroundColor: "#4285F4",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
});
