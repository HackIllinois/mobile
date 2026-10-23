import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, TouchableOpacity, Image } from 'react-native';
import { Event } from '../../types';
import SavedIcon from '../../assets/event/Saved.svg';
import UnsavedIcon from '../../assets/event/Unsaved.svg';

const RegularEventCard = require('../../assets/event/EventCard.png');
const ExpiredEvent = require('../../assets/event/ExpiredEventCard.png');
const ActiveEvent = require('../../assets/event/ActiveEventCard.png');


// --- SIZING LOGIC ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. Define the width based on device screen (with margins)
const CARD_MARGIN = 20;
const CARD_WIDTH = Math.min(SCREEN_WIDTH - (CARD_MARGIN * 2), 450); // Cap at 450px for readability

// 2. Define a fixed height so ALL cards are exactly the same size.
//    200px is usually a good "ticket" height for Title + Pills + Time + Loc
const CARD_HEIGHT = 200; 

interface EventCardProps {
  event: Event;
  onPress: (event: Event) => void;
  handleSave: (eventId: string) => void;
  saved: boolean;
  onShowMenu: (event: Event) => void;
  hideSave?: boolean;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export function EventCard({ event, onPress, handleSave, saved, onShowMenu, hideSave = false }: EventCardProps) {
  const DEBUG_MODE = false;
  const now = DEBUG_MODE
  ? new Date(2026, 1, 28, 19, 0, 0).getTime()  // Feb 28, 7:00 PM (month 1 = February)
  : Date.now();

  const startTimeMs = event.startTime * 1000;
  const endTimeMs = event.endTime * 1000;

  const expired = endTimeMs < now;
  const active = !expired && startTimeMs <= now;
  let CardBackground = RegularEventCard;
  if (expired) {
    CardBackground = ExpiredEvent;
  } else if (active) {
    CardBackground = ActiveEvent;
  }

  return (
    <View style={styles.outerContainer}>

      {/* Main Card Wrapper (Fixed Size) */}
      <Pressable
        onPress={() => onPress(event)}
        style={({ pressed }) => [
          styles.cardWrapper,
          pressed && styles.pressed
        ]}
      >
        <Image
          source={CardBackground}
          style={{
            width: "100%",
            height: "100%"
          }}
          resizeMode = "stretch"
        />

        {/* B. Content Overlay (Absolute positioning over SVG) */}
        <View style={styles.contentOverlay}>

          <View>
            {/* Title */}
            <Text
              key={event.eventId}
              numberOfLines={2}
              ellipsizeMode="tail"
              style={styles.title}
            >
              {event.name}
            </Text>

            {/* Pill Row */}
            <View style={styles.pillRow}>
               <View style={styles.pillPoints}>
                 <Text style={styles.pillTextBlack}>{event.points || 0}pts</Text>
               </View>
               {event.eventType === 'MEAL' ? (
                 <TouchableOpacity
                   style={styles.pillTrack}
                   onPress={() => onShowMenu(event)}
                   activeOpacity={0.6}
                   hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                 >
                   <Text style={styles.pillTextWhite}>Show Menu</Text>
                 </TouchableOpacity>
               ) : (
                 <View style={styles.pillTrack}>
                   <Text style={styles.pillTextWhite}>{event.eventType || 'General'}</Text>
                 </View>
               )}
            </View>
          </View>

          <View style={styles.bottomInfo}>
            {/* Time Info */}
            <Text style={styles.timeText}>
               {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </Text>

            {/* Location */}
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.locationText}
            >
               {event.locations?.[0]?.description || 'Siebel 1st Floor'}
            </Text>
          </View>

        </View>

        {/* Shifts should not show save button */}
        {!hideSave && (
          <Pressable
            style={styles.saveButton}
            onPress={() => handleSave(event.eventId)}
            hitSlop={10}
            >
            {saved? (
              <SavedIcon width={24} height={30} />
            ) : (
              <UnsavedIcon width={24} height={30} />
            )}
          </Pressable>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  // The Card itself
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'relative', // Context for absolute children
  },
  // The save buttons
  saveButton: {
    position: "absolute",
    top: 24,
    zIndex:3,
    width:44,
    right: 10,
    height:44,
    justifyContent: "center",
    alignItems: "center",
  },
  
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },

  contentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24, // Inner padding
    paddingVertical: 20,
    justifyContent: 'flex-start',
  },

  // -- Typography --
  title: {
    fontFamily: "Montserrat-Bold-700",
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    maxWidth: '75%',
  },
  
  // -- Pills --
  pillRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  pillPoints: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  pillTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  pillTextBlack: { color: '#000', fontWeight: '800', fontSize: 13 },
  pillTextWhite: { color: '#FFF', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },

  // -- Info --
  bottomInfo: {
    marginTop: 10,
  },
  timeText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
    maxWidth: 300
  },
});
