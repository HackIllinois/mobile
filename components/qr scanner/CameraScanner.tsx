import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, BarcodeScanningResult, scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import ChooseImageButton from '../../assets/qr-scanner/choose-image-button.svg';
import { ScanResult, ScanResultOverlay } from './ScanModals';
import * as Haptics from 'expo-haptics';
import { layoutStyles } from '../../lib/layout';
import { ModalWindow } from '../layout/ModalLayout';
import { ScannerLayout } from './ScannerLayout';

interface CameraScannerViewProps {
  visible: boolean;
  onScanned: (result: BarcodeScanningResult) => void;
  onClose: () => void;
  isLoading: boolean;
  isScanned: boolean;
  scanModeLabel?: string;
  scanResult?: ScanResult | null;
  onResultClose?: () => void;
}

function CameraScannerView({
  visible,
  onScanned,
  onClose,
  isLoading,
  isScanned,
  scanModeLabel,
  scanResult,
  onResultClose
}: CameraScannerViewProps) {
  const [imageLibraryPermission, requestImageLibraryPermission] = ImagePicker.useMediaLibraryPermissions();
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const handleChooseImage = useCallback(async () => {
    Haptics.selectionAsync();
    try {
      if (!imageLibraryPermission?.granted) {
        if (imageLibraryPermission?.canAskAgain) {
          const { granted } = await requestImageLibraryPermission();
          if (!granted) {
            Alert.alert(
              "Permission Required",
              "Please enable media library access in your device settings to choose images."
            );
            return;
          }
        } else {
          Alert.alert(
            "Permission Required",
            "Please enable media library access in your device settings to choose images."
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsProcessingImage(true);
        const imageUri = result.assets[0].uri;

        const scanResults = await scanFromURLAsync(imageUri, ['qr']);

        setIsProcessingImage(false);

        if (scanResults && scanResults.length > 0) {
          const qrData = scanResults[0].data;
          onScanned({ data: qrData, type: 'qr' } as BarcodeScanningResult);
        } else {
          Alert.alert(
            "No QR Code Found",
            "The selected image does not contain a valid QR code. Please try another image."
          );
        }
      }
    } catch (error) {
      setIsProcessingImage(false);
      console.error("Error choosing image:", error);
      Alert.alert(
        "Error",
        "Failed to process the image. Please try again."
      );
    }
  }, [imageLibraryPermission, onScanned]);

  // Stable reference for onBarcodeScanned to avoid CameraView reconfiguring
  const onScannedRef = useRef(onScanned);
  onScannedRef.current = onScanned;

  const stableBarcodeHandler = useCallback((result: BarcodeScanningResult) => {
    onScannedRef.current(result);
  }, []);

  return (
    <ModalWindow visible={visible} animationType="slide" transparent onClose={onClose}>
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} />
        <View style={[layoutStyles.column, styles.scanner]}>
          <ScannerLayout
            reason={scanModeLabel}
            onClose={onClose}
            camera={(
              <CameraView
                onBarcodeScanned={isScanned ? undefined : stableBarcodeHandler}
                barcodeScannerSettings={barcodeScannerSettings}
                style={StyleSheet.absoluteFill}
              />
            )}
            footer={(
              <>
                <Text style={styles.orText}>OR</Text>
                <TouchableOpacity
                  style={styles.chooseImageButton}
                  onPress={handleChooseImage}
                  disabled={isLoading || isProcessingImage}
                  accessibilityLabel="Choose QR image"
                  accessibilityRole="button"
                >
                  <ChooseImageButton width="100%" height="100%" />
                </TouchableOpacity>
              </>
            )}
          >
            {(isLoading || isProcessingImage) && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.loadingText}>
                  {isProcessingImage ? 'Processing Image...' : 'Verifying...'}
                </Text>
              </View>
            )}

            {scanResult && onResultClose && (
              <ScanResultOverlay result={scanResult} onClose={onResultClose} />
            )}
          </ScannerLayout>
        </View>
      </View>
    </ModalWindow>
  );
}

// Stable barcode scanner settings object (avoids re-creating on every render)
const barcodeScannerSettings = {
  barcodeTypes: ["qr" as const] as import('expo-camera').BarcodeType[],
};

export default React.memo(CameraScannerView);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  scanner: {
    paddingHorizontal: 0,
    height: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  orText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  chooseImageButton: {
    width: '100%',
    maxWidth: 200,
    height: 48,
  },
});
