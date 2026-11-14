import React, { useEffect } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  Linking,
  Platform,
  BackHandler,
} from "react-native";
import { getStoreUrl } from "../lib/versionCheck";
import { SafeAreaView } from "react-native-safe-area-context";
import { layoutStyles } from "../lib/layout";


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
    <SafeAreaView style={[layoutStyles.fill, styles.screen]}>
      <ScrollView contentContainerStyle={[layoutStyles.column, styles.content]}>
        <Text style={styles.title} accessibilityRole="header">
          Update required
        </Text>
        <Text style={styles.message}>Please update the app to continue.</Text>
        <Button title={`Open ${storeName}`} onPress={() => void openStore()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "white",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 24,
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
