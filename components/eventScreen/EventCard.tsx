import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, TouchableOpacity } from 'react-native';
import { Event } from '../../types';
import UnsavedEvent from '../../assets/event/EventCard.svg';
import SavedEvent from '../../assets/event/SavedEventCard.svg';
import ExpiredEvent from '../../assets/event/ExpiredEventCard.svg';

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
  index: number;
  onPress: (event: Event) => void;
  handleSave: (eventId: string) => void;
  saved: boolean;
  showTime: boolean;
  onShowMenu: (event: Event) => void;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export function EventCard({ event, index, onPress, handleSave, saved, showTime, onShowMenu }: EventCardProps) {
  const expired = event.endTime * 1000 < Date.now();
  let CardBackground = UnsavedEvent;
  if (expired) {
    CardBackground = ExpiredEvent;
  } else if (saved) {
    CardBackground = SavedEvent;
  }

  const estimatedCharsPerLine = 20;
  
  // Hardcode specific title to always use 1 line
  // hello yaseen
  const isJohnDeereTitle = event.name === "John Deere Track Introduction";
  const isStripeTitle = event.name === "Stripe Track Introduction";
  const needsTwoLines = !isStripeTitle && !isJohnDeereTitle && event.name.length > estimatedCharsPerLine;

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
        {/* A. Background SVG (Stretches to fixed size) */}
        <View style={StyleSheet.absoluteFill}>
           <CardBackground 
              width="100%" 
              height="100%" 
              preserveAspectRatio="none" // Forces SVG to match our exact CARD_WIDTH/HEIGHT
           />
        </View>

        {/* B. Content Overlay (Absolute positioning over SVG) */}
        <View style={styles.contentOverlay}>
          
          {/* Title: Dynamic lines based on content length, with hardcoded exception */}
          <Text 
            numberOfLines={needsTwoLines ? 2 : 1} 
            ellipsizeMode="tail" 
            style={styles.title}
          >
            {event.name}
          </Text>

          {/* Pill Row */}
          <View style={styles.pillRow}>
             <View style={styles.pillPoints}>
               <Text style={styles.pillTextBlack}>{event.points || 0}Pt</Text>
             </View>
             {event.eventType === 'MEAL' ? (
               // If MEAL: Render a Button
               <TouchableOpacity 
                 style={styles.pillTrack}
                 onPress={() => onShowMenu(event)}
                 activeOpacity={0.6}
                 // Add hitSlop to make it easier to tap without opening the card
                 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
               >
                 <Text style={styles.pillTextWhite}>Show Menu</Text>
               </TouchableOpacity>
             ) : (
               // If NOT Meal: Render static Label
               <View style={styles.pillTrack}>
                 <Text style={styles.pillTextWhite}>{event.eventType || 'General'}</Text>
               </View>
             )}
          </View>

          {/* Time Info */}
          <Text style={styles.timeText}>
             {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </Text>
          
          {/* Location: Max 1 line, then ... */}
          <Text 
            numberOfLines={1} 
            ellipsizeMode="tail" 
            style={styles.locationText}
          >
             {event.locations?.[0]?.description || 'Siebel 1st Floor'}
          </Text>

        </View>

        {/* C. Save Button Hit Area */}
        <Pressable 
           style={styles.saveHitArea}
           onPress={() => handleSave(event.eventId)}
        />

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
  timeHeader: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    opacity: 0.9
  },
  
  // The Card itself
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'relative', // Context for absolute children
    
    // Optional: Drop shadow for the whole card
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 6,
  },
  
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },

  contentOverlay: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
    justifyContent: 'flex-start',
  },

  // -- Typography --
  title: {
    fontFamily: "Montserrat-Bold-700",
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 26, // Consistent line height
    maxWidth: 230,
  },
  
  // -- Pills --
  pillRow: {
    flexDirection: 'row',
    marginBottom: 12,
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
  timeText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
    maxWidth: 300
  },

  // -- Hit Areas --
  saveHitArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: CARD_WIDTH/5, // Generous hit box
    height: CARD_WIDTH/3.8,
  },
});
