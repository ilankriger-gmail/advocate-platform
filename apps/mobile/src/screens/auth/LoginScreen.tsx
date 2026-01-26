import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';
import { AuthStackParamList } from '../../types';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const { signIn } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError('');

      const redirectUrl = makeRedirectUri({
        scheme: 'advocate',
        path: 'auth/callback',
      });

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (signInError) throw signInError;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          const url = result.url;
          const params = new URLSearchParams(url.split('#')[1]);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setError('Erro ao fazer login com Google');
    } finally {
      setGoogleLoading(false);
    }
  };

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo & Welcome */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoEmoji}>❤️</Text>
              </View>
              <Text style={styles.title}>Arena Te Amo</Text>
              <Text style={styles.subtitle}>
                Faça parte da comunidade mais{'\n'}engajada do Brasil
              </Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              {!showEmailLogin ? (
                <>
                  {/* Google Button - Primary */}
                  <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleLogin}
                    disabled={googleLoading}
                    activeOpacity={0.8}
                  >
                    <View style={styles.googleIconContainer}>
                      <Ionicons name="logo-google" size={20} color="#EA4335" />
                    </View>
                    <Text style={styles.googleButtonText}>
                      {googleLoading ? 'Conectando...' : 'Continuar com Google'}
                    </Text>
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>ou</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Email option */}
                  <TouchableOpacity
                    style={styles.emailButton}
                    onPress={() => setShowEmailLogin(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="mail-outline" size={20} color={colors.primary[600]} />
                    <Text style={styles.emailButtonText}>Entrar com email</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Back button */}
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setShowEmailLogin(false)}
                  >
                    <Ionicons name="arrow-back" size={20} color={colors.gray[600]} />
                    <Text style={styles.backButtonText}>Voltar</Text>
                  </TouchableOpacity>

                  {/* Email Form */}
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
                </>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem uma conta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}> Criar conta grátis</Text>
              </TouchableOpacity>
            </View>

            {/* Terms */}
            <Text style={styles.termsText}>
              Ao continuar, você concorda com nossos{' '}
              <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
              <Text style={styles.termsLink}>Política de Privacidade</Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    top: height * 0.3,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    bottom: 100,
    right: 20,
  },
  safeArea: {
    flex: 1,
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
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: 16,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  googleButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[800],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.gray[400],
    fontSize: fontSize.sm,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  emailButtonText: {
    marginLeft: spacing.sm,
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.primary[600],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButtonText: {
    marginLeft: spacing.xs,
    color: colors.gray[600],
    fontSize: fontSize.sm,
  },
  errorText: {
    color: colors.error.main,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  loginButton: {
    marginTop: spacing.sm,
    borderRadius: 16,
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
    marginTop: spacing.xl,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: fontSize.sm,
  },
  registerLink: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  termsText: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
});
