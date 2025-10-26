import { Tabs } from "expo-router";
import { Image } from "react-native";
import { CurvedTabBar } from "../../components/CurvedTabBar";

export default function Layout() {
  return (
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
        name="Calendar"
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
  );
}
