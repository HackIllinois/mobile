import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("jwt"); // remove token
    Alert.alert("Logged out", "You have been logged out successfully.");
    router.replace("/AuthScreen"); // go back to login screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Screen</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  text: {
    color: "#fff",
    fontSize: 24,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
});