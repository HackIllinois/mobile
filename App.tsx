import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import StartupAnimation from "./src/components/hackrocket/StartupAnimation";
import { StyleSheet, Text, View, Button } from "react-native";
import QRScannerScreen from "./screens/QRScannerScreen";
import PointShop from "./screens/PointShop";

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.container}>
      <Button
        title="QR Scanner"
        onPress={() => navigation.navigate("Scanner")}
      />
      <Button
        title="Point Shop"
        onPress={() => navigation.navigate("Point Shop")}
      />
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

  if (showAnimation) {
    return <StartupAnimation />;
  }
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Point Shop" component={PointShop} />
        <Stack.Screen name="Scanner" component={QRScannerScreen} />
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
  },
});
