import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import axios from 'axios';
import api from '../api';

import CameraScannerView from '../components/qr scanner/CameraScanner';
import { ScanResultModal, ScanResult } from '../components/qr scanner/ScanModals';

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

export default function UserQRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

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
    
    // Cooldown before allowing another scan
    setTimeout(() => {
      setScanned(false); 
    }, 2000);
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

  // Rendering Logic
  if (!permission) {
    return <View />;
  }

  // View 1: Camera Scanner
  if (isScanning) {
    return (
      <>
        <CameraScannerView
          onScanned={handleQRCodeScanned}
          onClose={() => setIsScanning(false)}
          isLoading={isLoading}
          isScanned={scanned}
        />
        <ScanResultModal
          visible={!!scanResult}
          onClose={closeModalAndReset}
          result={scanResult}
        />
      </>
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

// View 2 Styles
const styles = StyleSheet.create({
  menuContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 30,
    paddingBottom: 100, 
  },
  menuTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 20,
    marginBottom: 40,
  },
  menuButton: {
    backgroundColor: '#D9D9D9',
    padding: 20,
    borderRadius: 15,
    width: 300,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  menuButtonSecondary: {
    backgroundColor: '#D9D9D9',
    padding: 10,
    marginBottom: 50,
    borderRadius: 15,
    alignItems: 'center', 
    marginTop: 60,
    width: 150,
    height: 70,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  menuButtonBottom: {
    backgroundColor: '#ADADAD',
    alignItems: 'center', 
    height: 60,
    width: 200,
    justifyContent: 'center',
    marginTop: 'auto', 
    marginBottom: 20,
    alignSelf: 'center', 
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'black',
    textAlign: 'center',
  },
  menuButtonArrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
});