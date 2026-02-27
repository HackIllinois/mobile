import React, { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import EventText from "../../assets/event/ActiveEvent.svg";
import MentorshipText from "../../assets/event/ActiveMentorship.svg";
import PassiveMentorText from "../../assets/event/PassiveMentorship.svg";
import PassiveEventText from "../../assets/event/PassiveEvent.svg";
import ActiveShiftsText from "../../assets/event/ActiveShifts";
import PassiveShiftsText from "../../assets/event/PassiveShifts";
import { getConstrainedWidth } from "../../lib/layout";

const SCREEN_WIDTH = getConstrainedWidth();

// --- Configuration ---
const TAB_HEIGHT = 45;
const CORNER_RADIUS = 12;
const LEFT_MARGIN = 20;
const TAB_GAP = 30;
const HUMP_PADDING = 25;
const STROKE_WIDTH = 3;
const STROKE_OFFSET = 2;

// --- FIX: Nudge the center point for Mentorship ---
const MENTORSHIP_OFFSET = 3;

export type TabMode = 'events' | 'mentorship' | 'shifts';

const tabIndex = (tab: TabMode): number =>
  tab === 'events' ? 0 : tab === 'mentorship' ? 1 : 2;

interface EventTabsProps {
  activeTab: TabMode;
  onTabPress: (tab: TabMode) => void;
  showShifts?: boolean;
}

export default function EventTabs({ activeTab, onTabPress, showShifts = false }: EventTabsProps) {
  const animatedValue = useRef(new Animated.Value(tabIndex(activeTab))).current;

  const [layouts, setLayouts] = useState({
    events: { x: 0, width: 0 },
    mentorship: { x: 0, width: 0 },
    shifts: { x: 0, width: 0 },
  });

  const [currentIndex, setCurrentIndex] = useState(tabIndex(activeTab));

  useEffect(() => {
    const targetValue = tabIndex(activeTab);
    setCurrentIndex(targetValue);

    Animated.timing(animatedValue, {
      toValue: targetValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

  const onLayoutTab = (key: 'events' | 'mentorship' | 'shifts', event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    if (layouts[key].x !== x || layouts[key].width !== width) {
      setLayouts(prev => ({ ...prev, [key]: { x, width } }));
    }
  };

  // --- SVG Path Logic ---
  const getPath = (index: number) => {
    const keys: Array<'events' | 'mentorship' | 'shifts'> = ['events', 'mentorship', 'shifts'];
    const activeKey = keys[index];
    const layout = layouts[activeKey];

    if (layout.width === 0) return `M 0 ${TAB_HEIGHT} L ${SCREEN_WIDTH} ${TAB_HEIGHT}`;

    let centerX = layout.x + (layout.width / 2);

    if (activeKey === 'mentorship') {
      centerX -= MENTORSHIP_OFFSET;
    }

    const effectiveWidth = activeKey === 'mentorship'
      ? layout.width - MENTORSHIP_OFFSET
      : layout.width;

    const humpWidth = effectiveWidth + HUMP_PADDING;
    const startX = centerX - (humpWidth / 2);
    const endX = centerX + (humpWidth / 2);

    const topY = STROKE_OFFSET;
    const bottomY = TAB_HEIGHT - STROKE_OFFSET;

    return `
      M 0 ${bottomY}
      L ${startX - CORNER_RADIUS} ${bottomY}
      Q ${startX} ${bottomY} ${startX} ${bottomY - CORNER_RADIUS}
      L ${startX} ${topY + CORNER_RADIUS}
      Q ${startX} ${topY} ${startX + CORNER_RADIUS} ${topY}
      L ${endX - CORNER_RADIUS} ${topY}
      Q ${endX} ${topY} ${endX} ${topY + CORNER_RADIUS}
      L ${endX} ${bottomY - CORNER_RADIUS}
      Q ${endX} ${bottomY} ${endX + CORNER_RADIUS} ${bottomY}
      L ${SCREEN_WIDTH} ${bottomY}
    `;
  };

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <Svg width={SCREEN_WIDTH} height={TAB_HEIGHT + 5} style={{ top: 0 }}>
          <Path
            d={getPath(currentIndex)}
            stroke="white"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      <View style={[styles.tabsContainer, { paddingLeft: LEFT_MARGIN }]}>
        <TouchableOpacity
          style={styles.tabButton}
          onLayout={(e) => onLayoutTab('events', e)}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onTabPress('events'); }}
          activeOpacity={0.8}
        >
          {activeTab === 'events' ? <EventText /> : <PassiveEventText />}
        </TouchableOpacity>

        <View style={{ width: TAB_GAP }} />

        <TouchableOpacity
          style={styles.tabButton}
          onLayout={(e) => onLayoutTab('mentorship', e)}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onTabPress('mentorship'); }}
          activeOpacity={0.8}
        >
          {activeTab === 'mentorship' ? <MentorshipText /> : <PassiveMentorText />}
        </TouchableOpacity>

        {showShifts && (
          <>
            <View style={{ width: TAB_GAP }} />
            <TouchableOpacity
              style={styles.tabButton}
              onLayout={(e) => onLayoutTab('shifts', e)}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onTabPress('shifts'); }}
              activeOpacity={0.8}
            >
              {activeTab === 'shifts' ? <ActiveShiftsText /> : <PassiveShiftsText />}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 60,
    justifyContent: 'flex-start',
  },
  tabsContainer: {
    flexDirection: 'row',
    height: TAB_HEIGHT,
    alignItems: 'center',
  },
  tabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
});

