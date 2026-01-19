import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, View, Text } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Vai direto para tabs (sem autenticação por enquanto)
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const isWeb = Platform.OS === 'web';
  const [appReady, setAppReady] = useState(isWeb);

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error('[Layout] Font loading error:', error);
      setAppReady(true);
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      console.log('[Layout] Fonts loaded');
      if (!isWeb) {
        SplashScreen.hideAsync();
      }
      setAppReady(true);
    }
  }, [loaded, isWeb]);

  if (!appReady && !isWeb) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: '#333' }}>Carregando...</Text>
      </View>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Redireciona direto para tabs ao iniciar
  useEffect(() => {
    if (!hasRedirected) {
      setHasRedirected(true);
      router.replace('/(tabs)');
    }
  }, [hasRedirected]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
