import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, View, Text } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '../stores/auth';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [fontError, setFontError] = useState<Error | null>(null);

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    // Na web, marca como pronto imediatamente
    if (Platform.OS === 'web') {
      console.log('[Layout] Web detected, marking app ready');
      setAppReady(true);
    }
  }, []);

  useEffect(() => {
    if (error) {
      console.error('[Layout] Font loading error:', error);
      setFontError(error);
      setAppReady(true);
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      console.log('[Layout] Fonts loaded');
      if (Platform.OS !== 'web') {
        SplashScreen.hideAsync();
      }
      setAppReady(true);
    }
  }, [loaded]);

  console.log('[Layout] Render - appReady:', appReady, 'loaded:', loaded, 'Platform:', Platform.OS);

  if (!appReady) {
    // Loading fallback
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
  const { isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setNavigationReady] = useState(false);

  useEffect(() => {
    // Pequeno delay para garantir que a navegação está pronta
    const timer = setTimeout(() => {
      setNavigationReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isNavigationReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    console.log('[Layout] Auth check - isAuthenticated:', isAuthenticated, 'inAuthGroup:', inAuthGroup, 'segments:', segments);

    if (!isAuthenticated && !inAuthGroup) {
      console.log('[Layout] Redirecting to login');
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      console.log('[Layout] Redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isNavigationReady]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
