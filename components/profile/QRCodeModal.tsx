import React, { useEffect, useState} from 'react';
import { View, TouchableOpacity, Pressable, Modal, ActivityIndicator, useWindowDimensions, Text } from 'react-native';
import { MAX_APP_WIDTH } from '../../lib/layout';
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
  refreshCooldown: boolean;
  cooldownStartedAt: number | null;
  qrError?: string | null;
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
  qrError
}) => {
  const { width: windowWidth, height } = useWindowDimensions();
  const width = Math.min(windowWidth, MAX_APP_WIDTH);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() =>{
    if(!visible || !refreshCooldown || cooldownStartedAt === null ){
      setRemainingTime(0);
      return;
    }

    const updateTimer = () =>{
      const elapsed = Date.now() - cooldownStartedAt;
      setRemainingTime(Math.max(0, Math.ceil((COOLDOWN_MS-elapsed)/1000)));
    }
    updateTimer();

    const timer = setInterval(updateTimer, 250);
    return () => clearInterval(timer);
  }, [visible, cooldownStartedAt, refreshCooldown])

  const figmaWidth = 393;
  const figmaHeight = 852;
  const scaleWidth = (size: number) => (width / figmaWidth) * size;
  const scaleHeight = (size: number) => (height / figmaHeight) * size;
  const scaleFontSize = (size: number) => Math.min(scaleWidth(size), scaleHeight(size));

  const QR_SIZE = scaleWidth(200);
  const MODAL_WIDTH = scaleWidth(300);
  const MODAL_HEIGHT = scaleWidth(310);

  const handleClose = () => {
    Haptics.selectionAsync();
    onClose();
  }

  const handleRefresh = () => {
    Haptics.selectionAsync();
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
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{
          backgroundColor: 'rgba(109, 106, 106, 0.82)',
          borderRadius: scaleWidth(30),
          width: MODAL_WIDTH,
          height: MODAL_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
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
            ) : qrLoading? (
                <ActivityIndicator size="large" color="#888" />
            ) : (
              <Text style={{ color: '#333', textAlign: 'center' }}>
                QR code unavailable
              </Text>
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
                </View>
              </TouchableOpacity>
            );
          })()}
          {refreshCooldown && remainingTime > 0 && (
            <View style={{ alignItems: "center"}}>
              <Text style={{ fontSize: 14, color: '#333' }}>
                Please wait {remainingTime} seconds before refreshing.
              </Text>
            </View>
          )}
          {qrError && (
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 14,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              {qrError}
              {qrCode
                ? ' The displayed code may have expired.'
                : ''}
            </Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};
