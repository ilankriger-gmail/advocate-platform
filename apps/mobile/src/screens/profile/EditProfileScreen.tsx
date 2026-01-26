import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Button, Avatar, Card } from '../../components/ui';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';
import { ProfileStackParamList } from '../../types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { user, refreshUser } = useAuth();
  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [instagram, setInstagram] = useState(user?.instagram_handle || '');
  const [tiktok, setTiktok] = useState(user?.tiktok_handle || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    try {
      let newAvatarUrl = user.avatar_url;

      // Upload new avatar if changed
      if (avatarUri) {
        const fileName = `avatars/${user.id}/${Date.now()}.jpg`;
        const response = await fetch(avatarUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        newAvatarUrl = urlData.publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          bio: bio.trim() || null,
          instagram_handle: instagram.trim() || null,
          tiktok_handle: tiktok.trim() || null,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUser();

      Alert.alert('Perfil atualizado!', 'Suas alterações foram salvas.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.gray[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <Button
          title="Salvar"
          size="sm"
          onPress={handleSave}
          loading={loading}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <Avatar uri={user?.avatar_url} name={user?.full_name} size="xl" />
              )}
              <View style={styles.avatarOverlay}>
                <Ionicons name="camera" size={24} color={colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Toque para alterar a foto</Text>
          </View>

          <Card style={styles.formCard}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Seu nome"
                placeholderTextColor={colors.gray[400]}
                value={fullName}
                onChangeText={setFullName}
                maxLength={100}
              />
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Conte um pouco sobre você..."
                placeholderTextColor={colors.gray[400]}
                value={bio}
                onChangeText={setBio}
                multiline
                textAlignVertical="top"
                maxLength={300}
              />
              <Text style={styles.charCount}>{bio.length}/300</Text>
            </View>
          </Card>

          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Redes Sociais</Text>

            {/* Instagram */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Instagram</Text>
              <View style={styles.socialInput}>
                <Ionicons name="logo-instagram" size={20} color={colors.accent[500]} />
                <TextInput
                  style={styles.socialTextInput}
                  placeholder="seu_usuario"
                  placeholderTextColor={colors.gray[400]}
                  value={instagram}
                  onChangeText={setInstagram}
                  autoCapitalize="none"
                  maxLength={30}
                />
              </View>
            </View>

            {/* TikTok */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>TikTok</Text>
              <View style={styles.socialInput}>
                <Ionicons name="logo-tiktok" size={20} color={colors.gray[800]} />
                <TextInput
                  style={styles.socialTextInput}
                  placeholder="seu_usuario"
                  placeholderTextColor={colors.gray[400]}
                  value={tiktok}
                  onChangeText={setTiktok}
                  autoCapitalize="none"
                  maxLength={30}
                />
              </View>
            </View>
          </Card>

          {/* Spacer */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray[200],
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary[600],
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  formCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  textArea: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[900],
    minHeight: 100,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  socialInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  socialTextInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
});
