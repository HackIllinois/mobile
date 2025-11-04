import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import NotSaved from "../../assets/event/NotSaved.svg"
import Saved from "../../assets/event/Saved.svg"
import { Event } from '../../types';

interface EventCardProps {
  event: Event;
  index: number;
  onPress: (event: Event) => void;
  handleSave: (eventId: string) => void;
  saved: boolean;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

export function EventCard({ event, index, onPress, handleSave, saved }: EventCardProps) {
  const handlePress = () => onPress(event);
  const handleSavePress = () => {
    handleSave(event.eventId);
  }
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
            {saved ? (
              <Saved width={22} height={22} />
            ) : (
              <NotSaved width={22} height={22} />
            )}
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
