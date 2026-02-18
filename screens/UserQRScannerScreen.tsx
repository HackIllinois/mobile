import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useCameraPermissions, CameraView, BarcodeScanningResult } from 'expo-camera';
import axios from 'axios';
import api from '../api';
import { ScanResultModal, ScanResult } from '../components/qr scanner/ScanModals';
import { getConstrainedWidth } from '../lib/layout';

const width = getConstrainedWidth();

interface ScanSuccessData {
  points: number;
  eventName: string;
  success?: boolean;
}

export default function UserQRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const scannedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
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
      if (axios.isAxiosError(error)) {
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
        } else {
          setScanResult({ status: 'error', message: 'An unexpected error occurred.' });
        }
      } else {
        setScanResult({ status: 'error', message: 'An unexpected error occurred.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleQRCodeScanned = useCallback(({ data }: BarcodeScanningResult) => {
    if (scannedRef.current || isLoading) return;
    scannedRef.current = true;
    setScanned(true);
    submitScanData(data);
  }, [isLoading]);

  const closeModalAndReset = useCallback(() => {
    setScanResult(null);
    scannedRef.current = false;
    setScanned(false);
  }, []);

  // Stable handler reference so CameraView never reconfigures mid-session
  const onScannedRef = useRef(handleQRCodeScanned);
  onScannedRef.current = handleQRCodeScanned;
  const stableBarcodeHandler = useCallback((result: BarcodeScanningResult) => {
    onScannedRef.current(result);
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : stableBarcodeHandler}
        barcodeScannerSettings={barcodeScannerSettings}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay}>
        <View style={styles.topSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.scanTitleText}>Scan QR Code</Text>
            <Text style={styles.scanReasonText}>Event Check-in</Text>
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

        <View style={styles.bottomSection} />
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Verifying...</Text>
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

const barcodeScannerSettings = {
  barcodeTypes: ["qr" as const] as import('expo-camera').BarcodeType[],
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    flex: 1,
  },
  topSection: {
    height: 270,
    backgroundColor: 'rgba(64, 26, 121, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  scanTitleText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  scanReasonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 4,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#E9E9E9',
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: 18,
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
