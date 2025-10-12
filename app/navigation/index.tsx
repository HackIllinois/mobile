import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createStaticNavigation,
  StaticParamList,
} from '@react-navigation/native';

import { BottomTabs } from './BottomTabs';


const RootStack = createNativeStackNavigator({
  screens: {
    HomeTabs: {
      screen: BottomTabs,
      options: {
        title: 'Home',
        headerShown: false,
      },
    },
  }
});

export const Navigation = createStaticNavigation(RootStack);

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}