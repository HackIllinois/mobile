import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Modal, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios, { AxiosResponse } from 'axios';
import api from '../api';
import { styles } from './styles/QRScannerScreen.styles';

const MEAL_EVENTS = [
  { label: 'Day 1: Dinner', id: '8fb5e860a6c3618a949d20312865f934' },
  { label: 'Day 1: Midnight Snacks', id: '9e7a833f024f1a94eb7ea3751d479df9' },
  { label: 'Day 2: Lunch', id: 'e7a8602f7fa155ac16372eab68f1d47a' },
  { label: 'Day 2: Dinner', id: '0344d5b31ada88451a9e5d89058ee03c' },
  { label: 'Day 2: Late Night Snacks', id: 'eca6f0305ef18533fe61697acd3e7c3e' },
  { label: 'Day 3: Brunch', id: 'f37f12ba934043acb7bd599d5cd16a2f' },
];

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
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isEventModalVisible, setIsEventModalVisible] = useState(false);

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

        if (!selectedEventId) {
          console.error("No event selected for attendee scan.");
          setScanResult({ 
            status: 'error', 
            message: 'No event selected. Please go back to the menu and select a meal event.' 
          });
          setIsLoading(false);
          return;
        }
        
        try {
          const response = await api.put<AxiosResponse<StaffAttendeeSuccessData>>(
              'staff/scan-attendee/',     
              { 
                eventId: selectedEventId, 
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
        setScanResult({ status: 'error', message: 'Unknown scan mode. Please try again.' });
      }
    };
  
    const closeModalAndReset = () => {
      setScanResult(null);
      setScanned(false);
      setScanMode(null);
      setSelectedEventId(null);
      setIsScanning(false);
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
    
    const handleEventSelected = (eventId: string) => {
      setSelectedEventId(eventId);
      setIsEventModalVisible(false);
      handleScanPress(); // Now, open the camera
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

      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => {
            setScanMode('attendeeCheckin');
            setIsEventModalVisible(true); 
        }}
      >
        <Text style={styles.menuButtonText}>Attendee Check-in</Text>
        <Text style={styles.menuButtonArrow}>{">"}</Text>
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


      <Modal
        transparent={true}
        visible={isEventModalVisible}
        animationType="fade"
        onRequestClose={() => setIsEventModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Event</Text>
            <ScrollView style={styles.eventListContainer}>
                {MEAL_EVENTS.map((event) => (
                    <TouchableOpacity
                        key={event.id}
                        style={styles.eventModalButton}
                        onPress={() => handleEventSelected(event.id)}
                    >
                        <Text style={styles.eventModalButtonText}>{event.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setIsEventModalVisible(false)}
            >
              <Text style={styles.okButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
