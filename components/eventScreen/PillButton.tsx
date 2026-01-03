import { View, Text, StyleSheet, Pressable } from 'react-native';

interface PillButtonProps {
  toggleSave: () => void;
  points: number;
  isSaved: boolean;
}

export const PillButton = ({ toggleSave, points, isSaved }: PillButtonProps) => {
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
            backgroundColor: isSaved 
              ? (pressed ? '#5e00a3' : '#3f006c') 
              : (pressed ? '#7a8aff' : '#4d5eff'),
          },
        ]}
      >
        <Text style={styles.saveButtonText}>
          {isSaved ? 'Saved' : 'Save'}
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
    backgroundColor: 'transparent',
  },
  pointsContainer: {
    backgroundColor: '#eddbff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333333',
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});