import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import Svg, { Defs, Mask, Rect, Circle, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { PillButton } from './PillButton';
import { Event } from '../../types';
import SpiralTop from "../../assets/event/SpiralTop.svg";
import SpiralBottom from "../../assets/event/SpiralBottom.svg";

interface EventCardProps {
  event: Event;
  index: number;
  onPress: (event: Event) => void;
  handleSave: (eventId: string) => void;
  onShowMenu: (event: Event) => void;
  saved: boolean;
  showTime: boolean;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export function EventCard({ event, index, onPress, handleSave, onShowMenu, saved, showTime }: EventCardProps) {
  const handlePress = () => onPress(event);
  const handleSavePress = () => handleSave(event.eventId);
  const handleShowMenuPress = () => onShowMenu(event);
  
  return (
    <View style={styles.container}>
      {showTime && (
        <Text style={styles.dateText}>
          {formatTime(event.startTime)}
        </Text>
      )}
      <View style={styles.cardContainer}>
        <View style={styles.backgroundCard} />
        
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.pressableContainer, 
            pressed && styles.pressed, 
          ]}
        >
          {/* SVG Masked Gradient replacing the standard LinearGradient */}
          <View style={[StyleSheet.absoluteFill]}>
            <Svg height="100%" width="100%">
              <Defs>
                <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#874186" stopOpacity="1" />
                  <Stop offset="1" stopColor="#56269F" stopOpacity="1" />
                </SvgGradient>
                <Mask id="holeMask">
                  <Rect width="100%" height="100%" fill="white" rx="16" />
                  {/* Black circle cuts the hole. Adjusted cx to align with buttonContainer */}
                  <Circle cx="96%" cy="16" r="7" fill="black" />
                </Mask>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#grad)" mask="url(#holeMask)" />
            </Svg>
          </View>

          {/* Original Padding and Layout */}
          <View style={styles.gradientBackground}>
            <View style={styles.header}>
              <Text numberOfLines={3} ellipsizeMode="tail" style={styles.title}>{event.name}</Text>
              
              <View style={styles.buttonContainer}>
                {/* Transparent placeholder for the hole */}
                <View style={{ height:2 }} />
                <PillButton
                  toggleSave={handleSavePress}
                  points={event.points || 0} 
                  isSaved={saved}
                />
              </View>
            </View>

            <Text style={styles.time}>
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </Text>

            {event.sponsor && <Text style={styles.secondaryText}>{event.sponsor}</Text>}
            
            {event.locations?.[0]?.description && (
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.location}>
                    {event.locations?.[0]?.description || 'TBA'}
                </Text>
            )}
            <View style={styles.buttonContainer}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.description}>
                  {event.description}
              </Text>
              {event.eventType === "MEAL" && (
                  <TouchableOpacity 
                    style={styles.menuButton} 
                    onPress={handleShowMenuPress}
                  >
                    <Text style={styles.menuButtonText}>Show Menu</Text>
                  </TouchableOpacity>
                )}
            </View>
          </View>
        </Pressable>
        <View style={styles.spiralTopContainer}>
           <SpiralTop width={90} height={40} />
        </View>
        <View style={styles.spiralBottomContainer}>
           <SpiralBottom width={400} height={55} />
        </View>      
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20 
  },
  cardContainer: {
    marginHorizontal: 14,
    marginVertical: 8,
    position: 'relative',
  },
  backgroundCard: {
    backgroundColor: '#F5C6FF', 
    borderRadius: 16,    
    position: 'absolute',
    left: 12, 
    right: -10,
    top: 4, 
    bottom: -4,
    transform: [{ rotate: '2deg' }], 
  },  
  pressableContainer: {
    flex: 1,
    borderRadius: 16,
    transform: [{ rotate: '-7deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 8,
    backgroundColor: 'transparent',
  }, 
  gradientBackground: {
    flex: 1, 
    borderRadius: 16, 
    padding: 18, 
  },  
  mainCard: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    padding: 16,
    zIndex: 1,      
    transform: [{ rotate: '-5deg' }],
  },  
  pressed: {
    opacity: 0.7, 
    transform: [
      { scale: 0.98 }, 
      { rotate: '-5deg' }, 
    ], 
  },  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', 
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800', 
    color: '#fffefeff',
    flex: 1, 
    marginRight: 10, 
  },
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 0,
  },
  saveButton: {
    padding: 4,
  },
  menuButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: 'transparent',
    borderColor: '#ffffffff',
    borderWidth: 1.5,
    marginTop: 10, 
    alignSelf: 'flex-end',
  },
  menuButtonText: {
    color: '#ffffffff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },  
  time: {
    fontSize: 17,
    fontWeight: '600', 
    color: '#ffffffff',
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  location: {
    marginTop: 5,
    fontSize: 14,
    color: '#ffffffff',
    fontWeight: '600'
  },
  description: {
    marginTop: 4,
    width: '100%',
    fontSize: 14,
    color: '#ffffffff',
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  dateDescription: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 20,
    color: '#ffffffff',
    textAlign: 'center',
    marginBottom: 25,
  },
  spiralTopContainer: {
    position: 'absolute',
    zIndex: 10,
    right: -34,  
    top: -50,    
    pointerEvents: 'none', 
    transform: [{rotate: '-20deg'}],
  },

  spiralBottomContainer: {
    position: 'absolute',
    zIndex: -1,
    right: -175,   
    top: -60,    
    pointerEvents: 'none',
    transform: [{rotate: '-20deg'}],
  },
});