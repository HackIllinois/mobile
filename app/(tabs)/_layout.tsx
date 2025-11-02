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
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
        tabBar={(props) => <CurvedTabBar {...props} />}
      >
        <Tabs.Screen
          name="Home"
          options={{
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
