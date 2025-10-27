import { Image, View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState, useMemo } from 'react';
import { useEvents } from '../../lib/fetchEvents';
import { EventCard } from '../../components/eventScreen/EventCard';
import EventDetailModal from '../../components/eventScreen/EventDetailModal';
import { Event } from '../../types';

export default function EventScreen() {
  const { events = [], loading, error, refetch } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSave, setSaveValue] = useState<boolean>(false);
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  // Get unique dates from events and create day buttons dynamically
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

    // Sort dates chronologically
    return Array.from(dateMap.entries())
      .sort(([, dateA], [, dateB]) => dateA.getTime() - dateB.getTime())
      .map(([dateKey, date]) => ({
        id: dateKey,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date,
        image: require("../../assets/event/planet.png")
      }));
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
    // Toggle: if same day is pressed, show all events
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

  const renderEvent = ({ item, index }: { item: Event; index: number }) => (
    <EventCard
      event={item}
      index={index}
      onPress={handleEventPress}
      handleSave={handleSave}
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setSaveValue(false)}>
            <Text style={[styles.text, !selectedSave && styles.activeText]}>SCHEDULE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 25 }} onPress={() => setSaveValue(true)}>
            <Text style={[styles.text, selectedSave && styles.activeText]}>SAVED</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Day filter buttons - dynamically generated from events */}
      {uniqueDays.length > 0 && (
        <View style={[styles.tabs, {padding: 0}]}>
          {uniqueDays.map((day) => (
            <Pressable 
              key={day.id} 
              onPress={() => handleDayPress(day.id)}
              style={styles.dayButtonContainer}
            >
              <Image 
                style={[
                  styles.eventDay,
                  selectedDay === day.id && styles.selectedEventDay
                ]} 
                source={day.image} 
              />
              <Text style={[
                styles.dayLabel,
                selectedDay === day.id && styles.selectedDayLabel
              ]}>
                {day.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <SafeAreaView style={styles.background}>
        {renderContent()}
        <EventDetailModal visible={modalVisible} event={selectedEvent} onClose={() => setModalVisible(false)} />
        
      </SafeAreaView> 
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 30,
    paddingHorizontal: 30,
    paddingBottom: 250
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    opacity: 0.6,
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
    paddingBottom: 10,
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