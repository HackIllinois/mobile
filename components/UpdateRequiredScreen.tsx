import React, { useEffect } from "react";
import {
  Alert,
  Button,
  StyleSheet,
  View,
  Text,
  Linking,
  Platform,
  BackHandler,
} from "react-native";
import { getStoreUrl } from "../lib/versionCheck";


export default function UpdateRequiredScreen() {
  const storeName = Platform.OS === "android" ? "Google Play" : "App Store";

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  const openStore = async () => {
    try {
      await Linking.openURL(getStoreUrl());
    } catch {
      Alert.alert(`Couldn't open ${storeName}`, "Please try again.");
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title} accessibilityRole="header">
        Update required
      </Text>
      <Text style={styles.message}>Please update the app to continue.</Text>
      <Button title={`Open ${storeName}`} onPress={() => void openStore()} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24, 
    fontWeight: "600", 
    textAlign: "center"
  },
  message: { 
    textAlign: "center"
  },
});