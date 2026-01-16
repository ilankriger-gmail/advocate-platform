import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Erro', result.error || 'Erro ao fazer login');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo/Header */}
        <View className="items-center mb-10">
          <Text className="text-4xl mb-2">❤️</Text>
          <Text className="text-2xl font-bold text-gray-900">
            Bem-vindo de volta!
          </Text>
          <Text className="text-gray-500 mt-2 text-center">
            Entre na sua conta para continuar
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          {/* Email */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
              editable={!isLoading}
            />
          </View>

          {/* Password */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Senha</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
              editable={!isLoading}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className={`w-full h-14 rounded-xl items-center justify-center mt-4 ${
              isLoading ? 'bg-primary-400' : 'bg-primary-600'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">Entrar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity className="mt-4 items-center">
          <Text className="text-primary-600 font-medium">
            Esqueceu sua senha?
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
