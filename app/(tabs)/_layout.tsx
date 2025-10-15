// app/_layout.tsx
import React from "react";
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
        name="home"
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
        name="shop"
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
        name="scan"
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
        name="calendar"
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
        name="profile"
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
