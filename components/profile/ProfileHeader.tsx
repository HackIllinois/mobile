import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProfileHeaderProps {
  onGoBack: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onGoBack }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={32} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>PROFILE</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    height: SCREEN_WIDTH * (51 / 393),
    marginTop: SCREEN_WIDTH * (55 / 393),
  },
  headerTitle: {
    position: 'absolute',
    left: SCREEN_WIDTH * (31 / 393),
    top: 0,
    width: SCREEN_WIDTH * (222 / 393),
    height: SCREEN_WIDTH * (51 / 393),
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'left',
    letterSpacing: 1.5,
    fontFamily: 'Tsukimi Rounded',
  },
  backButton: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.05,
    top: 0,
    zIndex: 10,
    padding: 10,
  },
});
