import { Tabs } from "expo-router";
import { Image } from "react-native";
import { CurvedTabBar } from "../../components/CurvedTabBar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a single QueryClient instance
const queryClient = new QueryClient();

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Tabs
        initialRouteName="Duel"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: { display: "none" }, // Hide tab bar
        }}
      >
        <Tabs.Screen
          name="Duel"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require("../../assets/qr.png")}
                style={{ width: size, height: size, tintColor: color }}
              />
            ),
          }}
        />
        {/* Other screens hidden for testing */}
        <Tabs.Screen
          name="Home"
          options={{
            href: null, // Hide from tabs
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require("../../assets/house.png")}
                style={{ width: size, height: size, tintColor: color }}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="Shop"
          options={{
            href: null, // Hide from tabs
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require("../../assets/cart.png")}
                style={{ width: size, height: size, tintColor: color }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Scan"
          options={{
            href: null, // Hide from tabs
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require("../../assets/qr.png")}
                style={{ width: size, height: size, tintColor: color }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Event"
          options={{
            href: null, // Hide from tabs
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require("../../assets/calendar.png")}
                style={{ width: size, height: size, tintColor: color }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Profile"
          options={{
            href: null, // Hide from tabs
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require("../../assets/profile.png")}
                style={{ width: size, height: size, tintColor: color }}
              />
            ),
          }}
        />
      </Tabs>
    </QueryClientProvider>
  );
}
