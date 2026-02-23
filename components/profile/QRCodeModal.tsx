import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Pressable, Modal, ActivityIndicator, Animated, useWindowDimensions } from 'react-native';
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
  refreshCooldown: boolean;
  cooldownStartedAt: number | null;
}

const COOLDOWN_MS = 5000;

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  visible,
  qrCode,
  qrLoading,
  onClose,
  onRefresh,
  refreshCooldown,
  cooldownStartedAt,
}) => {
  const { width, height } = useWindowDimensions();
  const localProgressAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animationRef.current?.stop();
    if (!refreshCooldown || cooldownStartedAt === null) {
      localProgressAnim.setValue(0);
      return;
    }
    const elapsed = Date.now() - cooldownStartedAt;
    const remaining = Math.max(0, COOLDOWN_MS - elapsed);
    localProgressAnim.setValue(Math.min(1, elapsed / COOLDOWN_MS));
    animationRef.current = Animated.timing(localProgressAnim, {
      toValue: 1,
      duration: remaining,
      useNativeDriver: false,
    });
    animationRef.current.start();
  }, [visible, refreshCooldown, cooldownStartedAt]);

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
          paddingTop: scaleHeight(130),
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
            marginTop: scaleWidth(16),
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
          {(() => {
            const btnW = scaleWidth(200);
            const btnH = scaleWidth(200 * 47 / 261); 
            const btnRx = btnH / 2; 
            return (
              <TouchableOpacity
                style={{ marginTop: scaleWidth(10) }}
                onPress={handleRefresh}
                disabled={qrLoading || refreshCooldown}
              >
                <View style={{
                  width: btnW,
                  height: btnH,
                  overflow: 'hidden',
                  borderRadius: btnRx,
                }}>
                  <RefreshButtonSvg
                    width={btnW}
                    height={btnH}
                    opacity={qrLoading || refreshCooldown ? 0.5 : 1}
                  />
                  {refreshCooldown && (
                    <Animated.View style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: localProgressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: 'rgba(20, 8, 50, 0.55)',
                    }} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })()}
        </Pressable>
      </Pressable>
    </Modal>
  );
};
