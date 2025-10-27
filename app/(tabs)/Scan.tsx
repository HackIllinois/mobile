import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import UserQRScannerScreen from '../../screens/UserQRScannerScreen'; 
import StaffQRScannerScreen from '../../screens/StaffQRScannerScreen'; 

const checkIsStaff = (roles: string[]): boolean => {
  return roles.includes('STAFF') || roles.includes('ADMIN');
};

export default function QRScannerRoleCheck() {
  // Null for Loading 
  const [isStaff, setIsStaff] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        const rolesString = await SecureStore.getItemAsync('userRoles');
        
        if (rolesString) {
          const roles = JSON.parse(rolesString);
          setIsStaff(checkIsStaff(roles));
        } else {
          // Default to Non-Staff
          setIsStaff(false);
        }
      } catch (e) {
        console.error("Failed to parse user roles", e);
        setIsStaff(false); 
      }
    };

    fetchUserRoles();
  }, []);


  if (isStaff === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (isStaff) {
    return <StaffQRScannerScreen />;
  }

  return <UserQRScannerScreen />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000'
  }
});