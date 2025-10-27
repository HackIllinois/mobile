import { View, Text, StyleSheet, Pressable, Image, TouchableOpacity } from 'react-native';
import { Event } from '../../types';

interface EventCardProps {
  event: Event;
  index: number;
  onPress: (event: Event) => void;
  handleSave: (eventId: string) => void;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

export function EventCard({ event, index, onPress, handleSave }: EventCardProps) {
  const handlePress = () => onPress(event);
  const handleSavePress = () => handleSave(event.eventId);
  {/*When actual design is sent out create actual press animations*/}
  return (
    
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed, 
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{event.name}</Text>
        <TouchableOpacity onPress={handleSavePress}>
          {/* Once png is converted to svg we can add fill to red on click */}
          <Image style={styles.date} source={require('../../assets/event/Bookmark.png')}/>
        </TouchableOpacity>
      </View>
      <Text style={styles.time}>
        {formatTime(event.startTime)} - {formatTime(event.endTime)}
      </Text>

      {event.sponsor && <Text style={styles.time}>{event.sponsor}</Text>}
      {event.locations[0]?.description && <Text numberOfLines={1} ellipsizeMode="tail" style={styles.location}>{event.locations[0]?.description || 'TBA'}</Text>}
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.description}>{event.description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  pressed: {
    opacity: 0.6, 
    transform: [{ scale: 0.97 }], 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    flexShrink: 1,
    flexWrap: 'wrap',
    width: 200
  },
  date: {
    tintColor: '#ff0000ff',
  },
  
  time: {
    fontSize: 14,
    color: '#444',
    marginBottom:0.2
  },
  location: {
    marginTop: 4,
    fontSize: 13,
    color: '#777',
  },
  description: {
    marginTop: 1,
    width: '100%',
  }
});
