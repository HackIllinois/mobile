import React, { useState, useEffect } from 'react';
import { Text, View, Button, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

// TODO: Once the Axios wrapper is ready, replace direct fetch() calls with api.post("/event")

type ScanResult = {
  status: 'success' | 'error';
  message: string;
};

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const submitScanData = async (scannedData: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://adonix.hackillinois.org/user/scan-event', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization Token
        },
        body: JSON.stringify({ eventId: scannedData }),
      });
      const responseData = await response.json();
      if (response.ok) {
        const points = responseData.points || 0;
        setScanResult({ status: 'success', message: `Successfully checked in! You earned ${points} points.` });
      } else {
        setScanResult({ status: 'error', message: responseData.message || 'An unknown error occurred. Please contact a Staff Member.' });
      }
    } catch (error) {
      console.error("API call failed:", error);
      setScanResult({ status: 'error', message: 'Network request failed. Please check your connection.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    submitScanData(data);
  };

  const closeModalAndReset = () => {
    setScanResult(null);
    setScanned(false);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ textAlign: 'center' }}>
          We need your permission to show the camera. Please enable camera access in Settings.
        </Text>
      </View>
    );
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
      
      <View style={styles.markerContainer}>
        <View style={styles.marker} />
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Verifying...</Text>
        </View>
      )}

      {/* TODO: Test this */}
      <Modal
        transparent={true}
        visible={!!scanResult}
        animationType="fade"
        onRequestClose={closeModalAndReset}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {scanResult?.status === 'success' ? 'Success!' : 'Error'}
            </Text>
            <Text style={styles.modalMessage}>{scanResult?.message}</Text>
            <Button title="Scan Another" onPress={closeModalAndReset} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  markerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marker: {
    width: 250,
    height: 250,
    borderColor: 'white',
    borderWidth: 4,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
