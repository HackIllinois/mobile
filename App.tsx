import "dotenv/config";

import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Button } from "react-native";

import StartupAnimation from "./src/components/hackrocket/StartupAnimation";
import UserQRScannerScreen from "./screens/UserQRScannerScreen";

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Button title="QR Scanner" onPress={() => navigation.navigate("Scanner")} />
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showAnimation) return <StartupAnimation />;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Scanner" component={UserQRScannerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
});
