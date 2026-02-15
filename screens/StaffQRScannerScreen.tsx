import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import axios, { AxiosResponse } from 'axios';
import api from '../api';
import { Svg, SvgUri } from 'react-native-svg';
import ButtonSvg from '../assets/qr-scanner/button.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// TODO:
  // Test Attendee Check-in
  // Test Points Shop

import CameraScannerView from '../components/qr scanner/CameraScanner';
import {
  EventSelectModal,
  ScanResult
} from '../components/qr scanner/ScanModals';

// Helper Function to extract token from scanned QR code data
const extractTokenFromUrl = (urlString: string): string => {
  const queryString = urlString.split('?')[1];
  if (!queryString) {
    throw new Error("No query string found in URL.");
  }

  const params = new URLSearchParams(queryString);
  const token = params.get('qr') || params.get('userToken');

  if (token) {
    return token;
  } else {
    throw new Error("No 'qr' or 'userToken' parameter found.");
  }
};

const extractTokenFromScan = (scannedData: string): string => {
  try {
    // Try parsing as JSON first (e.g. {"qrInfo": "hackillinois://..."} or {"QRCode": "hackillinois://..."})
    const qrObject = JSON.parse(scannedData);
    const urlString = qrObject.QRCode || qrObject.qrInfo;

    if (!urlString) {
      throw new Error("JSON does not contain 'QRCode' or 'qrInfo'");
    }

    return extractTokenFromUrl(urlString);
  } catch (e) {
    // Not JSON — try parsing as a raw URL (e.g. "hackillinois://user?qr=...")
    if (scannedData.includes('?')) {
      return extractTokenFromUrl(scannedData);
    }

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
    const [selectedEventName, setSelectedEventName] = useState<string | null>(null);
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
        if (axios.isAxiosError(error)) {
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
        setScanResult({
          status: 'error', 
          message: 'No event selected. Please go back to the menu and select a meal event.' 
        });
        setIsLoading(false);
        return;
      }

      try {
        const userToken = extractTokenFromScan(scannedData);
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
          const msg = error instanceof Error ? error.message : 'An unexpected error occurred.';
          setScanResult({ status: 'error', message: msg });
        }
      } finally {
        setIsLoading(false);
      }
    };

    const submitShopRedeemScan = async (scannedData: string) => {
      setIsLoading(true);

      try {
        const userToken = extractTokenFromScan(scannedData);
        const response = await api.post<AxiosResponse<ShopRedeemSuccessData>>(
            'shop/cart/redeem/',     
            { QRCode: userToken }
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
          const msg = error instanceof Error ? error.message : 'An unexpected error occurred.';
          setScanResult({ status: 'error', message: msg });
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
        setSelectedEventName(null);
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
      const selectedEvent = mealEvents.find(event => event.id === eventId);
      setSelectedEventName(selectedEvent?.label || null);
      setIsEventModalVisible(false);
      handleScanPress(); // Now, open the camera
    };

  // Rendering Logic
  if (!permission) {
    return <View />;
  }

  return (
    <>
      <ImageBackground
        source={require('../assets/qr-scanner/background.png')}
        style={styles.menuContainer}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity
            style={styles.menuButtonFirst}
            onPress={() => {
              setScanMode('attendance');
              handleScanPress();
            }}
          >
            <View style={styles.buttonContainer}>
              <ButtonSvg width={300} height={70} style={styles.buttonSvg} />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.menuButtonText}>Meeting Attendance</Text>
                <Text style={styles.menuButtonArrow}>{">"}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
                setScanMode('attendeeCheckin');
                setIsEventModalVisible(true);
            }}
          >
            <View style={styles.buttonContainer}>
              <ButtonSvg width={300} height={70} style={styles.buttonSvg} />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.menuButtonText}>Attendee Check-in</Text>
                <Text style={styles.menuButtonArrow}>{">"}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              setScanMode('shopRedeem');
              handleScanPress();
            }}
          >
            <View style={styles.buttonContainer}>
              <ButtonSvg width={300} height={70} style={styles.buttonSvg} />
              <View style={styles.buttonTextContainer}>
                <Text style={styles.menuButtonText}>Points Shop</Text>
                <Text style={styles.menuButtonArrow}>{">"}</Text>
              </View>
            </View>
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
      </ImageBackground>

      {/* Camera Scanner Modal */}
      <CameraScannerView
        visible={isScanning}
        onScanned={handleQRCodeScanned}
        onClose={handleCloseScanner}
        isLoading={isLoading}
        isScanned={scanned}
        scanModeLabel={
          scanMode === 'attendance' ? 'Meeting Attendance' :
          scanMode === 'attendeeCheckin' ? (selectedEventName ? `${selectedEventName}` : 'Attendee Check-in') :
          scanMode === 'shopRedeem' ? 'Points Shop' : undefined
        }
        scanResult={scanResult}
        onResultClose={closeModalAndReset}
      />
    </>
  );
}

// View 2 Styles
const styles = StyleSheet.create({
    menuContainer: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      paddingVertical: 20,
      paddingHorizontal: 30,
      paddingBottom: 100,
    },
    menuButton: {
      marginBottom: 20,
      alignSelf: 'center',
      width: 300,
      height: 70,
    },
    menuButtonFirst: {
      marginTop: 120,
      marginBottom: 20,
      alignSelf: 'center',
      width: 300,
      height: 70,
    },
    buttonContainer: {
      width: 300,
      height: 70,
      position: 'relative',
    },
    buttonSvg: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
    buttonTextContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
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
      color: 'white',
      textAlign: 'center',
      fontFamily: 'Tsukimi-Rounded-Bold',
    },
    menuButtonArrow: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
      fontFamily: 'Tsukimi-Rounded-Bold',
    },
});