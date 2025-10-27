import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Modal, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios, { AxiosResponse } from 'axios';
import api from '../api';
import { styles } from './styles/QRScannerScreen.styles';

interface StaffAttendanceSuccessData {
  success?: boolean;
}

interface StaffAttendeeSuccessData {
    success: boolean;
    user: {
      userId: string;
      dietaryRestrictions: string[];
    };
    eventName: string;
  }

type ScanResult = {
    status: 'success' | 'error';
    message: string;
};

export default function StaffQRScannerScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    const [scanMode, setScanMode] = useState<'attendance' | 'attendeeCheckin' | null>(null);
  
    useEffect(() => {
      if (!permission?.granted) {
        requestPermission();
      }
    }, []);
  
    const submitStaffAttendanceScan = async (scannedData: string) => {
      setIsLoading(true);
      try {
        const response = await api.post<AxiosResponse<StaffAttendanceSuccessData>>(
            'staff/attendance/',     
            { eventId: scannedData } 
        );
    
        if (response.data.success) {
            setScanResult({
              status: 'success',
              message: 'Attendance Recorded!', 
            });
        } else {
            throw new Error("API returned success:false");
        }
    
      } catch (error) {
        console.log('Error caught:', error);
        if (axios.isAxiosError(error)) {
          console.log('Axios error response:', error.response);
          if (error.response) {
            const status = error.response.status;
            const data = error.response.data as any;
            const errorType = data?.error;
            const message = data?.message;
    
            if (status === 400 && errorType === "CodeExpired") {
              setScanResult({ status: 'error', message: message || "This event has expired." });
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


    const submitAttendeeScan = async (scannedData: string) => {
        setIsLoading(true);
  
        // TODO: Hardcode All Meal Event IDs
        const eventId = 'Placeholder_Meal_Event_ID'; 
        
        try {
          const response = await api.put<AxiosResponse<StaffAttendeeSuccessData>>(
              'staff/scan-attendee/',     
              { 
                eventId: eventId, 
                attendeeQRCode: scannedData
              } 
          );
      
          if (response.data.success) {
              setScanResult({
                status: 'success',
                message: 'Attendee Checked-in!', 
              });
          } else {
              throw new Error("API returned success:false");
          }
      
        } catch (error) {
          console.log('Attendee Scan Error:', error);
          if (axios.isAxiosError(error) && error.response) {
              const { status, data } = error.response;
              const errorType = data?.error;
              const message = data?.message;
      
              // Handle errors from the screenshot
              if (status === 400 && errorType === "QRExpired") {
                setScanResult({ status: 'error', message: message || "QR Code has expired." });
              } else if (status === 400 && errorType === "QRInvalid") {
                setScanResult({ status: 'error', message: message || "QR Code is invalid." });
              } else if (status === 400 && errorType === "AlreadyCheckedIn") {
                setScanResult({ status: 'error', message: message || "Attendee is already checked in." });
              } else if (status === 404 && errorType === "NotFound") {
                setScanResult({ status: 'error', message: message || "Could not find this event." });
              } else {
                setScanResult({ status: 'error', message: message || 'An unknown error occurred.' });
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
      setScanned(true);

      if (scanMode === 'attendance') {
        submitStaffAttendanceScan(data);
      } else if (scanMode === 'attendeeCheckin') {
        submitAttendeeScan(data);
      } else {
        console.error("Unknown scan mode");
      }
    };
  
    const closeModalAndReset = () => {
      setScanResult(null);
      setScanned(false);
      setScanMode(null);
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
                  <Text style={styles.modalTitle}>{scanResult.message}</Text>
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
      <Text style={styles.menuTitle}>Staff Scanner</Text>
      
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => {
          setScanMode('attendance');
          handleScanPress();
        }}
      >
        <Text style={styles.menuButtonText}>Meeting Attendance</Text>
        <Text style={styles.menuButtonArrow}>{">"}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuButtonSecondary}>
        <Text style={styles.menuButtonText}>Attendee Check-in</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuButtonSecondary}
        onPress={() => {
          setScanMode('attendeeCheckin');
          handleScanPress();
        }}
      >
        <Text style={styles.menuButtonText}>Points Shop (Placeholder)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuButtonBottom}>
        <Text style={styles.menuButtonText}>Placeholder</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
