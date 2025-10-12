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

import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import api from "./api";


export default function AuthScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      // 1️⃣ Redirect URI (must be whitelisted on backend)
    //   const redirectUri = AuthSession.makeRedirectUri({
    //     scheme: "hackillinois",
    //     path: "auth",
    //   });

        const redirectUri = AuthSession.makeRedirectUri({ useProxy: true } as any);


        console.log("Generated redirect URI:", redirectUri);
        console.log("Default return URL:", AuthSession.getDefaultReturnUrl());

      const authorizationEndpoint = `https://adonix.hackillinois.org/auth/login/google?redirect=${encodeURIComponent(
        redirectUri
      )}`;

      const authRequest = new AuthSession.AuthRequest({
        clientId: "dummy", 
        redirectUri,
        responseType: AuthSession.ResponseType.Token,
      });

      const discovery: AuthSession.AuthDiscoveryDocument = {
        authorizationEndpoint,
      };

      const result = await authRequest.promptAsync(
        { authorizationEndpoint },
        { redirectUri } as any
        );

      if (result.type !== "success") {
        Alert.alert("Login canceled");
        return;
      }

      const { token } = await api.get<{ token: string }>("/auth/token");
      await SecureStore.setItemAsync("jwt", token);

      Alert.alert("Login successful!");
      navigation.replace("Main");
    } catch (error) {
      console.error(error);
      Alert.alert("Login failed", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0a0a0a", "#1b1b1b", "#0a0a0a"]}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require("./assets/Hack-Logo-png.png")} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>HACK{"\n"}ILLINOIS</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 120,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 24,
    tintColor: "#f5f5f5",
  },
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
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
