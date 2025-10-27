import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ScrollView } from 'react-native';
import { Event } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FullScreenModalProps {
  visible: boolean;
  event: Event | null;
  onClose: () => void;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

export default function FullScreenModal({ visible, event, onClose }: FullScreenModalProps) {

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>X</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.saveButton}>
            <Image source={require('../../assets/event/Bookmark.png')} />
          </TouchableOpacity>
          <Text style={styles.title}>{event?.name}</Text>
          <Text style={styles.body}>{formatTime(event?.startTime)} - {formatTime(event?.endTime)}.</Text>
          {event?.sponsor && <Text style={styles.body}>{event?.sponsor}</Text>}
          <Text style={styles.body}>{event?.locations[0]?.description || 'TBA'}</Text>
          {event?.mapImageUrl && event.mapImageUrl.trim() !== '' && (
            <Image
              source={{ uri: event.mapImageUrl }}
              style={[styles.map, styles.container]}
              resizeMode="contain"
            />
          )}
          <Text style={styles.body}>{event?.description?.trim()}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#1a0033',
    paddingTop: 20,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 60, 
    alignItems: 'flex-start',
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    left: 25,
    zIndex: 10,
  },
  saveButton: {
    position: 'absolute',
    top: 15,
    right: 25,
    zIndex: 10,
  },
  closeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    alignItems: 'flex-start',
    paddingHorizontal: 30,
    top: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'left',
    marginBottom:10
  },
  map: {
    width: 300, 
    height: 300,
    backgroundColor: "#FFFFFF",
    marginBottom: 15
  },
  container: {
    borderColor: "#6b3982ff", 
    borderRadius: 10,         
    borderWidth: 7,           
  }
});
