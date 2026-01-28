import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PillButton } from './PillButton';
import { Event } from '../../types';

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
          <LinearGradient
            colors={['#874186ff',   '#56269F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground} 
          >
          <View style={styles.header}>
            <Text numberOfLines={3} ellipsizeMode="tail" style={styles.title}>{event.name}</Text>
            
            <View style={styles.buttonContainer}>
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
          </LinearGradient>
        </Pressable>      
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20 
  },
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative',
  },
  backgroundCard: {
    backgroundColor: '#F5C6FF', 
    borderRadius: 16,    
    position: 'absolute',
    left: 4, 
    right: -4,
    top: 4, 
    bottom: -4,
    transform: [{ rotate: '3deg' }], 
  },  
  pressableContainer: {
    flex: 1,
    borderRadius: 16,
    transform: [{ rotate: '-3deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 8,
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
    marginHorizontal: 0,
    marginVertical: 0,     
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
});
