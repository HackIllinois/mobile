import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, BarcodeScanningResult } from 'expo-camera';

interface CameraScannerViewProps {
  onScanned: (result: BarcodeScanningResult) => void;
  onClose: () => void;
  isLoading: boolean;
  isScanned: boolean;
}

export default function CameraScannerView({ 
  onScanned, 
  onClose, 
  isLoading, 
  isScanned 
}: CameraScannerViewProps) {
  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={isScanned ? undefined : onScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarButton} onPress={onClose}>
          <Text style={styles.topBarButtonText}>{"<"}</Text>
        </TouchableOpacity>
        <View style={styles.topBarTitle} />
        <View style={{ width: 40 }} />
      </View>

      {/* Overlay for transparent effect */}
      <View style={styles.maskContainer}>
        <View style={styles.maskTop} />
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
    </View>
  );
}

// View 1 Styles 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
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
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#D9D9D9',
    height: 110,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingBottom: 15,
    zIndex: 10,
  },
  topBarButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  topBarTitle: {
    height: 35,
    width: 150,
    backgroundColor: '#ADADAD',
    borderRadius: 20,
  },
  maskContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  maskMiddle: {
    height: 250,
    flexDirection: 'row',
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanWindow: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  maskBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  corner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: 'black',
    borderWidth: 5,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanHelpText: {
    fontSize: 16,
    color: 'white',
    backgroundColor: 'transparent',
    marginBottom: 30,
  },
  chooseImageButton: {
    backgroundColor: '#ADADAD',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  chooseImageButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
});