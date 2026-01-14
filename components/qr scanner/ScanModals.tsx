import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import CheckMark from '../../assets/qr-scanner/check-mark.svg';
import OkButton from '../../assets/qr-scanner/ok-button.svg';

export interface ScanResult {
  status: 'success' | 'error';
  message: string;
  eventName?: string;
  pointsEarned?: number;
}


// Scan Result Modal Component

interface ScanResultModalProps {
  visible: boolean;
  onClose: () => void;
  result: ScanResult | null;
}

export function ScanResultModal({ visible, onClose, result }: ScanResultModalProps) {
  if (!result) return null;

  const { status, message, eventName, pointsEarned } = result;
  const isSuccess = status === 'success';

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalContainer}>
        <View style={modalStyles.modalContent}>
          {isSuccess ? (
            <View style={modalStyles.successContent}>
              <CheckMark width={120} height={120} style={modalStyles.checkMark} />
              {eventName ? (
                <>
                  <Text style={modalStyles.modalEventName}>{eventName}</Text>
                  <Text style={modalStyles.modalTitle}>{message}</Text>
                  <Text style={modalStyles.pointsEarned}>{pointsEarned || 0} pts earned</Text>
                </>
              ) : (
                <Text style={modalStyles.modalTitle}>{message}</Text>
              )}
            </View>
          ) : (
            <View style={modalStyles.successContent}>
              <Text style={modalStyles.modalTitle}>Error</Text>
              <Text style={modalStyles.modalMessage}>{message}</Text>
            </View>
          )}
          <TouchableOpacity onPress={onClose}>
            <OkButton width={185} height={41} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}





// Staff Meal Event Selection Modal 

interface EventItem {
  label: string;
  id: string;
}

interface EventSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onEventSelect: (eventId: string) => void;
  events: EventItem[];
  isLoading: boolean;
  error: string | null;
}

export function EventSelectModal({
  visible,
  onClose,
  onEventSelect,
  events,
  isLoading,
  error,
}: EventSelectModalProps) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalContainer}>
        <View style={[modalStyles.modalContent, { maxHeight: '70%' }]}>
          <Text style={modalStyles.modalTitle}>Select Event</Text>
          <ScrollView style={modalStyles.eventListContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#000" style={{ marginVertical: 20 }} />
            ) : error ? (
              <Text style={modalStyles.modalMessage}>{error}</Text>
            ) : events.length === 0 ? (
              <Text style={modalStyles.modalMessage}>No meal events found.</Text>
            ) : (
              events.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={modalStyles.eventModalButton}
                  onPress={() => onEventSelect(event.id)}
                >
                  <Text style={modalStyles.eventModalButtonText}>{event.label}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
            <Text style={modalStyles.okButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}




// General Styles for Modals

const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFEAFE',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successContent: {
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
  },
  checkMark: {
    marginBottom: 20,
  },
  modalEventName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  pointsEarned: {
    fontSize: 18,
    color: '#666',
    backgroundColor: '#D9D9D9',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    fontWeight: 'bold',
    marginBottom: 30,
    marginTop: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: '#555',
  },
  okButton: {
    backgroundColor: 'black',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 10,
    width: '70%',
  },
  okButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Event Modal Specific Styles
  eventListContainer: {
    width: '100%',
    maxHeight: 300,
    marginVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  eventModalButton: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    width: '100%',
  },
  eventModalButtonText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
  },
});