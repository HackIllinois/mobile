import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderProps {
  onGoBack: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onGoBack }) => {
  const { width, height } = useWindowDimensions();

  const figmaWidth = 393;
  const figmaHeight = 852;
  const scaleWidth = (size: number) => (width / figmaWidth) * size;
  const scaleHeight = (size: number) => (height / figmaHeight) * size;
  const scaleFontSize = (size: number) => Math.min(scaleWidth(size), scaleHeight(size));

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-start',
      position: 'relative',
      height: scaleWidth(51),
      marginTop: scaleWidth(55),
    }}>
      <TouchableOpacity onPress={onGoBack} style={{
        position: 'absolute',
        left: width * 0.05,
        top: 0,
        zIndex: 10,
        padding: 10,
      }}>
        <Ionicons name="chevron-back" size={32} color="#FFF" />
      </TouchableOpacity>
      <Text style={{
        position: 'absolute',
        left: scaleWidth(31),
        top: 0,
        width: scaleWidth(222),
        height: scaleWidth(51),
        fontSize: scaleFontSize(26),
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'left',
        letterSpacing: scaleWidth(1.5),
        fontFamily: 'Tsukimi Rounded',
      }}>PROFILE</Text>
    </View>
  );
};
