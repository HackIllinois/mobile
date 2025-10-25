import { Image, View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import { useEvents } from '../../lib/fetchEvents';
import { EventCard } from '../../components/eventScreen/EventCard';
import EventDetailModal from '../../components/eventScreen/EventDetailModal';
import { Event } from '../../types';

export default function EventScreen() {
  const { events = [], loading, error, refetch } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const renderEvent = ({ item, index }: { item: Event; index: number }) => (
    <EventCard
      event={item}
      index={index}
      onPress={handleEventPress}
    />
  );

  const renderContent = () => {
    if (loading && events.length === 0 && !isRefreshing) {
      return (
        <View>
          <ActivityIndicator />
          <Text>Loading Events...</Text>
        </View>
      );
    }

    if (error && !isRefreshing) {
      return (
        <View>
          <Text>Error fetching events: {error}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (events.length === 0 && !loading) {
        return (
            <View>
                <Text>No events scheduled.</Text>
            </View>
        );
    }

    return (
      <FlatList
        data={[...events].sort((a, b) => a.startTime - b.startTime)}
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
          <TouchableOpacity>
            <Text style={[styles.text, styles.activeText]}>SCHEDULE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 25 }}>
            <Text style={styles.text}>SAVED</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/*This will be where the dates go for hackillinois*/ }
      <View style={[styles.tabs, {padding: 0}]}>
        <Image style={styles.eventDay} source={require("../../assets/event/planet.png")} />
        <Image style={styles.eventDay} source={require("../../assets/event/planet.png")} />
        <Image style={styles.eventDay} source={require("../../assets/event/planet.png")} />
      </View>
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
    paddingBottom: 210
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
  eventDay: {
    width: 100,
    height: 100,
  },
  listContent: {
    paddingBottom: 10,
  },
  background: {
    padding: 5,
    backgroundColor: "#840386",
    borderRadius: 20
  }
});
