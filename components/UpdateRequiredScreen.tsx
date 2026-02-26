import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  BackHandler,
  useWindowDimensions
} from "react-native";
import { MAX_APP_WIDTH } from "../lib/layout";
import { getStoreUrl } from "../lib/versionCheck";
import BackgroundSvg from '../assets/profile/background.svg';


export default function UpdateRequiredScreen() {
  const { width: windowWidth, height } = useWindowDimensions();
  const width = Math.min(windowWidth, MAX_APP_WIDTH);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  const openStore = () => {
    Linking.openURL(getStoreUrl()).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <BackgroundSvg
        width={width}
        height={height + 10} // Added 10px to the height to avoid some weird clipping
        preserveAspectRatio="xMidYMid slice"
        style={styles.background}
      />
      <View style={styles.content}>
        <Text style={styles.title}>A New Version is Available!</Text>
        <Text style={styles.subtitle}>
          Please update the app to continue.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={openStore}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {Platform.OS === "ios" ? "Open App Store" : "Open Google Play"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: "Tsukimi-Rounded-Bold",
    fontSize: 26,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Montserrat-Bold",
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "Montserrat-Bold",
    fontSize: 16,
    color: "#11104A",
  },
});
