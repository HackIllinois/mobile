import { useEffect } from "react";
import { Tabs, usePathname, useRouter } from "expo-router";
import { TouchableOpacity, View, StyleSheet, Alert, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import ProfileSvg from "../../assets/profile.svg";
import LogoutButtonSvg from "../../assets/profile/profile-screen/logout-button.svg";
import { CurvedTabBar } from "../../components/CurvedTabBar";
import { tabBackgrounds } from "../../lib/layout";
import { queryClient } from "../../lib/queryClient";
import { fetchProfile, prefetchAvatarImage, loadCachedRoles, clearCachedRoles, hasNonProfileRole } from "../../lib/fetchProfile";

const TITLE_MAP: Partial<Record<keyof typeof tabBackgrounds, string>> = {
  Event: "SCHEDULE",
  Shop: "POINT SHOP",
  Scan: "SCANNER",
  Profile: "PROFILE",
};


export default function Layout() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = pathname.slice(1) as keyof typeof tabBackgrounds;
  const backgroundColor = tabBackgrounds[activeTab] ?? tabBackgrounds.Home;

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

  const handleProfilePress = () => {
    router.push("/Profile");
  };

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
    <SafeAreaView edges={["left", "right"]} style={[styles.container, { backgroundColor }]}>
      <Tabs
        screenOptions={({ route }) => {
          const tab = route.name as keyof typeof tabBackgrounds;
          const headerColor = tab === "Home" || tab === "Shop" ? "#4d4c4c" : "#fff";

          return {
            sceneStyle: { backgroundColor: tabBackgrounds[tab] },
            header: () => (
              <SafeAreaView edges={["top"]} style={{ backgroundColor: tabBackgrounds[tab] }}>
                <View style={styles.headerRow}>
                  <Text style={[styles.headerTitle, { color: headerColor }]}>{TITLE_MAP[tab]}</Text>
                  {tab === "Profile" ? (
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={handleLogout}
                      style={styles.logoutButton}
                    >
                      <LogoutButtonSvg width={70} height={28} />
                      <Text style={styles.logoutLabel}>LOGOUT</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      accessibilityLabel="Profile"
                      accessibilityRole="button"
                      onPress={handleProfilePress}
                    >
                      <ProfileSvg width={45} height={45} color={headerColor} />
                    </TouchableOpacity>
                  )}
                </View>
              </SafeAreaView>
            ),
          };
        }}
        tabBar={(props) => <CurvedTabBar {...props} />}
      >
        <Tabs.Screen name="Home" />
        <Tabs.Screen name="Shop" />
        <Tabs.Screen name="Scan" />
        <Tabs.Screen name="Event" />
        <Tabs.Screen name="Duels" />
        {/* The custom tab bar omits Profile. Router 58 redirects away from hidden routes. */}
        <Tabs.Screen name="Profile" />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    paddingLeft: 20,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 25,
    flexShrink: 1,
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
