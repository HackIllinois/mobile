import React from 'react';
import { View, StyleSheet, Pressable} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import HomeIcon from '../assets/navbar/Home.svg';
import EventsIcon from '../assets/navbar/Calendar.svg';
import QrCodeIcon from '../assets/navbar/Camera.svg';
import PointsIcon from '../assets/navbar/Shop.svg';
import DuelsIcon from '../assets/navbar/Duels.svg';

const BAR_HEIGHT = 52;


const TAB_CONFIG = [
  { name: "Home", Icon: HomeIcon },
  { name: "Event", Icon: EventsIcon },
  { name: "Scan", Icon: QrCodeIcon },
  { name: "Shop", Icon: PointsIcon },
  { name: "Duels", Icon: DuelsIcon },
];

export const CurvedTabBar = ({
  state,
  navigation,
}: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { height: BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom}]}>
      {TAB_CONFIG.map(({name, Icon}) =>{
        const routeIndex = state.routes.findIndex(
          (route) => route.name === name
        );
        
        if(routeIndex === -1) return null;
        
        const isFocused = state.index === routeIndex;
        return (
          <Pressable
            key={name}
            onPress={() => navigation.navigate(name)}
            style={styles.tab}>
              <View style={isFocused? styles.activeIcon : undefined}>
                <Icon
                    width={38}
                    height={38}
                    color={isFocused ? "#DF4F44" : "#8D8799"}
                />
              </View>

              {isFocused && <View style={styles.activeDot}/>}
            </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#020006ff",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
  },

  tab: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  activeIcon: {
    transform: [{ translateY: -5 }],
  },

  activeDot: {
    position: "absolute",
    bottom: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DF4F44",
  },
});
