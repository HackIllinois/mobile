import React, { useState, useMemo } from 'react';
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

// Non-Modal overlay version for use inside another Modal
export function ScanResultOverlay({ result, onClose }: { result: ScanResult | null; onClose: () => void }) {
  if (!result) return null;

  const { status, message, eventName, pointsEarned } = result;
  const isSuccess = status === 'success';

  return (
    <View style={modalStyles.overlayContainer}>
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
  );
}





// Staff Meal Event Selection Modal 

export interface EventItem {
  label: string;
  id: string;
  startTime: number;
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const eventDates = useMemo(() => {
    const dateSet = new Map<string, string>();
    events.forEach((event) => {
      const date = new Date(event.startTime * 1000);
      const dateKey = date.toLocaleDateString('en-US', {
        timeZone: 'America/Chicago',
      });
      if (!dateSet.has(dateKey)) {
        const label = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'America/Chicago',
        });
        dateSet.set(dateKey, label);
      }
    });
    return Array.from(dateSet.entries()).map(([key, label]) => ({ key, label }));
  }, [events]);

  const filteredEvents = useMemo(() => {
    let filtered = selectedDate
      ? events.filter((event) => {
          const dateKey = new Date(event.startTime * 1000).toLocaleDateString('en-US', {
            timeZone: 'America/Chicago',
          });
          return dateKey === selectedDate;
        })
      : [...events];
    return filtered.sort((a, b) => a.startTime - b.startTime);
  }, [events, selectedDate]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalContainer}>
        <View style={[modalStyles.modalContent, { maxHeight: '70%' }]}>
          <Text style={modalStyles.eventSelectTitle}>SELECT EVENT</Text>

          {/* Date filter pills */}
          {eventDates.length > 1 && (
            <View style={modalStyles.datePillRow}>
              {eventDates.map((date) => (
                <TouchableOpacity
                  key={date.key}
                  style={[
                    modalStyles.datePill,
                    selectedDate === date.key && modalStyles.datePillSelected,
                  ]}
                  onPress={() =>
                    setSelectedDate(selectedDate === date.key ? null : date.key)
                  }
                >
                  <Text
                    style={[
                      modalStyles.datePillText,
                      selectedDate === date.key && modalStyles.datePillTextSelected,
                    ]}
                  >
                    {date.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <ScrollView style={modalStyles.eventListContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#000" style={{ marginVertical: 20 }} />
            ) : error ? (
              <Text style={modalStyles.modalMessage}>{error}</Text>
            ) : filteredEvents.length === 0 ? (
              <Text style={modalStyles.modalMessage}>No events found.</Text>
            ) : (
              filteredEvents.map((event, index) => {
                const currentDateKey = new Date(event.startTime * 1000).toLocaleDateString('en-US', {
                  timeZone: 'America/Chicago',
                });
                const prevDateKey = index > 0
                  ? new Date(filteredEvents[index - 1].startTime * 1000).toLocaleDateString('en-US', {
                      timeZone: 'America/Chicago',
                    })
                  : null;
                const showSeparator = !selectedDate && index > 0 && currentDateKey !== prevDateKey;

                return (
                  <React.Fragment key={event.id}>
                    {showSeparator && <View style={modalStyles.dateSeparator} />}
                    <TouchableOpacity
                      style={modalStyles.eventModalButton}
                      onPress={() => onEventSelect(event.id)}
                    >
                      <Text style={modalStyles.eventModalButtonText}>{event.label}</Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })
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
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 30,
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
    fontFamily: 'Tsukimi-Rounded-Bold',
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
    fontFamily: 'Tsukimi-Rounded-Bold',
  },
  eventSelectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#401A79',
    fontFamily: 'Tsukimi-Rounded-Bold',
  },
  // Date Filter Pills
  datePillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 0,
    width: '100%',
  },
  datePill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#eddbff',
  },
  datePillSelected: {
    backgroundColor: '#401A79',
  },
  datePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#401A79',
    fontFamily: 'Montserrat',
  },
  datePillTextSelected: {
    color: '#FFF',
  },
  // Event Modal Specific Styles
  eventListContainer: {
    width: '100%',
    maxHeight: 300,
    marginTop: 10,
    marginBottom: 8,
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
    color: '#401A79',
    textAlign: 'center',
    fontWeight: '500',
  },
  dateSeparator: {
    height: 1.5,
    backgroundColor: '#401A79',
    opacity: 0.15,
    marginHorizontal: 10,
  },
  cancelButton: {
    backgroundColor: '#401A79',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
  },
});