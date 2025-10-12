import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';
import house from '../assets/house.png';
import cart from '../assets/cart.png';
import qr from '../assets/qr.png';
import profile from '../assets/profile.png';
import { HomeStack } from './HomeStack';
import { ShopStack } from './ShopStack';
import { ScanStack } from './ScanStack';
import { ProfileStack } from './ProfileStack';
import { CurvedTabBar } from '../components/CurvedTabBar';

const HomeTabs = createBottomTabNavigator({
  tabBar: (props) => <CurvedTabBar {...props} />,
  screens: {
    Home: {
      screen: HomeStack,
      options: {
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Image
            source={house}
            tintColor={color}
            style={{
              width: size,
              height: size,
            }}
          />
        ),
      },
    },
    Shop: {
      screen: ShopStack,
      options: {
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Image
            source={cart}
            tintColor={color}
            style={{
              width: size,
              height: size,
            }}
          />
        )
      }
    },
    Scan: {
      screen: ScanStack,
      options: {
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Image
            source={qr}
            tintColor={color}
            style={{
              width: size,
              height: size,
            }}
          />
        )
      }
    },
    Profile: {
      screen: ProfileStack,
      options: {
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Image
            source={profile}
            tintColor={color}
            style={{
              width: size,
              height: size,
            }}
          />
        )
      }
    },
  },
});

export const BottomTabs = HomeTabs;