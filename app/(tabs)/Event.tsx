import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState, useMemo } from 'react';
import { useEvents } from '../../lib/fetchEvents';
import { EventCard } from '../../components/eventScreen/EventCard';
import EventDetailModal from '../../components/eventScreen/EventDetailModal';
import MenuModal from '../../components/eventScreen/MenuModal';
import { Event } from '../../types';

export default function EventScreen() {
  const { events = [], loading, error, refetch } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSave, setSaveValue] = useState<boolean>(false);
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [selectedEventForMenu, setSelectedEventForMenu] = useState<Event | null>(null);

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleShowMenu = (event: Event) => {
    setSelectedEventForMenu(event);
    setMenuModalVisible(true);
  };

  const onRefresh = useCallback(async () => {
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
          image: require("../../assets/event/planet.png")
        };
      });
  })();


  // Filter events by selected day
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

  const handleSave = (eventId: string) => {
    setSavedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const currentEvent = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return events.find(event => now >= event.startTime && now < event.endTime);
  }, [events]);

  const renderEvent = ({ item, index }: { item: Event; index: number }) => (
    <EventCard
      event={item}
      index={index}
      onPress={handleEventPress}
      handleSave={handleSave}
      onShowMenu={handleShowMenu}
      saved={savedEventIds.has(item.eventId)}
    />
  );

  const renderContent = () => {
    if (loading && events.length === 0 && !isRefreshing) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color="#00f0ff" size="large" />
          <Text style={styles.emptyText}>Loading Events...</Text>
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

    return (
      <FlatList
        data={[...filteredEvents].sort((a, b) => a.startTime - b.startTime)}
        renderItem={renderEvent}
        keyExtractor={(item) => item.eventId || item.name + item.startTime}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
    
    <View style={[styles.header, { paddingHorizontal: 30, flexDirection: 'column', alignItems: 'flex-start' }]}>
      <Text style={[styles.text, {color: 'black'}]}>{currentEvent ? "Current Event:" : "No Events Running"}</Text>
      {
        currentEvent && (
          <Text style={[styles.text, {color: 'black'}]}>{currentEvent.name}</Text>
        )
      }
    </View>

    {uniqueDays.length > 0 && (
      <View style={[styles.tabs, { padding: 0, paddingHorizontal: 30, marginBottom: 10 }]}>
        {uniqueDays.map((day) => (
          <TouchableOpacity
            key={day.id} 
            style={[
              styles.dayButton,
              (selectedDay === day.id) && { backgroundColor: "#000000"}
            ]} 
            onPress={() => handleDayPress(day.id)}
          >
            <Text style={[styles.dayButtonText, (selectedDay === day.id) && { color: "white" }]}>{isToday(day.date) ? 'Today' : day.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
    <View style={{ padding: 0, paddingHorizontal: 30, marginBottom: 10, alignItems: 'flex-end' }}>
      <TouchableOpacity onPress={() => setSaveValue(!selectedSave)}>
        <Text style={[styles.text, {color: 'black', fontSize: 18, textAlign: 'right'}]}>{selectedSave ? "Close Reminders" : "Show Reminders"}</Text>
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

  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 20
  },
  text: {
    fontSize: 30,
    fontWeight: '800',
    fontFamily: 'Montserrat',
    color: '#fff',
  },
  activeText: {
    color: '#840386',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
  dayButtonContainer: {
    alignItems: 'stretch',
    opacity: 0.6,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: 'transparent',
    borderColor: '#000000',
    borderWidth: 1.5,
    marginTop: 10, 
    alignSelf: 'flex-start',
  },
  dayButtonText: {
    color: '#000000',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  eventDay: {
    width: 100,
    height: 100,
  },
  selectedEventDay: {
    opacity: 1,
    borderWidth: 3,
    borderColor: '#840386',
    borderRadius: 50,
  },
  dayLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  selectedDayLabel: {
    color: '#840386',
    fontWeight: '800',
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 120,
    width: '100%',
  },
  background: {
    padding: 5,
    backgroundColor: "#840386",
    borderRadius: 20
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
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