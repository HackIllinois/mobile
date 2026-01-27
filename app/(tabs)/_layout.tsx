import { Tabs, Link, usePathname } from "expo-router";
import { Image, TouchableOpacity, View, StyleSheet } from "react-native";
import { CurvedTabBar } from "../../components/CurvedTabBar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a single QueryClient instance
const queryClient = new QueryClient();

export default function Layout() {
  const pathname = usePathname();
  const isProfileScreen = pathname === "/Profile";
  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.container}>
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
        </Tabs>

        {!isProfileScreen && (
          <View style={[styles.floatingButton, { top: 60 }]}>
            <Link href="/Profile" asChild>
              <TouchableOpacity>
                <Image
                  source={require("../../assets/profile.png")}
                  style={{ width: 30, height: 30, tintColor: '#e1d8f4ff' }}
                />
              </TouchableOpacity>
            </Link>
          </View>
        )}

      </View>

    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', 
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    zIndex: 100, 
  },
});
