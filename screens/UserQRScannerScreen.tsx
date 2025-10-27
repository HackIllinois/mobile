import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Modal, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios, { AxiosResponse } from 'axios';
import api from '../api';
import { styles } from './styles/QRScannerScreen.styles';

interface ScanSuccessData {
  points: number;
  eventName: string;
  success?: boolean;
}

interface EventDetails {
  event_id: string;
  name: string;
  description: string; 
  event_type: string;
  startTime: number;
  endTime: number;
  locations: {
    description: string;
    latitude: number;
    longitude: number;
  };
  sponsor?: string;
  eventType: string;
  points: number;
  isStaff: boolean;
  isPrivate: boolean;
  isAsync: boolean;
  isPro: boolean;
  isMandatory: boolean;
  displayOnStaffCheckIn: boolean;
  mapImageUrl?: string;
  exp: number;
}

type ScanResult = {
  status: 'success' | 'error';
  message: string;
  eventName?: string; 
  pointsEarned?: number; 
};

export default function UserQRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  
  // Controls which view is visible
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const submitScanData = async (scannedData: string) => {
    setIsLoading(true);
    try {
      // console.log('QR Scanner: Starting API calls');
      
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

  const handleQRCodeScanned = ({ data }: { data: string }) => {
    if (scanned || isLoading) return;
    // console.log('Scanned QR Code Data: ', data);
    setScanned(true);
    submitScanData(data);
  };

  const closeModalAndReset = () => {
    setScanResult(null);
    setScanned(false);
  };
  
  const handleScanPress = () => {
    if (permission?.granted) {
      setIsScanning(true);
    } else if (permission?.canAskAgain) {
      requestPermission();
    } else {
      alert("Camera permission is required. Please enable it in your device settings.");
    }
  };

  // Rendering logic
  if (!permission) { // Camera permissions are yet to load
    return <View />;
  }

  if (!permission.granted) { 
    // View 2 will be visible by default, but a re-request is triggered
  }

  // View 1: Camera Scanner 
  if (isScanning) {
    return (
      <View style={styles.container}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleQRCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarButton} onPress={() => setIsScanning(false)}>
            <Text style={styles.topBarButtonText}>{"<"}</Text> 
          </TouchableOpacity>
          <View style={styles.topBarTitle} />
          <View style={{ width: 40 }} /> 
        </View>

        {/* Overlay for transparent effect */}
        <View style={styles.maskContainer}>
          <View style={styles.maskTop} />

          {/* QR Scan Window Frame */}
          <View style={styles.maskMiddle}>
            <View style={styles.maskSide} />
            <View style={styles.scanWindow}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <View style={styles.maskSide} />
          </View>

          <View style={styles.maskBottom}>
            <Text style={styles.scanHelpText}>
              Align the QR code with the frame to scan!
            </Text>
            <TouchableOpacity style={styles.chooseImageButton}>
              <Text style={styles.chooseImageButtonText}>Choose image (Placeholder)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Verifying Permissions...</Text>
          </View>
        )}

        {/* Success / Error Modal */}
        <Modal
          transparent={true}
          visible={!!scanResult}
          animationType="fade"
          onRequestClose={closeModalAndReset}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {scanResult?.status === 'success' ? (
                <View style={styles.successContent}>
                  <Text style={styles.checkMark}>✓</Text>
                  <Text style={styles.modalEventName}>{scanResult.eventName || 'Event'}</Text>
                  <Text style={styles.modalTitle}>Check-in Successful!</Text>
                  <Text style={styles.pointsEarned}>{scanResult.pointsEarned || 0} pts earned</Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.modalTitle}>Error</Text>
                  <Text style={styles.modalMessage}>{scanResult?.message}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.okButton} onPress={closeModalAndReset}>
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // View 2: (Default) Scanner Menu 
  return (
    <SafeAreaView style={styles.menuContainer}>
      <Text style={styles.menuTitle}>User Scanner</Text>
      
      <TouchableOpacity style={styles.menuButton} onPress={handleScanPress}>
        <Text style={styles.menuButtonText}>Event Check-in</Text>
        <Text style={styles.menuButtonArrow}>{">"}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuButtonSecondary}>
        <Text style={styles.menuButtonText}>Mentor Check-in (Placeholder)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuButtonSecondary}>
        <Text style={styles.menuButtonText}>Placeholder</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuButtonBottom}>
        <Text style={styles.menuButtonText}>Placeholder</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
