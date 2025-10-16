import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useLinkBuilder } from '@react-navigation/native';
import { PlatformPressable } from '@react-navigation/elements';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');
const WIDTH = width;
const TAB_BAR_HEIGHT = 130;


const getSvgPath = (height: number) => {
  return `
    M 0 ${height}
    L 0 20
    Q 0 0 20 0
    L ${WIDTH - 20} 0
    Q ${WIDTH} 0 ${WIDTH} 20
    L ${WIDTH} ${height}
    Z
  `;
};

interface TabButtonProps {
  route: any;
  isFocused: boolean;
  options: any;
  onPress: () => void;
  onLongPress: () => void;
  buildHref: (name: string, params?: any) => string;
}

function TabButton({ route, isFocused, options, onPress, onLongPress, buildHref }: TabButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.15 : 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  return (
    <View style={styles.tabButtonWrapper}>
      {/* Orbital rings for each tab */}
      <View style={styles.tabOrbitContainer}>
        <View style={[styles.tabOrbit, styles.tabOrbit1]} />
        <View style={[styles.tabOrbit, styles.tabOrbit2]} />
        <View style={[styles.tabOrbit, styles.tabOrbit3]} />
      </View>

      <PlatformPressable
        href={buildHref(route.name, route.params)}
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarButtonTestID}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tabButton}
      >
        <Animated.View
          style={[
            styles.tabFabShadow,
          ]}
        >
          <View style={styles.tabFab}>
            <View style={[styles.tabFabGradient, isFocused && styles.tabFabActive]}>
              <View style={styles.tabFabInner}>
                {options.tabBarIcon &&
                  options.tabBarIcon({
                    color: "FFFFFF",
                    size: 26,
                    focused: isFocused,
                  })}
              </View>
            </View>
          </View>
        </Animated.View>
      </PlatformPressable>
    </View>
  );
}

export function CurvedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { buildHref } = useLinkBuilder();
  const insets = useSafeAreaInsets();
  
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 0) : insets.bottom;
  const totalHeight = TAB_BAR_HEIGHT + bottomPadding;
  const svgPath = getSvgPath(TAB_BAR_HEIGHT);

  return (
    <View style={[styles.container, { height: totalHeight, paddingBottom: bottomPadding }]}>
      {/* Background with stars effect */}
      <View style={styles.backgroundWrapper}>
        <Svg width={WIDTH} height={TAB_BAR_HEIGHT} style={styles.svg}>
          <Defs>
            <RadialGradient id="spaceGrad" cx="50%" cy="0%" r="100%">
              <Stop offset="0%" stopColor="#1a1a2e" stopOpacity="1" />
              <Stop offset="50%" stopColor="#0f0f1e" stopOpacity="0.98" />
              <Stop offset="100%" stopColor={"#050816"} stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Path d={svgPath} fill="url(#spaceGrad)" />
          
          {/* Decorative stars */}
          <Circle cx={WIDTH * 0.10} cy={TAB_BAR_HEIGHT * 0.2} r="1" fill={"FFFFFF"} opacity="0.5" />
          <Circle cx={WIDTH * 0.15} cy={TAB_BAR_HEIGHT * 0.3} r="1.5" fill={"FFFFFF"} opacity="0.8" />
          <Circle cx={WIDTH * 0.22} cy={TAB_BAR_HEIGHT * 0.5} r="0.8" fill={"#4361EE"} opacity="0.4" />
          <Circle cx={WIDTH * 0.25} cy={TAB_BAR_HEIGHT * 0.6} r="1" fill={"#E0AAFF"} opacity="0.6" />
          <Circle cx={WIDTH * 0.33} cy={TAB_BAR_HEIGHT * 0.35} r="1.2" fill={"#FFFFFF"} opacity="0.7" />
          <Circle cx={WIDTH * 0.40} cy={TAB_BAR_HEIGHT * 0.55} r="0.9" fill={"#4361EE"} opacity="0.5" />
          <Circle cx={WIDTH * 0.50} cy={TAB_BAR_HEIGHT * 0.3} r="1" fill={"#E0AAFF"} opacity="0.6" />
          <Circle cx={WIDTH * 0.60} cy={TAB_BAR_HEIGHT * 0.45} r="1.5" fill={"#FFFFFF"} opacity="0.7" />
          <Circle cx={WIDTH * 0.70} cy={TAB_BAR_HEIGHT * 0.25} r="1.2" fill={"#E0AAFF"} opacity="0.5" />
          <Circle cx={WIDTH * 0.75} cy={TAB_BAR_HEIGHT * 0.4} r="1.5" fill={"#FFFFFF"} opacity="0.7" />
          <Circle cx={WIDTH * 0.82} cy={TAB_BAR_HEIGHT * 0.6} r="1" fill={"#4361EE"} opacity="0.5" />
          <Circle cx={WIDTH * 0.85} cy={TAB_BAR_HEIGHT * 0.65} r="1" fill={"#4361EE"} opacity="0.5" />
          <Circle cx={WIDTH * 0.90} cy={TAB_BAR_HEIGHT * 0.3} r="1.1" fill={"#FFFFFF"} opacity="0.6" />
          <Circle cx={WIDTH * 0.92} cy={TAB_BAR_HEIGHT * 0.25} r="1.2" fill={"#E0AAFF"} opacity="0.6" />
        </Svg>
        
        {/* Cosmic glow line */}
        <View style={styles.cosmicGlowLine} />
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
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
              target: route.key,
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
              buildHref={(name, params) => buildHref(name, params) ?? ''}
            />
          );
        })}
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  backgroundWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  svg: {
    position: 'absolute',
    bottom: 0,
  },
  cosmicGlowLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#4361EE",
    opacity: 0.4,
    shadowColor: "#4361EE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT+60,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tabButtonWrapper: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabOrbitContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
  },
  tabOrbit: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 999,
    borderStyle: 'dashed',
  },
  tabOrbit1: {
    width: 80,
    height: 80,
    borderColor: "#7B2CBF",
    opacity: 0.2,
  },
  tabOrbit2: {
    width: 70,
    height: 70,
    borderColor: "#4361EE",
    opacity: 0.25,
  },
  tabOrbit3: {
    width: 60,
    height: 60,
    borderColor: "#E0AAFF",
    opacity: 0.3,
  },
  tabFabShadow: {
    shadowColor: "#7B2CBF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  tabFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  tabFabGradient: {
    width: '100%',
    height: '100%',
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
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});