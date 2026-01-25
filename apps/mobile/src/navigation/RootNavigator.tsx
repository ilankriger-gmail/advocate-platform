import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { RootStackParamList } from '../types';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
});
