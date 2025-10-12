import { Assets as NavigationAssets } from '@react-navigation/elements';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { createURL } from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { useColorScheme } from 'react-native';
import { Navigation } from './navigation';

Asset.loadAsync([
  ...NavigationAssets,
  require('./assets/cart.png'),
  require('./assets/house.png'),
  require('./assets/qr.png'),
  require('./assets/profile.png'),
]);

SplashScreen.preventAutoHideAsync();

const prefix = createURL('/');

export function App() {
  const colorScheme = useColorScheme();

  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme

  return (
    <Navigation
      theme={theme}
      linking={{
        enabled: 'auto',
        prefixes: [prefix],
      }}
      onReady={() => {
        SplashScreen.hideAsync();
      }}
    />
  );
}
