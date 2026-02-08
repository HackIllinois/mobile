import { Tabs, Link, usePathname, useRouter } from "expo-router";
import { TouchableOpacity, View, StyleSheet, Alert, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import ProfileSvg from "../../assets/profile.svg";
import LogoutButtonSvg from "../../assets/profile/profile-screen/logout-button.svg";
import { CurvedTabBar } from "../../components/CurvedTabBar";
import { queryClient } from "../../lib/queryClient";
import HomeSvg from "../../assets/navbar/Home.svg";
import CalendarSvg from "../../assets/navbar/Calendar.svg";
import QrCodeSvg from "../../assets/navbar/Camera.svg";
import ShopSvg from "../../assets/navbar/Shop.svg";
import DuelsSvg from "../../assets/navbar/Duels.svg";

const TITLE_MAP: Record<string, string> = {
  "/Event": "SCHEDULE",
  "/Shop": "POINT SHOP",
  "/Scan": "SCANNER",
  "/Profile": "PROFILE",
};

export default function Layout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isProfileScreen = pathname === "/Profile";
  const title = TITLE_MAP[pathname] || null;

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync("jwt");
            queryClient.clear();
            router.replace("/AuthScreen");
          },
        },
      ]
    );
  };

  return (
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

        {/* Header */}
        {title && (
          <View style={[styles.headerRow, { top: insets.top }]}>
            <Text style={styles.headerTitle}>{title}</Text>
            {isProfileScreen ? (
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <LogoutButtonSvg width={70} height={28} />
              </TouchableOpacity>
            ) : (
              <Link href="/Profile" asChild>
                <TouchableOpacity>
                  <ProfileSvg width={45} height={45} />
                </TouchableOpacity>
              </Link>
            )}
          </View>
        )}

      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerRow: {
    position: 'absolute',
    left: 20,
    right: 10,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Tsukimi-Rounded-Bold',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  logoutButton: {
    marginRight: -7,
  },
});
