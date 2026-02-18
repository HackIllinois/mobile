import { useEffect } from "react";
import { Tabs, Link, usePathname, useRouter } from "expo-router";
import { TouchableOpacity, View, StyleSheet, Alert, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import ProfileSvg from "../../assets/profile.svg";
import LogoutButtonSvg from "../../assets/profile/profile-screen/logout-button.svg";
import { CurvedTabBar } from "../../components/CurvedTabBar";
import { queryClient } from "../../lib/queryClient";
import { fetchProfile, prefetchAvatarImage, loadCachedRoles, clearCachedRoles, hasNonProfileRole } from "../../lib/fetchProfile";
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

  useEffect(() => {
    loadCachedRoles().then(() => {
      if (!hasNonProfileRole()) {
        queryClient.prefetchQuery({
          queryKey: ["profile"],
          queryFn: fetchProfile,
          staleTime: 5 * 60 * 1000,
        }).then(() => {
          const profile = queryClient.getQueryData<any>(["profile"]);
          if (profile?.avatarUrl) {
            prefetchAvatarImage(profile.avatarUrl);
          }
        }).catch(() => {});
      }
    });
  }, []);

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
            await SecureStore.deleteItemAsync("isGuest");
            await SecureStore.deleteItemAsync("userRoles");
            clearCachedRoles();
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
        <View style={[styles.headerRow, { top: insets.top }]}>
          {title ? (
            <View style={{ marginTop: -6 }}>
              <Text style={[styles.headerTitle, styles.glowWide]}>{title}</Text>
              <Text style={[styles.headerTitle, styles.glowMid]}>{title}</Text>
              <Text style={[styles.headerTitle, styles.titleFront]}>{title}</Text>
            </View>
          ) : (
            <View />
          )}
          {isProfileScreen ? (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogoutButtonSvg width={70} height={28} />
              <Text style={styles.logoutLabel}>LOGOUT</Text>
            </TouchableOpacity>
          ) : (
            <Link href="/Profile" asChild>
              <TouchableOpacity>
                <ProfileSvg width={45} height={45} />
              </TouchableOpacity>
            </Link>
          )}
        </View>

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
    fontSize: 25,
    fontFamily: 'Tsukimi-Rounded-Bold',
  },
  glowWide: {
    position: 'absolute',
    color: 'transparent',
    textShadowColor: 'rgba(243, 77, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  glowMid: {
    position: 'absolute',
    color: 'transparent',
    textShadowColor: 'rgba(243, 77, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  titleFront: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(243, 77, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  logoutButton: {
    marginRight: -7,
    alignItems: 'center',
  },
  logoutLabel: {
    color: '#FFFFFF',
    fontFamily: 'Tsukimi-Rounded-Bold',
    fontSize: 9,
    textAlign: 'center',
    width: 70,
    marginTop: 2,
  },
});
