import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
// FIXED: Use SafeAreaView from safe-area-context as the built-in one is deprecated
import { SafeAreaView } from "react-native-safe-area-context";
import { requireNativeModule } from "expo-modules-core";

// 1. Access the native module defined in your Swift code
// FIXED: In Expo SDK 52+, this object is already an EventEmitter.
// No need for 'new EventEmitter(LocalConnection)'
const LocalConnection = requireNativeModule("LocalConnection");

export default function DuelScreen() {
  // State for the application logic
  // FIXED: Added JSDoc type hint to prevent TS error about assigning string to null
  /** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} */
  const [role, setRole] = useState(null); // 'remote' | 'counter' | null
  const [count, setCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("Searching...");
  const [peerName, setPeerName] = useState(null);

  useEffect(() => {
    // 2. Start the browsing/advertising session when component mounts
    LocalConnection.startSession();

    // 3. Set up Event Listeners
    // FIXED: Call addListener directly on the module object
    const subscription = LocalConnection.addListener("onChange", (event) => {
      console.log("Received event:", event);

      switch (event.type) {
        case "connected":
          setConnectionStatus("Connected");
          setPeerName(event.peer);
          break;

        case "disconnected":
          setConnectionStatus("Disconnected");
          setPeerName(null);
          break;

        case "data":
          // If we receive data and we are the 'counter', increment
          if (event.data === "INCREMENT") {
            setCount((prevCount) => prevCount + 1);
          }
          break;
      }
    });

    // 4. Cleanup on unmount
    return () => {
      subscription.remove();
      LocalConnection.stopSession();
    };
  }, []);

  // Helper to send the increment signal
  const sendIncrement = () => {
    // Call the async function exposed in your Swift definition
    LocalConnection.sendData("INCREMENT");
  };

  // --- RENDER HELPERS ---

  // 1. Role Selection Screen (First thing user sees)
  if (!role) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Select Mode</Text>
          <Text style={styles.status}>
            Status: {connectionStatus} {peerName ? `with ${peerName}` : ""}
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.remoteButton]}
            onPress={() => setRole("remote")}
          >
            <Text style={styles.buttonText}>Remote (Button)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.counterButton]}
            onPress={() => setRole("counter")}
          >
            <Text style={styles.buttonText}>Display (Counter)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Remote Control Interface
  if (role === "remote") {
    return (
      <SafeAreaView style={[styles.container, styles.remoteBg]}>
        <View style={styles.header}>
          <Text style={styles.headerText}>REMOTE</Text>
          <Text style={styles.subText}>
            {connectionStatus} {peerName}
          </Text>
        </View>

        <View style={styles.centered}>
          <TouchableOpacity
            style={styles.fireButton}
            onPress={sendIncrement}
            activeOpacity={0.7}
          >
            <Text style={styles.fireButtonText}>TAP</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setRole(null)}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Change Role</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 3. Counter Display Interface
  if (role === "counter") {
    return (
      <SafeAreaView style={[styles.container, styles.counterBg]}>
        <View style={styles.header}>
          <Text style={styles.headerText}>COUNTER</Text>
          <Text style={styles.subText}>
            {connectionStatus} {peerName}
          </Text>
        </View>

        <View style={styles.centered}>
          <Text style={styles.countText}>{count}</Text>
        </View>

        <TouchableOpacity
          onPress={() => setRole(null)}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Change Role</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return <View />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  status: {
    fontSize: 14,
    color: "#666",
    marginBottom: 40,
  },
  button: {
    width: "100%",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
  },
  remoteButton: {
    backgroundColor: "#4A90E2",
  },
  counterButton: {
    backgroundColor: "#50E3C2",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  // Remote Specific Styles
  remoteBg: {
    backgroundColor: "#2c3e50",
  },
  fireButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 4,
    borderColor: "#c0392b",
  },
  fireButtonText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
  },
  // Counter Specific Styles
  counterBg: {
    backgroundColor: "#ecf0f1",
  },
  countText: {
    fontSize: 120,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  // Shared
  header: {
    paddingTop: 20,
    alignItems: "center",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#7f8c8d",
    letterSpacing: 2,
  },
  subText: {
    fontSize: 12,
    color: "#95a5a6",
    marginTop: 4,
  },
  backButton: {
    padding: 20,
    alignItems: "center",
  },
  backText: {
    color: "#7f8c8d",
  },
});
