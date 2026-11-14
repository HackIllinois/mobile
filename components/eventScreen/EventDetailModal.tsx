import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ModalLayout, ModalWindow } from '../layout/ModalLayout';
import { SafeAreaView } from "react-native-safe-area-context";
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
    <ModalLayout
      visible={visible}
      onClose={onClose}
      header={(
        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSave(event.eventId)}
            style={styles.saveButton}
          >
            {saved ? <Saved height={45} /> : <Unsaved height={45} />}
          </TouchableOpacity>
        </View>
      )}
    >
      <View style={styles.headerSection}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{event.name}</Text>
          <View style={styles.pillPoints}>
            <Text style={styles.pillTextBlack}>{event.points || 0}pts</Text>
          </View>
          <View style={styles.pillTrack}>
            <Text style={styles.pillTextWhite}>{event.eventType || 'General'}</Text>
          </View>
        </View>

        <Text style={styles.infoText}>
          {formatTime(event.startTime)} - {formatTime(event.endTime)}
        </Text>
        <Text style={styles.infoText}>{event.locations[0]?.description || 'Siebel 1st Floor'}</Text>
        <Text style={styles.descriptionLabel}>{event.description}</Text>
      </View>

      {event.mapImageUrl && (
        <>
          <TouchableOpacity
            style={styles.mapContainer}
            onPress={() => setIsMapFullScreen(true)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: event.mapImageUrl }} style={styles.mapImage} resizeMode="contain" />
            <View style={styles.expandOverlay} />
          </TouchableOpacity>
          <Text style={styles.expandText}>Tap To Enlarge</Text>

          <ModalWindow
            visible={visible && isMapFullScreen}
            animationType="slide"
            onClose={() => setIsMapFullScreen(false)}
          >
            <SafeAreaView style={styles.fullScreenContainer}>
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
            </SafeAreaView>
          </ModalWindow>
        </>
      )}
    </ModalLayout>
  );
}

const styles = StyleSheet.create({
  // -- Content Styles --
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    minHeight: 48,
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
  // -- Pills --
  pillPoints: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  pillTrack: {
    backgroundColor: '#ababacff',
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
    aspectRatio: 1.6,
    maxHeight: 220,
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
    ...StyleSheet.absoluteFill,
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
    alignSelf: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 12,
  },
  fullScreenCloseButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fullScreenCloseText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  fullScreenImage: {
    flex: 1,
    width: '100%',
  },
});
