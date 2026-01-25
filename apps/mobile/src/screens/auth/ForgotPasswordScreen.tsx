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
import { supabase } from '../../services/supabase';
import { colors, spacing, fontSize, fontWeight } from '../../utils/theme';
import { AuthStackParamList } from '../../types';

type ForgotPasswordScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Digite seu email');
      return;
    }

    setLoading(true);
    setError('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'advocate://reset-password',
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      Alert.alert(
        'Email enviado!',
        'Verifique sua caixa de entrada para redefinir sua senha.',
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
            <Text style={styles.title}>Esqueci minha senha</Text>
            <Text style={styles.subtitle}>
              Digite seu email para receber um link de recuperação
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

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title="Enviar link"
              onPress={handleResetPassword}
              loading={loading}
              fullWidth
              style={styles.submitButton}
            />
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
  submitButton: {
    marginTop: spacing.sm,
  },
});
