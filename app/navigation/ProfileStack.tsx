import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from './screens/Profile';

const Stack = createNativeStackNavigator({
  screens: {
    Home: {
      screen: ProfileScreen,
      options: { title: 'Profile' },
    }
  },
});

export const ProfileStack = Stack;
