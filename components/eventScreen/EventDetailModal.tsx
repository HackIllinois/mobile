import { Text, StyleSheet, TouchableOpacity, Modal, Image, ScrollView, View, Pressable } from 'react-native';
import { Event } from '../../types';
import { PillButton } from './PillButton';

interface FullScreenModalProps {
  visible: boolean;
  event: Event;
  onClose: () => void;
  handleSave: (eventId: string) => void;
  saved: boolean;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export default function FullScreenModal({ visible, event, onClose, handleSave, saved }: FullScreenModalProps) {
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
        
        <View style={styles.cardWrapper}>
            
            <View style={styles.backgroundCard} />

            <View style={styles.mainCard}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
              <ScrollView showsVerticalScrollIndicator={false}> 
                

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
                         please install the Hackillinois mobile app
                    </Text>
                </View>

                {event.mapImageUrl && (
                  <Image
                      source={{ uri: event.mapImageUrl }}
                      style={styles.mapImage}
                      resizeMode="contain"
                  />
                )}
              </ScrollView>
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
  cardWrapper: {
    width: '85%',
    height: '70%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCard: {
    position: 'absolute',
    width: '100%',
    height: '80%',
    backgroundColor: '#FFFFFF', 
    borderRadius: 20,
    transform: [{ rotate: '4deg' }],
  },
  mainCard: {
    width: '100%',
    height: '80%',
    backgroundColor: '#D9D9D9',
    borderRadius: 20,
    padding: 24,
    transform: [{ rotate: '-4deg' }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  closeButton: {
    paddingBottom: 10
  },
  closeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    opacity: 0.5
  },
  saveButton: {
    position: 'absolute',
    top: 15,
    right: 20,
    zIndex: 20,
  },
  headerSection: {
    marginBottom: 15,
    marginTop: 10,
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
    marginTop: 10,
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  mapImage: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 8,    
    backgroundColor: '#fff' 
  }
});