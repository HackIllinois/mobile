import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Modal, Alert } from 'react-native';
import { CameraView, BarcodeScanningResult, scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import ExitSymbol from '../../assets/qr-scanner/exit-symbol.svg';
import ChooseImageButton from '../../assets/qr-scanner/choose-image-button.svg';
import ScanCodeTitle from '../../assets/qr-scanner/scan-code-title.svg';

const { width, height } = Dimensions.get('window');

interface CameraScannerViewProps {
  visible: boolean;
  onScanned: (result: BarcodeScanningResult) => void;
  onClose: () => void;
  isLoading: boolean;
  isScanned: boolean;
}

export default function CameraScannerView({
  visible,
  onScanned,
  onClose,
  isLoading,
  isScanned
}: CameraScannerViewProps) {
  const [imageLibraryPermission, requestImageLibraryPermission] = ImagePicker.useMediaLibraryPermissions();
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const handleChooseImage = async () => {
    try {
      // Check permissions 
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
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Modal overlay with camera inside */}
        <View style={styles.modalContainer}>
          <CameraView
            onBarcodeScanned={isScanned ? undefined : onScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.topSection}>
            <TouchableOpacity style={styles.exitButton} onPress={onClose}>
              <ExitSymbol width={41} height={41} />
            </TouchableOpacity>
            <ScanCodeTitle width={244} height={66} style={styles.scanTitle} />
          </View>

          <View style={styles.middleSection}>
            <View style={styles.maskSide} />
            <View style={styles.qrBox}>
              {/* Corner brackets - replace with vector */}
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

          {(isLoading || isProcessingImage) && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>
                {isProcessingImage ? 'Processing Image...' : 'Verifying Permissions...'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
  modalContainer: {
    position: 'absolute',
    top: height * 0.12, 
    width: width,
    height: height * 0.88, 
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'black', 
  },
  topSection: {
    height: 220,
    backgroundColor: 'rgba(64, 26, 121, 0.7)', 
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  exitButton: {
    position: 'absolute',
    top: 20, 
    left: 25,
    width: 41,
    height: 41,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 70,
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
});