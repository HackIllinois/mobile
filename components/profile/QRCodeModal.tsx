import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = 300;
const MODAL_HEIGHT = 320;
const QR_SIZE = 160;

interface QRCodeModalProps {
  visible: boolean;
  qrCode: string | null;
  qrLoading: boolean;
  onClose: () => void;
  onRefresh: () => void;
  displayName: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  visible,
  qrCode,
  qrLoading,
  onClose,
  onRefresh,
  displayName,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={onClose}
          >
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={qrLoading}
          >
            <Ionicons name="refresh" size={20} color={qrLoading ? "#CCC" : "#666"} />
          </TouchableOpacity>

          <View style={styles.qrContainer}>
            {qrCode ? (
              <QRCode
                value={qrCode}
                size={QR_SIZE}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <ActivityIndicator size="large" color="#888" />
              </View>
            )}
          </View>

          <Text style={styles.userName}>{displayName}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 130,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    width: MODAL_WIDTH,
    height: MODAL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalClose: {
    position: 'absolute',
    top: 18,
    right: 9,
    zIndex: 1,
    width: 31.19,
    height: 31.19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    position: 'absolute',
    top: 18,
    left: 9,
    zIndex: 1,
    width: 31.19,
    height: 31.19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    width: QR_SIZE,
    height: 162,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 63,
  },
  qrPlaceholder: {
    width: QR_SIZE,
    height: 162,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontFamily: 'Tsukimi Rounded',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#000',
    marginTop: 26,
    width: 94,
    height: 61,
  },
});
