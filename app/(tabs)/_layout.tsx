import { Tabs, Link } from "expo-router";
import { Image, TouchableOpacity } from "react-native";
import { CurvedTabBar } from "../../components/CurvedTabBar";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: false,

        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTitle: '',
        headerTintColor: '#9A6AFF',
        
        // Profile  
        headerRight: () => (
          <Link href="/Profile" asChild> 
            <TouchableOpacity style={{ marginRight: 15 }}>
              <Image
                source={require("../../assets/profile.png")} 
                style={{ width: 25, height: 25, tintColor: '#9A6AFF' }}
              />
            </TouchableOpacity>
          </Link>
        ),
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
    </Tabs>
  );
}
