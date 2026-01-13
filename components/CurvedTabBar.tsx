import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useLinkBuilder } from '@react-navigation/native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// 1. Constants
const { width } = Dimensions.get('window');
const WIDTH = width;
const TAB_CONTENT_HEIGHT = 65; // Fixed height for the interactive area
const BUTTON_HIT_SLOP = { top: 15, bottom: 15, left: 15, right: 15 };

// 2. SVG Path Generator
const getSvgPath = (width: number, height: number, borderRadius: number = 20) => `
  M 0 ${height}
  L 0 ${borderRadius}
  Q 0 0 ${borderRadius} 0
  L ${width - borderRadius} 0
  Q ${width} 0 ${width} ${borderRadius}
  L ${width} ${height}
  Z
`;

// 3. Types
interface TabButtonProps {
  route: any;
  isFocused: boolean;
  options: any;
  onPress: () => void;
  onLongPress: () => void;
  buildHref: (name: string, params?: any) => string;
}

// 4. Individual Tab Button Component
function TabButton({
  route,
  isFocused,
  options,
  onPress,
  onLongPress,
}: TabButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.15 : 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    if (isFocused) {
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isFocused, scaleAnim, rotateAnim]);

  return (
    <View style={styles.tabButtonWrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarTestID}
        onPress={onPress}
        onLongPress={onLongPress}
        hitSlop={BUTTON_HIT_SLOP}
        style={styles.pressableArea}
      >
        <Animated.View
          style={[
            styles.tabFab,
            isFocused && styles.tabFabShadow,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={[styles.tabFabGradient, isFocused && styles.tabFabActive]}>
            <View style={styles.tabFabInner}>
              {options.tabBarIcon &&
                options.tabBarIcon({
                  color: "#FFFFFF",
                  size: 26,
                  focused: isFocused
                })}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

// 5. Main Tab Bar Component
export function CurvedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { buildHref } = useLinkBuilder();
  const insets = useSafeAreaInsets();
  
  const totalHeight = TAB_CONTENT_HEIGHT + insets.bottom + 12;
  const svgPath = getSvgPath(WIDTH, totalHeight);
  const visibleRoutes = state.routes.filter((route) => route.name !== "Profile");

  return (
    <View style={[styles.container, { height: totalHeight }]}>
      
      <View style={StyleSheet.absoluteFill}>
        <Svg width={WIDTH} height={totalHeight}>
          <Defs>
            <RadialGradient
              id="grad"
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="#1a0033" stopOpacity="1" />
              <Stop offset="100%" stopColor="#050816" stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Path d={svgPath} fill="url(#grad)" />
          <Circle cx={WIDTH / 2} cy={totalHeight / 2} r="4" fill="#7B2CBF" opacity="0.3" />
        </Svg>
      </View>

      <View style={[styles.buttonOverlay, { 
          height: totalHeight, 
          paddingBottom: insets.bottom 
        }]}>
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === state.routes.indexOf(route);

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key
            });
          };

          return (
            <TabButton
              key={route.key}
              route={route}
              isFocused={isFocused}
              options={options}
              onPress={onPress}
              onLongPress={onLongPress}
              buildHref={(name, params) => buildHref(name, params) ?? ""}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  buttonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 10, 
  },
  tabButtonWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressableArea: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  tabFabGradient: {
    width: "100%",
    height: "100%",
    backgroundColor: "#050816",
    borderWidth: 2.5,
    borderColor: "#4361EE",
    borderRadius: 28,
  },
  tabFabActive: {
    backgroundColor: "#7B2CBF",
    borderColor: "#E0AAFF",
  },
  tabFabInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  tabFabShadow: {
    shadowColor: "#7B2CBF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
});