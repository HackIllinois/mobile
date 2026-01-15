import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

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
  const { width, height } = useWindowDimensions();

  const figmaWidth = 393;
  const figmaHeight = 852;
  const scaleWidth = (size: number) => (width / figmaWidth) * size;
  const scaleHeight = (size: number) => (height / figmaHeight) * size;
  const scaleFontSize = (size: number) => Math.min(scaleWidth(size), scaleHeight(size));

  const MODAL_WIDTH = scaleWidth(300);
  const MODAL_HEIGHT = scaleWidth(320);
  const QR_SIZE = scaleWidth(160);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: scaleHeight(130),
      }}>
        <View style={{
          backgroundColor: '#FFEAFE',
          borderRadius: scaleWidth(30),
          width: MODAL_WIDTH,
          height: MODAL_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: scaleWidth(3.84),
          elevation: 5,
        }}>
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: scaleHeight(18),
              right: scaleWidth(9),
              zIndex: 1,
              width: scaleWidth(31.19),
              height: scaleWidth(31.19),
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={onClose}
          >
            <Ionicons name="close" size={scaleFontSize(28)} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              position: 'absolute',
              top: scaleHeight(18),
              left: scaleWidth(9),
              zIndex: 1,
              width: scaleWidth(31.19),
              height: scaleWidth(31.19),
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={onRefresh}
            disabled={qrLoading}
          >
            <Ionicons name="refresh" size={scaleFontSize(20)} color={qrLoading ? "#CCC" : "#666"} />
          </TouchableOpacity>

          <View style={{
            width: QR_SIZE,
            height: scaleHeight(162),
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: scaleHeight(63),
          }}>
            {qrCode ? (
              <QRCode
                value={qrCode}
                size={QR_SIZE}
                backgroundColor="#FFEAFE"
                color="#000000"
              />
            ) : (
              <View style={{
                width: QR_SIZE,
                height: scaleHeight(162),
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <ActivityIndicator size="large" color="#888" />
              </View>
            )}
          </View>

          <Text style={{
            fontFamily: 'Tsukimi Rounded',
            fontWeight: '600',
            fontSize: scaleFontSize(20),
            lineHeight: scaleHeight(20),
            letterSpacing: 0,
            textAlign: 'center',
            color: '#000',
            marginTop: scaleHeight(26),
            width: scaleWidth(94),
            height: scaleHeight(61),
          }}>{displayName}</Text>
        </View>
      </View>
    </Modal>
  );
};
