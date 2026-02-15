import React from 'react';
import { 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Image, 
  ScrollView, 
  View, 
  Pressable, 
  Dimensions 
} from 'react-native';
import { Event } from '../../types';
import { PillButton } from './PillButton';

interface FullScreenModalProps {
  visible: boolean;
  event: Event;
  onClose: () => void;
  handleSave: (eventId: string) => void;
  saved: boolean;
}

// Formatting helper
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export default function EventDetailModal({ visible, event, onClose, handleSave, saved }: FullScreenModalProps) {
  if (!event) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        
        {/* WRAPPER: Max Width prevents stretching on iPad */}
        <View style={styles.cardWrapper}>
          
          {/* Sakura Pink Background (Rotated Shade) */}
          <View style={styles.backgroundCard} />

          {/* Main Content Card */}
          <View style={styles.mainCard}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}> 
              <View style={styles.headerSection}>
                  <Text style={styles.title}>{event.name}</Text>
                  
                  <View style={styles.pillWrapper}>
                    <PillButton
                      toggleSave={() => handleSave(event.eventId)}
                      points={event.points || 0} 
                      isSaved={saved}
                    />
                  </View>

                  <Text style={styles.infoText}>
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </Text>
                  <Text style={styles.infoText}>
                      {event.locations[0]?.description || 'Siebel 1st Floor'}
                  </Text>

                  <Text style={styles.descriptionLabel}>
                        {event.description}
                  </Text>
              </View>

              {/* Simple Map Image (No Zoom) */}
              {event.mapImageUrl && (
                <View style={styles.mapContainer}>
                  <Image
                      source={{ uri: event.mapImageUrl }}
                      style={styles.mapImage}
                      resizeMode="contain"
                  />
                </View>
              )}
            </ScrollView>
          </View>

          {/* Paperclip: Anchored to corner */}
          <View style={styles.paperclipContainer}>
                <Image
                  source={require('../../assets/event/paperclip.png')}
                  style={styles.paperclipImage}
                  resizeMode="contain"
              />
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  
  // -- Main Layout Container --
  cardWrapper: {
    width: '85%',
    height: '70%',
    // IPAD FIX: Limit max width so it stays phone-shaped and keeps design ratios
    maxWidth: 400, 
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // -- Background (The Shade) --
  backgroundCard: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFB7C5', // Sakura Pink
    borderRadius: 20,
    // Constant rotation creates the triangular corners
    transform: [{ rotate: '4deg' }], 
  },

  // -- Main Content --
  mainCard: {
    width: '100%',
    height: '100%', 
    backgroundColor: '#D9D9D9',
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 2, 
  },

  // -- Paperclip Logic --
  paperclipContainer: {
    position: 'absolute',
    top: 50,  
    right: -35, 
    zIndex: 10,
  },
  paperclipImage: {
    width: 50,   
    height: 90,  
    transform: [{ rotate: '-5deg' }], 
  },

  // -- Content Styles --
  closeButton: {
    paddingBottom: 10,
    alignSelf: 'flex-end',
  },
  closeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    opacity: 0.5
  },
  headerSection: {
    marginBottom: 15,
    marginTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  pillWrapper: {
    marginBottom: 12,     
    marginTop: 4,         
    alignSelf: 'flex-start', 
  },
  infoText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  descriptionLabel: {
    marginTop: 15,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  mapContainer: {
    marginTop: 15,
    width: '100%',
    height: 200,
    borderRadius: 12,    
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
});