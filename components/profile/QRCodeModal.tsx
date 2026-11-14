import React, { useEffect, useState} from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ModalLayout } from '../layout/ModalLayout';
import { ResponsiveQRCode } from '../layout/ResponsiveQRCode';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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

  const handleClose = () => {
    Haptics.selectionAsync();
    onClose();
  }

  const handleRefresh = () => {
    Haptics.selectionAsync();
    onRefresh();
  }

  return (
    <ModalLayout
      visible={visible}
      onClose={handleClose}
      panelStyle={styles.panel}
      backdropColor="rgba(255, 255, 255, 0.85)"
      header={(
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          accessibilityLabel="Close QR code"
        >
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
      )}
    >
      <View style={styles.content}>
        {qrCode ? (
          <ResponsiveQRCode value={qrCode} backgroundColor="#FFEAFE" />
        ) : (
          <View style={styles.codeContainer}>
            {qrLoading ? (
              <ActivityIndicator size="large" color="#888" />
            ) : (
              <Text style={styles.message}>QR code unavailable</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={qrLoading || refreshCooldown}
          accessibilityLabel="Refresh QR code"
        >
          <RefreshButtonSvg width="100%" height="100%" opacity={qrLoading || refreshCooldown ? 0.5 : 1} />
        </TouchableOpacity>

        {refreshCooldown && remainingTime > 0 && (
          <Text style={styles.message}>Please wait {remainingTime} seconds before refreshing.</Text>
        )}
        {qrError && (
          <Text style={styles.errorText}>
            {qrError}
            {qrCode ? ' The displayed code may have expired.' : ''}
          </Text>
        )}
      </View>
    </ModalLayout>
  );
};

const styles = StyleSheet.create({
  panel: {
    maxWidth: 360,
    backgroundColor: 'rgba(109, 106, 106, 0.82)',
  },
  content: {
    alignItems: 'center',
    gap: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeContainer: {
    width: '100%',
    maxWidth: 200,
    aspectRatio: 1,
    justifyContent: 'center',
  },
  refreshButton: {
    width: '100%',
    maxWidth: 200,
    height: 44,
  },
  message: {
    color: '#333',
    textAlign: 'center',
  },
  errorText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
  },
});
