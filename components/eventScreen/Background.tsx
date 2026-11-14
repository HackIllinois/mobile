import { View, StyleSheet } from 'react-native';
import { tabBackgrounds } from '../../lib/layout';

interface BackgroundProps {
  children: React.ReactNode
}

export default function Background({ children }: BackgroundProps) {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tabBackgrounds.Event,
  },
});
