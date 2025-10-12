import { View, Text, StyleSheet } from 'react-native';

export function ScanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Scan Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    fontSize: 24,
  },
});
