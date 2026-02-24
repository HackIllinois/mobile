import React, { useState } from 'react';
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
import Saved from "../../assets/event/Saved.svg";
import Unsaved from "../../assets/event/Unsaved.svg";


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
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);

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
            <View style={styles.buttonsContainer}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSave(event.eventId)} style={styles.saveButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  {saved ? <Saved height={45} /> : <Unsaved height={45} />}
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}> 
              
              <View style={styles.headerSection}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.title}>
                      {event.name}
                    </Text>
                    
                    <View style={[
                      styles.pillRow,
                      event.name === "Capital One Super Smash Bros Ultimate Tournament" && { marginTop: -28 }
                    ]}>
                      <View style={styles.pillPoints}>
                        <Text style={styles.pillTextBlack}>{event.points || 0}Pts</Text>
                      </View>
              
                      <View style={styles.pillTrack}>
                        <Text style={styles.pillTextWhite}>{event.eventType || 'General'}</Text>
                      </View>
                    </View>
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
                <TouchableOpacity 
                  style={styles.mapContainer} 
                  onPress={() => setIsMapFullScreen(true)}
                  activeOpacity={0.9}
                >
                  <Image
                      source={{ uri: event.mapImageUrl }}
                      style={styles.mapImage}
                      resizeMode="contain"
                  />
                  <View style={styles.expandOverlay}>
                    <Text style={styles.expandText}>Tap to enlarge</Text>
                  </View>
                </TouchableOpacity>
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

      {/* Full Screen Map Modal */}
      {event.mapImageUrl && (
        <Modal
          visible={isMapFullScreen}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setIsMapFullScreen(false)}
        >
          <View style={styles.fullScreenContainer}>
            <TouchableOpacity 
              style={styles.fullScreenCloseButton} 
              onPress={() => setIsMapFullScreen(false)}
            >
              <Text style={styles.fullScreenCloseText}>✕ Close</Text>
            </TouchableOpacity>
            
            <Image
              source={{ uri: event.mapImageUrl }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
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
    backgroundColor: '#e3e3e3',
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
    right: -32, 
    zIndex: 10,
  },
  paperclipImage: {
    width: 50,   
    height: 90,  
    transform: [{ rotate: '-10deg' }], 
  },

  // -- Content Styles --
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 40,
    zIndex: 10,
  },
  saveButton: {
    height: 50,
    minWidth: 50,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  closeButton: {
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  closeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    opacity: 0.5
  },
  headerSection: {
    marginBottom: 15,
  },
  titleContainer: {
    gap: 6,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    lineHeight: 30,
    includeFontPadding: false,
    flexShrink: 1,
  },
  pillWrapper: {
    marginBottom: 12,     
    alignSelf: 'flex-start', 
  },
  // -- Pills --
  pillRow: {
    flexDirection: 'row',
  },
  pillPoints: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  pillTrack: {
    backgroundColor: '#56269F',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  pillTextBlack: { color: '#000', fontWeight: '800', fontSize: 13 },
  pillTextWhite: { color: '#FFF', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
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
  expandOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  expandText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  fullScreenCloseText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});
