import React from 'react';
import { View, TouchableOpacity, Pressable, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import RefreshButtonSvg from '../../assets/profile/qr-screen/refresh-button.svg';

interface QRCodeModalProps {
  visible: boolean;
  qrCode: string | null;
  qrLoading: boolean;
  onClose: () => void;
  onRefresh: () => void;
  displayName?: string; // Kept for backwards compatibility but no longer displayed
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  visible,
  qrCode,
  qrLoading,
  onClose,
  onRefresh,
}) => {
  const { width, height } = useWindowDimensions();

  const figmaWidth = 393;
  const figmaHeight = 852;
  const scaleWidth = (size: number) => (width / figmaWidth) * size;
  const scaleHeight = (size: number) => (height / figmaHeight) * size;
  const scaleFontSize = (size: number) => Math.min(scaleWidth(size), scaleHeight(size));

  const QR_SIZE = scaleWidth(200);
  const MODAL_WIDTH = scaleWidth(300);
  const MODAL_HEIGHT = scaleWidth(310);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  }

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRefresh();
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingTop: scaleHeight(100),
        }}
        onPress={handleClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{
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
          {/* Close Button - moved to left where reload was */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: scaleHeight(10),
              left: scaleWidth(9),
              zIndex: 1,
              width: scaleWidth(31.19),
              height: scaleWidth(31.19),
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleClose}
          >
            <Ionicons name="close" size={scaleFontSize(28)} color="#333" />
          </TouchableOpacity>

          <View style={{
            width: QR_SIZE,
            height: QR_SIZE,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: scaleWidth(25),
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
                height: QR_SIZE,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <ActivityIndicator size="large" color="#888" />
              </View>
            )}
          </View>

          {/* Refresh Button */}
          <TouchableOpacity
            style={{
              marginTop: scaleWidth(10),
            }}
            onPress={handleRefresh}
            disabled={qrLoading}
          >
            <RefreshButtonSvg
              width={scaleWidth(200)}
              height={scaleWidth(50)}
              opacity={qrLoading ? 0.5 : 1}
            />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
