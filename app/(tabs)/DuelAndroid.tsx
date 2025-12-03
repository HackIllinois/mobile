import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { requireNativeModule } from "expo-modules-core";

// 1. Match the name defined in the Kotlin ModuleDefinition
const BleP2P = requireNativeModule("LocalConnection");

export default function DuelScreen() {
  /** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} */
  const [role, setRole] = useState(null); // 'remote' (Client) | 'counter' (Server)
  const [count, setCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("Idle");
  const [peerId, setPeerId] = useState(null);

  // 2. Logic: Initialize specific Native roles based on UI selection
  useEffect(() => {
    if (!role) return;

    const setupConnection = async () => {
      try {
        if (role === "counter") {
          setConnectionStatus("Advertising...");
          // PERIPHERAL ROLE: Starts GATT Server & Advertising [cite: 86]
          await BleP2P.startAdvertising("DuelCounter"); 
        } else if (role === "remote") {
          setConnectionStatus("Scanning...");
          // CENTRAL ROLE: Starts Scanning for the specific UUID [cite: 88, 137]
          await BleP2P.startScanning();
        }
      } catch (e) {
        Alert.alert("Error", "Bluetooth permission or hardware error");
        console.error(e);
      }
    };

    setupConnection();

    // 3. Listen to the specific events defined in Kotlin [cite: 186]
    const msgSubscription = BleP2P.addListener("onMessageReceived", (event) => {
      // Event payload: { sender: string, data: string }
      if (event.data === "INCREMENT") {
        setCount((c) => c + 1);
      }
    });

    const connectSubscription = BleP2P.addListener("onDeviceConnected", (event) => {
      setConnectionStatus("Connected");
      setPeerId(event.deviceId);
    });

    const scanSubscription = BleP2P.addListener("onScanResult", (event) => {
        // Optional: Update UI when a device is found during scanning
        if (connectionStatus !== "Connected") {
            setConnectionStatus(`Found ${event.name || 'Device'}...`);
        }
    });

    // Cleanup
    return () => {
      msgSubscription.remove();
      connectSubscription.remove();
      scanSubscription.remove();
      // Ideally, add a BleP2P.stop() method in native code to clean up
    };
  }, [role]);

  const sendIncrement = async () => {
    if (connectionStatus !== "Connected") {
        Alert.alert("Wait", "Not connected to Counter yet.");
        return;
    }
    // Match the AsyncFunction name in Kotlin
    await BleP2P.sendMessage("INCREMENT");
  };

  // --- RENDER HELPERS (Unchanged structure, updated logic display) ---

  if (!role) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Select Mode</Text>
          <TouchableOpacity
            style={[styles.button, styles.remoteButton]}
            onPress={() => setRole("remote")}
          >
            <Text style={styles.buttonText}>Remote (Client)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.counterButton]}
            onPress={() => setRole("counter")}
          >
            <Text style={styles.buttonText}>Display (Host)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Remote Interface
  if (role === "remote") {
    return (
      <SafeAreaView style={[styles.container, styles.remoteBg]}>
        <View style={styles.header}>
          <Text style={styles.headerText}>REMOTE</Text>
          <Text style={styles.subText}>
            {connectionStatus} {peerId ? `(${peerId.slice(-4)})` : ""}
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

        <TouchableOpacity onPress={() => setRole(null)} style={styles.backButton}>
          <Text style={styles.backText}>Disconnect</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Counter Interface
  if (role === "counter") {
    return (
      <SafeAreaView style={[styles.container, styles.counterBg]}>
        <View style={styles.header}>
          <Text style={styles.headerText}>COUNTER</Text>
          <Text style={styles.subText}>
             {connectionStatus} {peerId ? `(${peerId.slice(-4)})` : ""}
          </Text>
        </View>

        <View style={styles.centered}>
          <Text style={styles.countText}>{count}</Text>
        </View>

        <TouchableOpacity onPress={() => setRole(null)} style={styles.backButton}>
           <Text style={styles.backText}>Disconnect</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return <View />;
}

// ... styles remain exactly the same ...
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