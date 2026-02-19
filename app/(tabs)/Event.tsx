import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Pressable,
  TouchableOpacity
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Components ---
import { EventHeader, EventDay } from '../../components/eventScreen/EventHeader';
import EventTabs from '../../components/eventScreen/EventTabs'; 
import { EventCard } from '../../components/eventScreen/EventCard';
import { useWindowDimensions } from "react-native";


import EventDetailModal from '../../components/eventScreen/EventDetailModal';
import MentorDetailModal from '../../components/eventScreen/MentorDetailModal';
import MenuModal from '../../components/eventScreen/MenuModal';
import StarryBackground from '../../components/eventScreen/StarryBackground';

// --- Hooks & Utils ---
import { useEvents } from '../../lib/fetchEvents';
import { useSavedEvents } from '../../lib/fetchSavedEvents';
import { useMentorOfficeHours } from '../../lib/fetchMentorOfficeHours';
import { Event } from '../../types';

// --- Types ---
type ScheduleMode = 'events' | 'mentorship';

type MentorshipSession = {
  id: string;
  mentorName: string;
  location: string;
  startTime: number; 
  endTime: number;   
  track?: string;
  bio?: string;
  topics?: string[];
  contact?: string;
};

// --- Constants ---
const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT_EXPANDED = 145; 
const TABS_HEIGHT = 40;
const IS_TABLET = width > 768;


export default function EventScreen() {
  const insets = useSafeAreaInsets();
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('events');
  
  // Animation Values
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);

  // --- Data Hooks ---
  const { events = [], loading: eventsLoading, error: eventsError, refetch: refetchEvents } = useEvents();
  const { savedEventIds: savedEventIdsList } = useSavedEvents();
  
  const isMentors = scheduleMode === 'mentorship';
  const {
    mentorOfficeHours,
    loading: mentorsLoading,
    error: mentorsError,
    refetch: refetchMentors,
  } = useMentorOfficeHours(isMentors);

  // --- State ---
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSave, setSaveValue] = useState<boolean>(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [selectedEventForMenu, setSelectedEventForMenu] = useState<Event | null>(null);
  
  const [selectedMentorSession, setSelectedMentorSession] = useState<MentorshipSession | null>(null);
  const [mentorModalVisible, setMentorModalVisible] = useState(false);


  useEffect(() => {
    setSavedEventIds(new Set(savedEventIdsList));
  }, [savedEventIdsList]);

  // Reset scroll position when filters change
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      scrollY.setValue(0);
    }
  }, [selectedDay, selectedSave, scheduleMode]);

  // --- Handlers ---
  const handleEventPress = (event: Event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleShowMenu = (event: Event) => {
    Haptics.selectionAsync();
    setSelectedEventForMenu(event);
    setMenuModalVisible(true);
  };

  const handleMentorPress = (session: MentorshipSession) => {
    //
    Haptics.selectionAsync();
    setSelectedMentorSession(session);
    setMentorModalVisible(true);
  };

  // Unified Refresh Logic
  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRefreshing(true);

    if (scheduleMode === 'events') {
      await refetchEvents();
    } else {
      await refetchMentors();
    }

    setIsRefreshing(false);
  }, [refetchEvents, refetchMentors, scheduleMode]);

  const handleSave = async (eventId: string) => {
    Haptics.selectionAsync();
    setSavedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);

      AsyncStorage.setItem('savedEvents', JSON.stringify(Array.from(next))).catch((e) =>
        console.error('Failed to save events', e),
      );
      return next;
    });
  };

  const isToday = (d: Date) => {
    const today = new Date(); 
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const eventDays: EventDay[] = useMemo(() => {
    if (!events.length) return [];
    const dateMap = new Map<string, Date>();
    events.forEach((event) => {
      const eventDate = new Date(event.startTime * 1000);
      const dateKey = eventDate.toDateString();
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, eventDate);
      }
    });
    return Array.from(dateMap.entries())
      .sort(([, dateA], [, dateB]) => dateA.getTime() - dateB.getTime())
      .map(([dateKey, date]) => {
        const dayNum = date.getDate().toString().padStart(2, '0');
        const weekDay = date.toLocaleDateString('en-US', { weekday: 'short' });
        return {
          id: dateKey,
          label: `${dayNum} - ${weekDay}`,
          date,
        };
      });
  }, [events]);

  const mentorshipSessions: MentorshipSession[] = useMemo(() => {
    return mentorOfficeHours.map((m) => ({
      id: m.mentorId,
      mentorName: m.mentorName,
      location: m.location,
      startTime: Math.floor(m.startTime / 1000),
      endTime: Math.floor(m.endTime / 1000),
      track: 'Mentor',
      bio: 'No bio provided yet.',
      topics: [],
      contact: '',
    }));
  }, [mentorOfficeHours]);

  const hasInitialSelection = useRef(false);
  useEffect(() => {
    if (!hasInitialSelection.current && eventDays.length > 0) {
      const todayEntry = eventDays.find((day) => isToday(day.date));
      if (todayEntry) setSelectedDay(todayEntry.id);
      hasInitialSelection.current = true;
    }
  }, [eventDays]);

  const activeItems = useMemo(() => {
    return scheduleMode === 'events' ? events : mentorshipSessions;
  }, [scheduleMode, events, mentorshipSessions]);

  const filteredItems = useMemo(() => {
    let data: any[] = activeItems as any[];
    
    if (selectedDay) {
      data = data.filter((item) => new Date(item.startTime * 1000).toDateString() === selectedDay);
    }
    
    if (scheduleMode === 'events' && selectedSave) {
      data = (data as Event[]).filter((event) => savedEventIds.has(event.eventId));
    }
    
    return data.sort((a, b) => a.startTime - b.startTime);
  }, [activeItems, selectedDay, selectedSave, scheduleMode, savedEventIds]);


  const hasAutoScrolled = useRef(false);

  useEffect(() => {
    if (hasAutoScrolled.current || filteredItems.length === 0 || !flatListRef.current) return;

    // Only scroll if we're currently viewing today's events
    const now = Date.now() / 1000; 
    const todayString = new Date(now * 1000).toDateString();
    if (selectedDay !== todayString) return;

    const LOOKBACK_SECONDS = 30 * 60; // 30 minutes

    let targetIndex = filteredItems.findIndex((item: any) => {
      const endTime = item.endTime
        ? (item.endTime > 9999999999 ? item.endTime / 1000 : item.endTime)
        : item.startTime + 3600;
      const startedRecently = item.startTime >= now - LOOKBACK_SECONDS;
      return startedRecently && endTime > now;
    });

    // Fallback: next event that hasn't started yet
    if (targetIndex === -1) {
      targetIndex = filteredItems.findIndex((item: any) => item.startTime > now);
    }

    // Last fallback: just go to the closest event to now
    if (targetIndex === -1) {
      let closestDiff = Infinity;
      filteredItems.forEach((item: any, i: number) => {
        const diff = Math.abs(item.startTime - now);
        if (diff < closestDiff) { closestDiff = diff; targetIndex = i; }
      });
    }


    if (targetIndex > 0) {
      const expectedLength = filteredItems.length;
      setTimeout(() => {
        if (!flatListRef.current) return;

        if (targetIndex >= expectedLength) return;
        flatListRef.current.scrollToIndex({
          index: targetIndex,
          animated: true,
          viewPosition: 0.15,
        });
      }, 400);
    }

    hasAutoScrolled.current = true;
  }, [filteredItems]);


  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      const offset = info.averageItemLength * info.index;
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset, animated: true });
      }, 200);
    },
    [],
  );

  // --- Render Functions ---

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const renderMentorCard = (m: MentorshipSession, showTimeHeader: boolean, timeHeaderText: string) => {
    return (
      <>
        {showTimeHeader && <Text style={styles.timeHeader}>{timeHeaderText}</Text>}

        <Pressable onPress={() => handleMentorPress(m)} style={styles.mentorCard}>
          <View style={styles.mentorHeaderRow}>
            <Text style={styles.mentorName} numberOfLines={2}>
              {m.mentorName}
            </Text>

            {!!m.track && (
              <View style={styles.mentorTrackPill}>
                <Text style={styles.mentorTrackText}>{m.track}</Text>
              </View>
            )}
          </View>

          <Text style={styles.mentorInfo}>
            {formatTime(m.startTime)} - {formatTime(m.endTime)}
          </Text>
          <Text style={styles.mentorInfo}>{m.location}</Text>

          <Text style={styles.mentorMore}>Tap for details</Text>
        </Pressable>
      </>
    );
  };

  const renderEvent = ({ item, index }: { item: any; index: number }) => {
    const previousItem = filteredItems[index - 1];
    const showTime = index === 0 || previousItem?.startTime !== item.startTime;
    const timeHeaderText = formatTime(item.startTime);

    // Check if we need to show a day header (only when viewing all events)
    const currentDate = new Date(item.startTime * 1000);
    const previousDate = previousItem ? new Date(previousItem.startTime * 1000) : null;
    const showDayHeader = !selectedDay && (index === 0 || (previousDate && currentDate.toDateString() !== previousDate.toDateString()));
    
    const dayHeaderText = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long'
    });

    if (scheduleMode === 'events') {
      const ev = item as Event;
      return (
        <View style={styles.eventWrapper}>
          {showDayHeader && (
            <View style={styles.underlineContainer}>
              <Text style={styles.dayHeader}>{dayHeaderText}</Text>
            </View>
          )}
          <EventCard
            event={ev}
            index={index}
            onPress={handleEventPress}
            handleSave={handleSave}
            onShowMenu={handleShowMenu}
            saved={savedEventIds.has(ev.eventId)}
            showTime={showTime} 
          />
        </View>
      );
    }

    const m = item as MentorshipSession;
    return (
      <View style={{ marginBottom: 40, width: '100%', alignItems: 'center' }}>
        {showDayHeader && (
          <Text style={styles.dayHeader}>{dayHeaderText}</Text>
        )}
        {renderMentorCard(m, showTime, timeHeaderText)}
      </View>
    );
  };

  // --- Animation Interpolations ---
  const tabsTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -TABS_HEIGHT],
    extrapolate: 'clamp',
  });
  const tabsOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -TABS_HEIGHT],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.6], 
    extrapolate: 'clamp',
  });

  // --- Loading/Error/Empty States ---
  const isLoading = (eventsLoading && scheduleMode === 'events') || (mentorsLoading && scheduleMode === 'mentorship');
  const isError = (eventsError && scheduleMode === 'events') || (mentorsError && scheduleMode === 'mentorship');
  const isEmpty = !isLoading && !isRefreshing && filteredItems.length === 0;

  return (
    <StarryBackground scrollY={scrollY}>
      <View style={[styles.container, { paddingTop: insets.top + 55 }]}>
        {/* --- Sticky Header Section --- */}
        <View style={[styles.stickyHeaderContainer, { top: insets.top + 45 }]}>
            <Animated.View style={{
                opacity: tabsOpacity,
                transform: [{ translateY: tabsTranslateY }],
                zIndex: -1
            }}>
                <EventTabs
                    activeTab={scheduleMode}
                    onTabPress={(mode) => {
                        setScheduleMode(mode);
                        setSaveValue(false);
                    }}
                />
            </Animated.View>

            <Animated.View style={{
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslateY }]
            }}>
                <EventHeader
                    eventDays={eventDays}
                    selectedDay={selectedDay}
                    setSelectedDay={setSelectedDay}
                    selectedSave={selectedSave}
                    setSaveValue={setSaveValue}
                    scheduleMode={scheduleMode}
                />
            </Animated.View>
        </View>

        {/* --- Render Content Logic --- */}
        {isRefreshing ? (
             <View style={[styles.emptyContainer, { marginTop: 300 }]}>
                <ActivityIndicator color="#7229a3" size="large" />
                <Text style={styles.emptyText}>Refreshing...</Text>
             </View>
        ) : isLoading && isEmpty ? (
             <View style={{ marginTop: 300 }}>
                 <ActivityIndicator size="large" color="#FFF" />
                 <Text style={styles.emptyText}>Loading...</Text>
             </View>
        ) : isError ? (
             <View style={styles.emptyContainer}>
                 <Text style={styles.emptyText}>Error fetching data</Text>
                 <TouchableOpacity onPress={() => scheduleMode === 'events' ? refetchEvents() : refetchMentors()} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                 </TouchableOpacity>
             </View>
        ) : (
            <Animated.FlatList
                ref={flatListRef}
                data={filteredItems}
                renderItem={renderEvent}
                keyExtractor={(item: any) => item.eventId || item.id || item.name + item.startTime}
                onScrollToIndexFailed={handleScrollToIndexFailed}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingTop: HEADER_HEIGHT_EXPANDED }
                ]}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor="#00f0ff"
                        progressViewOffset={HEADER_HEIGHT_EXPANDED}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {scheduleMode === 'mentorship'
                                ? 'No mentors found.'
                                : selectedSave ? 'No saved events.' : 'No events found.'}
                        </Text>
                    </View>
                }
            />
        )}

        {selectedEvent && (
          <EventDetailModal
            visible={modalVisible}
            event={selectedEvent}
            onClose={() => setModalVisible(false)}
            handleSave={handleSave}
            saved={savedEventIds.has(selectedEvent.eventId)}
          />
        )}

        <MenuModal 
            visible={menuModalVisible} 
            event={selectedEventForMenu} 
            onClose={() => setMenuModalVisible(false)} 
        />

        {selectedMentorSession && (
          <MentorDetailModal
            visible={mentorModalVisible}
            session={selectedMentorSession}
            onClose={() => setMentorModalVisible(false)}
          />
        )}

      </View>
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  
  titleContainer: {
    position: 'absolute',
    left: 0,
    zIndex: 101, 
    marginLeft: 10,
  },

  stickyHeaderContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100, 
  },

  listContent: {
    paddingBottom: 100, 
    minHeight: 800,
  },
  
  eventWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0, 
  },
  
  timeHeader: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
    fontWeight: '700',
  },

  // --- Day Header Style ---
  dayHeader: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: "Tsukimi-Rounded-Bold",
  },
  underlineContainer: {
    alignSelf: 'center',           // Wraps width to content
    borderBottomWidth: 2.5,          // Thicker line
    borderBottomColor: 'rgb(255, 255, 255)',  // Your neon/theme color
  },

  // --- Mentor Card Styles ---
  mentorCard: {
    width: '90%', 
    borderRadius: 16,
    padding: 18,
    backgroundColor: 'rgba(135, 65, 134, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  mentorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  mentorName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fffefeff',
    flex: 1,
  },
  mentorTrackPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignSelf: 'flex-start',
  },
  mentorTrackText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#222',
  },
  mentorInfo: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffffff',
  },
  mentorMore: {
    marginTop: 10,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },

  // --- Empty / Loading States ---
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: height / 5,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    fontFamily: "Tsukimi-Rounded-Bold",
    fontWeight: "700"
  },
  retryButton: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#840386',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});