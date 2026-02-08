import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFonts, TsukimiRounded_700Bold } from '@expo-google-fonts/tsukimi-rounded';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { useEvents } from '../../lib/fetchEvents';
import { useSavedEvents } from '../../lib/fetchSavedEvents';
import { EventCard } from '../../components/eventScreen/EventCard';
import EventDetailModal from '../../components/eventScreen/EventDetailModal';
import MentorDetailModal from '../../components/eventScreen/MentorDetailModal';
import MenuModal from '../../components/eventScreen/MenuModal';
import StarryBackground from '../../components/eventScreen/StarryBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event } from '../../types';
import Moon from "../../assets/event/Moon.svg"
import Sun from "../../assets/event/Sun.svg"

type ScheduleMode = 'events' | 'mentorship';

type MentorshipSession = {
  id: string;
  mentorName: string;
  track: string;
  startTime: number; // unix seconds
  endTime: number; // unix seconds
  location: string;

  // extra info for modal
  bio: string;
  topics: string[];
  contact: string;
};

export default function EventScreen() {
  const insets = useSafeAreaInsets();
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('events');

  // 1. Create the Scroll Value Tracker
  const scrollY = useRef(new Animated.Value(0)).current;

  const { events = [], loading, error, refetch } = useEvents();
  const { savedEventIds: savedEventIdsList, refetch: refetchSavedEvents } = useSavedEvents();
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSave, setSaveValue] = useState<boolean>(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [selectedEventForMenu, setSelectedEventForMenu] = useState<Event | null>(null);
  const [fontsLoaded] = useFonts({ TsukimiRounded_700Bold });

  // mentorship modal state
  const [selectedMentorSession, setSelectedMentorSession] = useState<MentorshipSession | null>(null);
  const [mentorModalVisible, setMentorModalVisible] = useState(false);

  // Sync saved events from TanStack Query cache into local Set state
  useEffect(() => {
    setSavedEventIds(new Set(savedEventIdsList));
  }, [savedEventIdsList]);

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleShowMenu = (event: Event) => {
    setSelectedEventForMenu(event);
    setMenuModalVisible(true);
  };

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const eventDays = (() => {
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
  })();

  const unixOnDay = (day: Date, hour: number, minute: number) => {
    const d = new Date(day);
    d.setHours(hour, minute, 0, 0);
    return Math.floor(d.getTime() / 1000);
  };

  // dummy mentorship sessions: 1 per day (Fri/Sat/Sun)
  const mentorshipSessions: MentorshipSession[] = useMemo(() => {
    const day0 = eventDays[0]?.date ?? new Date();
    const day1 = eventDays[1]?.date ?? new Date();
    const day2 = eventDays[2]?.date ?? new Date();

    const s1Start = unixOnDay(day0, 10, 0);
    const s1End = unixOnDay(day0, 11, 0);

    const s2Start = unixOnDay(day1, 14, 0);
    const s2End = unixOnDay(day1, 15, 0);

    const s3Start = unixOnDay(day2, 12, 0);
    const s3End = unixOnDay(day2, 13, 0);

    return [
      {
        id: 'mentor-fri-lucy',
        mentorName: 'Lucy Wu',
        track: 'Software Engineering',
        startTime: s1Start,
        endTime: s1End,
        location: 'Siebel 1st Floor',
        bio: 'Hack Codirector',
        topics: ['Uncalled for comments'],
        contact: '@lucywu',
      },
      {
        id: 'mentor-sat-kyle',
        mentorName: 'Rachel Madamba',
        track: 'Design',
        startTime: s2Start,
        endTime: s2End,
        location: 'Siebel 1st Floor',
        bio: 'Hack Design Co-Lead',
        topics: ['UX', 'UI polish', 'Figma'],
        contact: '@rachelmadamba',
      },
      {
        id: 'mentor-sun-sam',
        mentorName: 'Yash Jagtap',
        track: 'Hardware',
        startTime: s3Start,
        endTime: s3End,
        location: 'Siebel 1st Floor',
        bio: 'Stray Kids superfan',
        topics: ['Pming', 'Frank Ocean'],
        contact: '@yashjagtap',
      },
    ];
  }, [eventDays]);

  const hasInitialSelection = useRef(false);

  useEffect(() => {
    if (!hasInitialSelection.current && eventDays.length > 0) {
      const todayEntry = eventDays.find((day) => isToday(day.date));

      if (todayEntry) {
        setSelectedDay(todayEntry.id);
      }

      hasInitialSelection.current = true;
    }
  }, [eventDays]);

  // minimal switching: pick the list based on mode 
  const activeItems = useMemo(() => {
    return scheduleMode === 'events' ? events : mentorshipSessions;
  }, [scheduleMode, events, mentorshipSessions]);

  const sectionTitleText = useMemo(() => {
    const isMentors = scheduleMode === 'mentorship';

    if (!selectedDay) {
      return isMentors ? 'All Mentors' : 'All Events';
    }

    const dayDate = new Date(selectedDay);
    const isCurrentDay = new Date().toDateString() === selectedDay;

    const dayPrefix = isCurrentDay ? "Today's" : dayDate.toLocaleDateString('en-US', { weekday: 'long' }) + "'s";

    if (isMentors) return `${dayPrefix} mentors`;
    return `${dayPrefix} ${selectedSave ? 'Saved Events' : 'Events'}`;
  }, [selectedDay, selectedSave, scheduleMode]);

  const filteredItems = (() => {
    let data: any[] = activeItems as any[];

    if (selectedDay) {
      data = data.filter((item) => new Date(item.startTime * 1000).toDateString() === selectedDay);
    }

    if (scheduleMode === 'events' && selectedSave) {
      data = (data as Event[]).filter((event) => savedEventIds.has(event.eventId));
    }

    return data.sort((a, b) => a.startTime - b.startTime);
  })();

  const handleDayPress = (dayId: string) => {
    setSelectedDay(selectedDay === dayId ? null : dayId);
  };

  const handleSave = async (eventId: string) => {
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

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateShort = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // minimal: keep same "renderEvent" name, but render either an EventCard or clickable Mentor card
  const renderEvent = ({ item, index }: { item: any; index: number }) => {
    const previousItem = filteredItems[index - 1];
    const showTime = index === 0 || previousItem?.startTime !== item.startTime;
    const showDateSeparator = index > 0 && 
      new Date(item.startTime * 1000).toDateString() !== 
      new Date(previousItem.startTime * 1000).toDateString();
    const showDateEverywhere = selectedDay === null; // "main page" (no specific day selected)
    const timeHeaderText = showDateEverywhere
      ? `${formatTime(item.startTime)}`
      : formatTime(item.startTime);

    if (scheduleMode === 'events') {
      const ev = item as Event;

      return (
        <View style={{ marginBottom: 40 }}>
          {showDateSeparator && <View style={styles.daySeparator} />}
          {showTime && <Text style={styles.timeHeader}>{timeHeaderText}</Text>}

          {/* date on each card when no specific day selected */}
          {showDateEverywhere && (
            <Text style={styles.cardDateLabel}>{formatDateShort(ev.startTime)}</Text>
          )}

          <EventCard
            event={ev}
            index={index}
            onPress={handleEventPress}
            handleSave={handleSave}
            onShowMenu={handleShowMenu}
            saved={savedEventIds.has(ev.eventId)}
            showTime={false} // we render the time header here so we can append the date
          />
        </View>
      );
    }

    const m = item as MentorshipSession;
    return (
      <EventCard
        event={item}
        index={index}
        onPress={handleEventPress}
        handleSave={handleSave}
        onShowMenu={handleShowMenu}
        saved={savedEventIds.has(item.eventId)}
        showTime={showTime}
      />
    );
  };

  const renderContent = () => {
    const isMentors = scheduleMode === 'mentorship';

    if (loading && scheduleMode === 'events' && events.length === 0 && !isRefreshing) {
      return (
        <View style={[styles.emptyContainer, { marginTop: 100 }]}>
          <ActivityIndicator color="#6100a2" size="large" />
          <Text style={styles.emptyText}>Loading Events...</Text>
        </View>
      );
    }

    if (isRefreshing) {
      return (
        <View style={[styles.emptyContainer, { marginTop: 100 }]}>
          <ActivityIndicator color="#7229a3" size="large" />
          <Text style={styles.emptyText}>Refreshing...</Text>
        </View>
      );
    }

    if (error && !isRefreshing && scheduleMode === 'events') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Error fetching events: {error}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredItems.length === 0 && !loading) {
        return (
          <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedSave ? "No saved events found" : "No events scheduled " + (selectedDay !== null ? 'for this day' : '')}
              </Text>
          </View>
        );
    }

    return (
      <Animated.FlatList
        data={[...filteredItems].sort((a, b) => a.startTime - b.startTime)}
        renderItem={renderEvent}
        keyExtractor={(item: any) => item.eventId || item.id || item.name + item.startTime}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#00f0ff"
            colors={['#00f0ff', '#ff00ff']}
            progressBackgroundColor="#1a1a1a"
          />
        }
      />
    );
  };

  return (
    <StarryBackground scrollY={scrollY}>
      <View style={[styles.container, { paddingTop: insets.top + 55 }]}>
        {eventDays.length > 0 && (
          <View style={styles.daysContainer}>
            <View style={[styles.tabs, { paddingHorizontal: 30, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' }]}>
              {eventDays.map((day) => {
                const isSelected = selectedDay === day.id;
                const isTodayDate = isToday(day.date);

                return (
                  <View key={day.id} style={styles.dayWrapper}>
                    {/* Background Layer: The Large SVG */}
                    <View style={styles.svgBackground}>
                      {isSelected ? (
                        <Sun width={90} height={90} style={{marginBottom: 0}}/> 
                      ) : (
                        <Moon width={80} height={80} />
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.dayButtonOverlay}
                      onPress={() => handleDayPress(day.id)}
                    >
                      <Text style={[
                        styles.dayButtonText, 
                        isSelected ? styles.selectedText : styles.unselectedText
                      ]}>
                        {isTodayDate ? 'Today' : day.label}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
            <Text style={styles.sectionTitle}>
              {sectionTitleText}
            </Text>
          </View>
        )}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 30,
            marginBottom: 15,
            marginTop: 10,
          }}
        >

          <View style={{ flexDirection: 'row', gap: 80 }}>
            <TouchableOpacity
              onPress={() => {
                setScheduleMode((prev) => (prev === 'events' ? 'mentorship' : 'events'));
                setSaveValue(false);
              }}
              style={[styles.reminderButton, styles.mentorshipButton]}
            >
              <Text style={styles.reminderButtonText}>
                {scheduleMode === 'events' ? 'Mentorship Schedule' : 'Events Schedule'}
              </Text>
            </TouchableOpacity>

            {scheduleMode === 'events' && (
              <TouchableOpacity onPress={() => setSaveValue(!selectedSave)} style={styles.reminderButton}>
                <Text style={styles.reminderButtonText}>{selectedSave ? 'Close' : 'Saved'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {renderContent()}

        {scheduleMode === 'events' && selectedEvent && (
          <EventDetailModal
            visible={modalVisible}
            event={selectedEvent}
            onClose={() => setModalVisible(false)}
            handleSave={handleSave}
            saved={savedEventIds.has(selectedEvent.eventId)}
          />
        )}

        {scheduleMode === 'events' && (
          <MenuModal visible={menuModalVisible} event={selectedEventForMenu} onClose={() => setMenuModalVisible(false)} />
        )}

        {/* mentorship modal */}
        {scheduleMode === 'mentorship' && (
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 13,
    padding: 20,
  },

  title: {
    fontFamily: 'TsukimiRounded_700Bold',
    fontSize: 35,
    color: '#D0F5FF',
    textShadowColor: 'rgba(243, 74, 255, 0.6)', 
    textShadowOffset: { width: 0, height: 0 },    
    textShadowRadius: 15, 
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  daysContainer: {
    justifyContent: 'center',
  },

  text: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  daySeparator: {
    height: 9,
    backgroundColor: 'rgba(255, 0, 191, 0.82)',
    marginBottom: 50, 
    marginTop: 10, 
    borderRadius: 4,

  },

  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: 'transparent',
    borderColor: '#fff',
    borderWidth: 1.5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },

  dayButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  sectionTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'TsukimiRounded_700Bold',
    marginBottom: 10, 
    marginTop: -12,     
    letterSpacing: 0.2,
    alignSelf: 'center'
  },

  reminderButton: {
    backgroundColor: '#E0E0FF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 30,
  },

  reminderButtonText: {
    color: '#050211',
    fontWeight: 'bold',
    fontSize: 14,
  },

  listContent: {
    paddingTop: 10,
    paddingBottom: 120,
    width: '100%',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  emptyText: {
    fontFamily: 'TsukimiRounded_700Bold',
    color: '#D0F5FF',
    fontSize: 22,
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

  // NEW: time header for events (and also used to add date next to time)
  timeHeader: {
    fontSize: 20,
    color: '#ffffffff',
    textAlign: 'center',
    marginBottom: 10,
  },

  // NEW: small date label above each card when no day is selected
  cardDateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 8,
  },

  // mentorship card styles
  mentorTimeHeader: {
    fontSize: 20,
    color: '#ffffffff',
    textAlign: 'center',
    marginBottom: 10, // was 25
  },

  mentorCard: {
    marginHorizontal: 16,
    marginVertical: 8,
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
    gap: 10,
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

  mentorshipButton: {
    paddingHorizontal: 14, // was 16
    paddingVertical: 14, // was 14
  },

  // modal styles (kept self-contained here)
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCardWrapper: {
    width: '85%',
    height: '70%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackgroundCard: {
    position: 'absolute',
    width: '100%',
    height: '90%',
    backgroundColor: '#F5C6FF',
    borderRadius: 20,
    transform: [{ rotate: '173deg' }],
  },
  modalMainCard: {
    width: '100%',
    height: '80%',
    backgroundColor: '#D9D9D9',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalCloseButton: { paddingBottom: 10 },
  modalCloseText: { fontSize: 20, fontWeight: 'bold', color: '#000', opacity: 0.5 },
  modalTitle: { fontSize: 28, fontWeight: '800', color: '#000', marginBottom: 8 },
  modalPillRow: { flexDirection: 'row', marginBottom: 12, marginTop: 4 },
  modalTrackPill: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#eddbff',
  },
  modalTrackText: { fontSize: 12, fontWeight: '900', color: '#222' },
  modalInfoText: { fontSize: 20, fontWeight: '600', color: '#000', marginBottom: 2 },
  modalSectionHeader: { marginTop: 14, fontSize: 16, fontWeight: '900', color: '#333' },
  modalBodyText: { marginTop: 6, fontSize: 14, color: '#333', lineHeight: 20 },
  modalTopicsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  modalTopicChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalTopicChipText: { fontSize: 12, fontWeight: '800', color: '#333' },
  dayWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // Key for absolute children
  },
  svgBackground: {
    position: 'absolute',
    zIndex: 1, // Sits behind the text
  },
  dayButtonOverlay: {
    zIndex: 2, // Sits on top to capture touches
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  selectedText: {
    color: '#ffffff',
  },
  unselectedText: {
    color: '#444444', 
  },
});
