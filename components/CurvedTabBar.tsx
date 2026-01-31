import React from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import NavbarBackground from '../assets/navbar/Background.svg';
import HomeIcon from '../assets/navbar/Home.svg';
import EventsIcon from '../assets/navbar/Calendar.svg';
import QrCodeIcon from '../assets/navbar/Camera.svg';
import PointsIcon from '../assets/navbar/Shop.svg';
import DuelsIcon from '../assets/navbar/Duels.svg';

const { width } = Dimensions.get('window');
const BAR_HEIGHT = 85;
const CENTER_BUTTON_SIZE = 85;
const ICON_SIZE = 40;

const ICON_MAP: Record<string, any> = {
  Home: HomeIcon,
  Event: EventsIcon,
  Scan: QrCodeIcon,
  Shop: PointsIcon,
  Duels: DuelsIcon,
};

const TAB_POSITIONS: Record<string, number> = {
  Home: 0.10,
  Event: 0.28,
  Shop: 0.72,
  Duels: 0.90,
};

export const CurvedTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  return (
    <View style={styles.tabBarContainer}>
      {/* Background */}
      <View style={StyleSheet.absoluteFill}>
        <NavbarBackground
          width={width}
          height={BAR_HEIGHT}
          preserveAspectRatio="none"
        />
      </View>

      <View style={styles.tabsRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const Icon = ICON_MAP[route.name];

          // Skip hidden routes (Profile)
          if (options.href === null) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          /** CENTER BUTTON (Scan) */
          if (route.name === 'Scan') {
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={[
                  styles.centerButton,
                  { left: width / 2 - CENTER_BUTTON_SIZE / 2 },
                ]}
              >
                <View
                  style={[
                    styles.centerButtonInner,
                    isFocused && styles.centerButtonActive,
                  ]}
                >
                  <QrCodeIcon
                    width={CENTER_BUTTON_SIZE}
                    height={CENTER_BUTTON_SIZE}
                    color={isFocused ? '#FFF' : '#DF4F44'}
                  />
                </View>
              </Pressable>
            );
          }

          /** REGULAR BUTTONS */
          const positionPercent = TAB_POSITIONS[route.name];
          if (positionPercent === undefined) return null;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[
                styles.tabButton,
                { left: width * positionPercent },
              ]}
            >
              <View style={styles.iconContainer}>
                {Icon && (
                  <Icon
                    width={ICON_SIZE}
                    height={ICON_SIZE}
                    color={
                      isFocused
                        ? '#DF4F44'
                        : 'rgba(255, 255, 255, 0.6)'
                    }
                  />
                )}

                {/* ACTIVE INDICATOR DOT */}
                {isFocused && <View style={styles.activeDot} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    height: BAR_HEIGHT,
    width,
    justifyContent: 'flex-end',
  },

  tabsRow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  tabButton: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -30,
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeDot: {
    marginTop: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DF4F44',
  },

  centerButton: {
    position: 'absolute',
    top: -35,
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    zIndex: 10,
  },

  centerButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: CENTER_BUTTON_SIZE / 2,
    backgroundColor: '#3b1d61',
    borderWidth: 5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  centerButtonActive: {
    backgroundColor: '#5A3585',
  },
});
