import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight } from '../../utils/theme';
import { AuthStackParamList } from '../../types';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError('Email ou senha inválidos');
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🎯</Text>
            <Text style={styles.title}>Advocate</Text>
            <Text style={styles.subtitle}>
              Plataforma de Advocate Marketing
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="mail-outline"
            />

            <Input
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title="Entrar"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={styles.loginButton}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem uma conta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}> Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  form: {
    marginBottom: spacing.xl,
  },
  errorText: {
    color: colors.error.main,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  forgotPasswordText: {
    color: colors.primary[600],
    fontSize: fontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: colors.gray[500],
    fontSize: fontSize.sm,
  },
  registerLink: {
    color: colors.primary[600],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
