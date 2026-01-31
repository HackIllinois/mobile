import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useCameraPermissions, CameraView, BarcodeScanningResult, scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import api from '../api';
import ChooseImageButton from '../assets/qr-scanner/choose-image-button.svg';
import { ScanResultModal, ScanResult } from '../components/qr scanner/ScanModals';

const { width } = Dimensions.get('window');

interface ScanSuccessData {
  points: number;
  eventName: string;
  success?: boolean;
}

export default function UserQRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [imageLibraryPermission, requestImageLibraryPermission] = ImagePicker.useMediaLibraryPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  // API Logic
  const submitScanData = async (scannedData: string) => {
    setIsLoading(true);
    try {
      const response = await api.put<ScanSuccessData>(
        'user/scan-event/',
        { eventId: scannedData }
      );

      const points = (response as any).data.points || 0;
      const eventName = (response as any).data.eventName || 'Event';

      setScanResult({
        status: 'success',
        message: 'Check-in Successful!',
        eventName: eventName,
        pointsEarned: points,
      });
    } catch (error) {
      console.log('Error caught:', error);
      if (axios.isAxiosError(error)) {
        console.log('Axios error response:', error.response);
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data as any;
          const errorType = data?.error;
          const message = data?.message;

          if (status === 400 && errorType === "AlreadyCheckedIn") {
            setScanResult({ status: 'error', message: message || "You're already checked in." });
          } else if (status === 404 && errorType === "NotFound") {
            setScanResult({ status: 'error', message: message || "Could not find this event." });
          } else if (status === 401 || status === 403) {
            setScanResult({ status: 'error', message: message || 'Your session is invalid. Please log in again.' });
          } else {
            setScanResult({ status: 'error', message: message || 'An unknown error occurred.' });
          }
        } else if (error.request) {
          setScanResult({ status: 'error', message: 'Network request failed. Please check your connection.' });
        }
      } else {
        setScanResult({ status: 'error', message: 'An unexpected error occurred.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleQRCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanned || isLoading) return;
    setScanned(true);
    submitScanData(data);
  };

  const closeModalAndReset = () => {
    setScanResult(null);
    setTimeout(() => {
      setScanned(false);
    }, 2000);
  };

  const handleChooseImage = async () => {
    try {
      if (!imageLibraryPermission?.granted) {
        if (imageLibraryPermission?.canAskAgain) {
          const { granted } = await requestImageLibraryPermission();
          if (!granted) {
            return;
          }
        } else {
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
          handleQRCodeScanned({ data: qrData, type: 'qr' } as BarcodeScanningResult);
        }
      }
    } catch (error) {
      setIsProcessingImage(false);
      console.error("Error choosing image:", error);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleQRCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay}>
        <View style={styles.topSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.scanTitleText}>Scan QR Code</Text>
            <Text style={styles.scanReasonText}>for Event Check-in</Text>
            <Text style={styles.instructionText}>Place QR inside the frame to scan</Text>
          </View>
        </View>

        <View style={styles.middleSection}>
          <View style={styles.maskSide} />
          <View style={styles.qrBox}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={styles.maskSide} />
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.orText}>OR</Text>
          <TouchableOpacity
            style={styles.chooseImageButton}
            onPress={handleChooseImage}
            disabled={isLoading || isProcessingImage}
          >
            <ChooseImageButton width={width * 0.501} height={48} />
          </TouchableOpacity>
        </View>
      </View>

      {(isLoading || isProcessingImage) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>
            {isProcessingImage ? 'Processing Image...' : 'Verifying...'}
          </Text>
        </View>
      )}

      <ScanResultModal
        visible={!!scanResult}
        onClose={closeModalAndReset}
        result={scanResult}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    flex: 1,
  },
  topSection: {
    height: 280,
    backgroundColor: 'rgba(64, 26, 121, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  scanTitleText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  scanReasonText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 4,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#E9E9E9',
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 10,
  },
  middleSection: {
    height: width * 0.7,
    flexDirection: 'row',
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(64, 26, 121, 0.7)',
  },
  qrBox: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'visible',
  },
  corner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: '#FFF',
    borderWidth: 3,
    zIndex: 10,
  },
  cornerTopLeft: {
    top: -15,
    left: -15,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: -15,
    right: -15,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: -15,
    left: -15,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: -15,
    right: -15,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: 'rgba(64, 26, 121, 0.7)',
    alignItems: 'center',
    paddingTop: 60,
  },
  orText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'Montserrat',
    marginBottom: 25,
  },
  chooseImageButton: {
    width: width * 0.501,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
});
