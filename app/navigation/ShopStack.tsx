import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ShopScreen } from './screens/Shop';

const Stack = createNativeStackNavigator({
  screens: {
    Home: {
      screen: ShopScreen,
      options: { title: 'Shop' },
    }
  },
});

export const ShopStack = Stack;
