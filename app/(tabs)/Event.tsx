import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Animated } from 'react-native'; 
import * as Haptics from 'expo-haptics';
import { useFonts, TsukimiRounded_700Bold } from '@expo-google-fonts/tsukimi-rounded';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useState, useMemo, useEffect, useRef } from 'react'; 
import { useEvents } from '../../lib/fetchEvents';
import { EventCard } from '../../components/eventScreen/EventCard';
import EventDetailModal from '../../components/eventScreen/EventDetailModal';
import MenuModal from '../../components/eventScreen/MenuModal';
import StarryBackground from '../../components/eventScreen/StarryBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event } from '../../types';

export default function EventScreen() {
  const insets = useSafeAreaInsets();
  
  // 1. Create the Scroll Value Tracker
  const scrollY = useRef(new Animated.Value(0)).current;

  const { events = [], loading, error, refetch } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSave, setSaveValue] = useState<boolean>(false);
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [selectedEventForMenu, setSelectedEventForMenu] = useState<Event | null>(null);
  const [fontsLoaded] = useFonts({TsukimiRounded_700Bold});

  useEffect(() => {
    const loadSavedEvents = async () => {
      try {
        const stored = await AsyncStorage.getItem('savedEvents');
        if (stored) {
          setSavedEventIds(new Set(JSON.parse(stored)));
        }
      } catch (e) {
        console.error('Failed to load saved events', e);
      }
    };

    loadSavedEvents();
  }, []);

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
  const uniqueDays = (() => {
    if (!events.length) return [];
    const dateMap = new Map<string, Date>();
    events.forEach(event => {
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

  const hasInitialSelection = useRef(false);

  useEffect(() => {
    if (!hasInitialSelection.current && uniqueDays.length > 0) {
      const todayEntry = uniqueDays.find(day => isToday(day.date));
      
      if (todayEntry) {
        setSelectedDay(todayEntry.id);
      }
      
      hasInitialSelection.current = true;
    }
  }, [uniqueDays]);

  const sectionTitleText = useMemo(() => {
    if (!selectedDay) {
      return selectedSave ? "Saved events" : "All events";
    }

    const dayDate = new Date(selectedDay);
    const isCurrentDay = new Date().toDateString() === selectedDay;
    
    const dayPrefix = isCurrentDay 
      ? "Today's" 
      : dayDate.toLocaleDateString('en-US', { weekday: 'long' }) + "'s";

    return `${dayPrefix} ${selectedSave ? "saved events" : "events"}`;
  }, [selectedDay, selectedSave]);

  const filteredEvents = (() => {
    let data = events;
    if (selectedDay) {
      data = data.filter(event => new Date(event.startTime * 1000).toDateString() === selectedDay);
    }
    if (selectedSave) {
      data = data.filter(event => savedEventIds.has(event.eventId));
    }
    return data.sort((a, b) => a.startTime - b.startTime);
  })();

  const handleDayPress = (dayId: string) => {
    setSelectedDay(selectedDay === dayId ? null : dayId);
  };

  const handleSave = async (eventId: string) => {
    setSavedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      
      AsyncStorage.setItem(
        'savedEvents',
        JSON.stringify(Array.from(next))
      ).catch(e => console.error('Failed to save events', e));

      return next;
    });
  };

  const currentEvent = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return events.find(event => now >= event.startTime && now < event.endTime);
  }, [events]);

  const renderEvent = ({ item, index }: { item: Event; index: number }) => {
    const previousItem = filteredEvents[index - 1];
    const showTime = index === 0 || previousItem?.startTime !== item.startTime;

    return (
      <EventCard
        event={item}
        index={index}
        onPress={handleEventPress}
        handleSave={handleSave}
        onShowMenu={handleShowMenu}
        saved={savedEventIds.has(item.eventId)}
        showTime={showTime} // <--- Pass this new prop
      />
    );
  };

  const renderContent = () => {
    if (loading && events.length === 0 && !isRefreshing) {
      return (
        <View style={[styles.emptyContainer, { marginTop: 100 }]}>
          <ActivityIndicator color="#6100a2" size="large" />
          <Text style={styles.emptyText}>Loading Events...</Text>
        </View>
      );
    }

    if(isRefreshing) {
      return (
        <View style={[styles.emptyContainer, { marginTop: 100 }]}>
          <ActivityIndicator color="#7229a3" size="large" />
          <Text style={styles.emptyText}>Refreshing...</Text>
        </View>
      );
    }

    if (error && !isRefreshing) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Error fetching events: {error}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredEvents.length === 0 && !loading) {
        return (
          <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No events scheduled {selectedDay !== null ? 'for this day' : ''}.
              </Text>
          </View>
        );
    }

    // 2. Use Animated.FlatList and attach the onScroll event
    return (
      <Animated.FlatList
        data={[...filteredEvents].sort((a, b) => a.startTime - b.startTime)}
        renderItem={renderEvent}
        keyExtractor={(item) => item.eventId || item.name + item.startTime}
        contentContainerStyle={styles.listContent}
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
            colors={["#00f0ff", "#ff00ff"]}
            progressBackgroundColor="#1a1a1a"
          />
        }
      />
    );
  };

  return (
    // 3. Pass scrollY to the Background
    <StarryBackground scrollY={scrollY}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        
        <View style={[styles.header, { marginLeft: insets.left + 20, backgroundColor: 'transparent', marginBottom: 0 }]}>
          <Text style={styles.title}>Schedule</Text>
        </View>

        {uniqueDays.length > 0 && (
          <View style={[styles.tabs, { padding: 0, paddingHorizontal: 30, marginBottom: 10 }]}>
            {uniqueDays.map((day) => (
              <TouchableOpacity
                key={day.id} 
                style={[
                  styles.dayButton,
                  (selectedDay === day.id) && { backgroundColor: "#7551D1" } 
                ]} 
                onPress={() => handleDayPress(day.id)}
              >
                <Text style={[styles.dayButtonText, (selectedDay === day.id) && { color: "#ffffff" }]}>
                  {isToday(day.date) ? 'Today' : day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingHorizontal: 30, 
          marginBottom: 15, 
          marginTop: 10 
        }}>
          <Text style={styles.sectionTitle}>
            {sectionTitleText}
          </Text>

          <TouchableOpacity 
            onPress={() => setSaveValue(!selectedSave)} 
            style={styles.reminderButton}
          >
            <Text style={styles.reminderButtonText}>
              {selectedSave ? "Close" : "Saved"}
            </Text>
          </TouchableOpacity>
        </View>

        {renderContent()}

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
      </View>
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    padding: 20
  },
  title: {
    fontFamily: 'TsukimiRounded_700Bold',
    fontSize: 35,
    color: '#D0F5FF',
    textShadowColor: 'rgba(243, 74, 255, 0.6)', 
    textShadowOffset: { width: 0, height: 0 },    
    textShadowRadius: 15, 
    letterSpacing: 5,
    textTransform: 'uppercase',
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
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
  sectionTitle: {
    color: 'white',
    fontSize: 18, 
    fontWeight: 'bold',
    fontFamily: 'Montserrat', 
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
  dayButtonText: {
    color: '#fff', 
    fontWeight: '600',
    textAlign: 'center',
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
});