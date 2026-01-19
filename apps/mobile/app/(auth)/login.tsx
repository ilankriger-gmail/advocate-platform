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
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth';

// Google Logo Component
function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const { login, loginWithGoogle, isLoading } = useAuthStore();

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

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Erro', result.error || 'Erro ao fazer login com Google');
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

        {!showEmailLogin ? (
          /* Login Options */
          <View className="space-y-4">
            {/* Google Button */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-14 rounded-xl items-center justify-center flex-row bg-white border-2 border-gray-200"
              style={{ backgroundColor: '#fff' }}
            >
              {isLoading ? (
                <ActivityIndicator color="#4285F4" />
              ) : (
                <>
                  <GoogleLogo />
                  <Text className="text-gray-700 font-semibold text-base ml-3">
                    Entrar com Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="text-gray-400 mx-4">ou</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Email Login Button */}
            <TouchableOpacity
              onPress={() => setShowEmailLogin(true)}
              disabled={isLoading}
              className="w-full h-14 rounded-xl items-center justify-center bg-primary-600"
            >
              <Text className="text-white font-semibold text-base">
                Entrar com Email
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Email Form */
          <View className="space-y-4">
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => setShowEmailLogin(false)}
              className="mb-2"
            >
              <Text className="text-primary-600 font-medium">← Voltar</Text>
            </TouchableOpacity>

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

            {/* Forgot Password */}
            <TouchableOpacity className="mt-4 items-center">
              <Text className="text-primary-600 font-medium">
                Esqueceu sua senha?
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
