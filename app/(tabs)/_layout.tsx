import { Tabs, Link, usePathname } from "expo-router";
import { Image, TouchableOpacity, View, StyleSheet } from "react-native";
import { CurvedTabBar } from "../../components/CurvedTabBar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomeSvg from "../../assets/navbar/Home.svg";
import CalendarSvg from "../../assets/navbar/Calendar.svg";
import QrCodeSvg from "../../assets/navbar/Camera.svg";
import ShopSvg from "../../assets/navbar/Shop.svg";
import DuelsSvg from "../../assets/navbar/Duels.svg";

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
                <HomeSvg width={90} height={90} />
              ),
            }}
          />
          
          <Tabs.Screen
            name="Shop"
            options={{
              tabBarIcon: ({ color, size }) => (
                <ShopSvg width={90} height={90} />
              ),
            }}
          />
          <Tabs.Screen
            name="Scan"
            options={{
              tabBarIcon: ({ color, size }) => (
                <QrCodeSvg width={90} height={90} />
              ),
            }}
          />
          <Tabs.Screen
            name="Event"
            options={{
              tabBarIcon: ({ color, size }) => (
                <CalendarSvg width={90} height={90} />
              ),
            }}
          />
          <Tabs.Screen
            name="Duels"
            options={{
              tabBarIcon: ({ color, size }) => (
                <DuelsSvg width={90} height={90} />
              ),
            }}
          />
          <Tabs.Screen
            name="Profile"
            options={{
              href: null, // Exclude from tab bar, accessed via Link
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
