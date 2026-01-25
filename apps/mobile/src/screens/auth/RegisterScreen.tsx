import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight } from '../../utils/theme';
import { AuthStackParamList } from '../../types';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    const { error: signUpError } = await signUp(email, password, fullName);

    if (signUpError) {
      setError(signUpError.message || 'Erro ao criar conta');
    } else {
      Alert.alert(
        'Conta criada!',
        'Verifique seu email para confirmar o cadastro.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Voltar</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              Junte-se à comunidade de advocates
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Nome completo"
              placeholder="Seu nome"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              leftIcon="person-outline"
            />

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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />

            <Input
              label="Confirmar senha"
              placeholder="Repita a senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title="Criar conta"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              style={styles.registerButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}> Fazer login</Text>
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
  },
  header: {
    marginBottom: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backButtonText: {
    color: colors.primary[600],
    fontSize: fontSize.base,
  },
  title: {
    fontSize: fontSize['2xl'],
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
  registerButton: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    color: colors.gray[500],
    fontSize: fontSize.sm,
  },
  loginLink: {
    color: colors.primary[600],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
