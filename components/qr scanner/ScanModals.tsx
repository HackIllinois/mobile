import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import CheckMark from '../../assets/qr-scanner/check-mark.svg';
import OkButton from '../../assets/qr-scanner/ok-button.svg';
import { ModalLayout, ModalPanel } from '../layout/ModalLayout';
import { SafeAreaView } from "react-native-safe-area-context";

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

  return (
    <ModalLayout
      visible={visible}
      onClose={onClose}
      backdropColor={BACKDROP_COLOR}
      dismissOnBackdrop={false}
      panelStyle={modalStyles.modalContent}
      footer={<ScanResultButton onClose={onClose} />}
    >
      <ScanResultDetails result={result} />
    </ModalLayout>
  );
}

export function ScanResultOverlay({ result, onClose }: { result: ScanResult | null; onClose: () => void }) {
  if (!result) return null;

  return (
    <SafeAreaView style={modalStyles.overlayContainer}>
      <ModalPanel panelStyle={modalStyles.modalContent} footer={<ScanResultButton onClose={onClose} />}>
        <ScanResultDetails result={result} />
      </ModalPanel>
    </SafeAreaView>
  );
}

function ScanResultDetails({ result }: { result: ScanResult }) {
  const { status, message, eventName, pointsEarned } = result;

  return (
    <View style={modalStyles.resultContent}>
      {status === 'success' ? (
        <>
          <CheckMark width={96} height={96} style={modalStyles.checkMark} />
          {!!eventName && <Text style={modalStyles.modalEventName}>{eventName}</Text>}
          <Text style={modalStyles.modalTitle}>{message}</Text>
          {!!eventName && <Text style={modalStyles.pointsEarned}>{pointsEarned || 0} pts earned</Text>}
        </>
      ) : (
        <>
          <Text style={modalStyles.modalTitle}>Error</Text>
          <Text style={modalStyles.modalMessage}>{message}</Text>
        </>
      )}
    </View>
  );
}

function ScanResultButton({ onClose }: { onClose: () => void }) {
  return (
    <TouchableOpacity onPress={onClose} style={modalStyles.okButton} accessibilityLabel="OK">
      <OkButton width="100%" height="100%" />
    </TouchableOpacity>
  );
}

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
    <ModalLayout
      visible={visible}
      onClose={onClose}
      backdropColor={BACKDROP_COLOR}
      dismissOnBackdrop={false}
      panelStyle={modalStyles.modalContent}
      footer={(
        <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
          <Text style={modalStyles.okButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    >
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

      <View style={modalStyles.eventListContainer}>
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
      </View>
    </ModalLayout>
  );
}

const BACKDROP_COLOR = 'rgba(0, 0, 0, 0.7)';

const modalStyles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BACKDROP_COLOR,
    padding: 16,
    zIndex: 30,
  },
  modalContent: {
    backgroundColor: '#FFEAFE',
  },
  resultContent: {
    alignItems: 'center',
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: 185,
    height: 44,
    marginTop: 8,
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
    flexWrap: 'wrap',
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
    alignSelf: 'center',
    backgroundColor: '#401A79',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
  },
});