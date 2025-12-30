import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import axios, { AxiosResponse } from 'axios';
import api from '../api';

// TODO: 
  // Test Attendee Check-in
  // Test Points Shop

import CameraScannerView from '../components/qr scanner/CameraScanner';
import {
  ScanResultModal,
  EventSelectModal,
  ScanResult
} from '../components/qr scanner/ScanModals';

// Helper Function to extract token from scanned QR code data
const extractTokenFromScan = (scannedData: string): string => {
  try {
    const qrObject = JSON.parse(scannedData); 

    let urlString: string | undefined;
    let tokenParam: string = '';

    if (qrObject.QRCode) {
      urlString = qrObject.QRCode;
      tokenParam = 'qr'; 
    } else if (qrObject.qrInfo) {
      urlString = qrObject.qrInfo;
      tokenParam = 'userToken'; 
    } else {
      throw new Error("JSON does not contain 'QRCode' or 'qrInfo'");
    }

    if (!urlString) {
      throw new Error("JSON does not contain 'QRCode' or 'qrInfo'");
    }
    
    const queryString = urlString.split('?')[1];
    if (!queryString) {
      throw new Error("No query string found in URL.");
    }

    const params = new URLSearchParams(queryString);
    const token = params.get(tokenParam); 

    if (token) {
      return token; 
    } else {
      throw new Error(`No '${tokenParam}' parameter found.`);
    }
  } catch (e) {
    console.error("Failed to parse QR code data:", e);
    throw new Error((e as Error).message || "Invalid QR Code Format.");
  }
};

interface EventData {
  eventId: string;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  locations: [
    {
      description: string;
      latitude: number;
      longitude: number;
    }
  ],
  sponsor: string;
  eventType: string;
  points: number;
  isStaff: boolean;
  isPrivate: boolean;
  isAsync: boolean;
  isPro: boolean;
  isMandatory: boolean;
  displayOnStaffCheckIn: boolean;
  mapImageUrl: string;
  exp: number;
}

interface GetEventsSuccessData {
  events: EventData[];
}

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

interface ShopItem {
  itemId: string;
  name: string;
  quantity: number; 
}

interface ShopRedeemSuccessData {
  userId: string;
  items: ShopItem[];
}

export default function StaffQRScannerScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isEventModalVisible, setIsEventModalVisible] = useState(false);
    const [scanMode, setScanMode] = useState<'attendance' | 'attendeeCheckin' | 'shopRedeem' | null>(null);
    const [mealEvents, setMealEvents] = useState<{ label: string, id: string }[]>([]);
    const [isFetchingEvents, setIsFetchingEvents] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
  
    useEffect(() => {
      if (!permission?.granted) {
        requestPermission();
      }
    }, []);

    useEffect(() => {
      const fetchMealEvents = async () => {
        setIsFetchingEvents(true);
        setFetchError(null);
        try {
          const response = await api.get<AxiosResponse<GetEventsSuccessData>>('/event/');
          
          if (response.data && response.data.events) {
            const filteredEvents = response.data.events.filter(
              (event) => event.eventType === 'MEAL'
            );

            const formattedEvents = filteredEvents.map((event) => {
              const date = new Date(event.startTime * 1000); 

              const dateString = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                timeZone: 'America/Chicago' // Hardcoding to CT
              });
              
              return {
                label: `${event.name} (${dateString})`,
                id: event.eventId,
              };
            });
          
            setMealEvents(formattedEvents);
          } else {
            throw new Error('Invalid API response structure');
          }
  
        } catch (error) {
          console.error('Failed to fetch meal events:', error);
          setFetchError('Failed to load meal events. Please try again.');
        } finally {
          setIsFetchingEvents(false);
        }
      };
  
      fetchMealEvents();
    }, []); 
  
    // API Logic
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

      const userToken = extractTokenFromScan(scannedData);
      
      try {
        const response = await api.put<AxiosResponse<StaffAttendeeSuccessData>>(
            'staff/scan-attendee/',     
            { 
              eventId: selectedEventId, 
              attendeeQRCode: userToken
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

    const submitShopRedeemScan = async (scannedData: string) => {
      setIsLoading(true);

      const userToken = extractTokenFromScan(scannedData);

      try {
        const response = await api.post<AxiosResponse<ShopRedeemSuccessData>>(
            'shop/cart/redeem/',     
            { qrCode: userToken } 
        );
    
        const { items } = response.data;
        
        if (items && items.length > 0) {
          const itemNames = items.map(item => `${item.quantity} x ${item.name}`).join(', ');
          setScanResult({
            status: 'success',
            message: `Redeemed: ${itemNames}`, 
          });
        } else {
          setScanResult({
            status: 'success',
            message: 'Purchase Successful!', 
          });
        }
    
      } catch (error) {
        console.log('Shop Redeem Error:', error);
        if (axios.isAxiosError(error) && error.response) {
            const { status, data } = error.response;
            const errorType = data?.error;
            const message = data?.message;
    
            if (status === 400) {
              if (errorType === "InsufficientQuantity") {
                setScanResult({ status: 'error', message: message || "Not enough of that item in the shop." });
              } else if (errorType === "QRExpired") {
                setScanResult({ status: 'error', message: message || "This QR code has expired." });
              } else if (errorType === "QRInvalid") {
                setScanResult({ status: 'error', message: message || "This QR code is invalid." });
              } else {
                setScanResult({ status: 'error', message: message || "Invalid request." });
              }
            } else if (status === 402 && errorType === "InsufficientFunds") {
              setScanResult({ status: 'error', message: message || "Not enough points to purchase." });
            } else if (status === 404 && errorType === "NotFound") {
              setScanResult({ status: 'error', message: message || "Shop item not found." });
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
  
    // Handler Logic
    const handleQRCodeScanned = ({ data }: BarcodeScanningResult) => {
      if (scanned || isLoading) return;
      setScanned(true);

      if (scanMode === 'attendance') {
        submitStaffAttendanceScan(data);
      } else if (scanMode === 'attendeeCheckin') {
        submitAttendeeScan(data);
      } else if (scanMode === 'shopRedeem') {
        submitShopRedeemScan(data);
      } else {
        console.error("Unknown scan mode");
        setScanResult({ status: 'error', message: 'Unknown scan mode. Please try again.' });
      }
    };
  
    const closeModalAndReset = () => {
      setScanResult(null);
      
      // Cooldown before allowing another scan
      setTimeout(() => {
        setScanned(false); 
      }, 2000);
    };

    const handleCloseScanner = () => {
        setIsScanning(false);
        setScanMode(null);
        setSelectedEventId(null);
        setScanned(false);
    }
    
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
          onClose={handleCloseScanner}
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
        style={styles.menuButton}
        onPress={() => {
          setScanMode('shopRedeem');
          handleScanPress();
        }}
      >
        <Text style={styles.menuButtonText}>Points Shop</Text>
        <Text style={styles.menuButtonArrow}>{">"}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuButtonBottom}>
        <Text style={styles.menuButtonText}>Placeholder</Text>
      </TouchableOpacity>

      {/* Render the EventSelectModal component */}
      <EventSelectModal
        visible={isEventModalVisible}
        onClose={() => setIsEventModalVisible(false)}
        onEventSelect={handleEventSelected}
        events={mealEvents}
        isLoading={isFetchingEvents}
        error={fetchError}
      />
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