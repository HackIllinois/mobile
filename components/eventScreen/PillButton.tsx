import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface PillButtonProps {
    toggleSave: () => void;
    points: number;
    isSaved: boolean;
}


export const PillButton = ({toggleSave, points, isSaved}: PillButtonProps) => {

  return (
    <View style={styles.pillContainer}>
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsText}>+ {points}pts</Text>
      </View>

      <Pressable
        onPress={toggleSave}
        style={({ pressed }) => [
          styles.saveButton,
          {
            backgroundColor: pressed
              ? isSaved ? '#4a4a4a' : '#d3d3d3' 
              : isSaved ? '#666666' : '#E0E0E0', 
          },
        ]}
      >
        <Text style={[styles.saveButtonText, { color: isSaved ? '#FFFFFF' : '#333333' }]}>
          { isSaved ? 'Saved' : 'Save' }
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden', 
    borderWidth: 1,
    borderColor: '#CCCCCC', 
    backgroundColor: '#FFFFFF',
  },
  pointsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#CCCCCC',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

