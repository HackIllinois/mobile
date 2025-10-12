import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScanScreen } from './screens/Scan';

const Stack = createNativeStackNavigator({
  screens: {
    Home: {
      screen: ScanScreen,
      options: { title: 'Scan' },
    }
  },
});

export const ScanStack = Stack;

