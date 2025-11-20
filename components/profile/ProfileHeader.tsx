import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderProps {
  onGoBack: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onGoBack }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={32} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>PROFILE</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '5%',
    paddingHorizontal: '10%',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  backButton: {
    position: 'absolute',
    left: '5%',
    top: 0,
    zIndex: 10,
    padding: 10,
  },
});
