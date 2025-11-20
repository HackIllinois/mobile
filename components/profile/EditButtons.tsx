import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

interface EditButtonsProps {
  isLoading: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export const EditButtons: React.FC<EditButtonsProps> = ({
  isLoading,
  onSave,
  onCancel,
}) => {
  return (
    <>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={onSave}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={onCancel}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#888',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#666',
    marginTop: 10,
  },
});
