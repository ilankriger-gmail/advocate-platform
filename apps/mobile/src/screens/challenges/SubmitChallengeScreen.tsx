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
import { Button, Card } from '../../components/ui';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';
import { ChallengesStackParamList } from '../../types';

type Props = NativeStackScreenProps<ChallengesStackParamList, 'SubmitChallenge'>;

export function SubmitChallengeScreen({ route, navigation }: Props) {
  const { challengeId } = route.params;
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim() && images.length === 0 && !link.trim()) {
      Alert.alert('Erro', 'Adicione uma descrição, foto ou link para participar.');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado');
      return;
    }

    setLoading(true);

    try {
      // Upload images if any
      let mediaUrls: string[] = [];

      if (images.length > 0) {
        for (const imageUri of images) {
          const fileName = `challenges/${challengeId}/${user.id}/${Date.now()}.jpg`;
          const response = await fetch(imageUri);
          const blob = await response.blob();

          const { error: uploadError } = await supabase.storage
            .from('submissions')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('submissions')
            .getPublicUrl(fileName);

          mediaUrls.push(urlData.publicUrl);
        }
      }

      // Create participation
      const { error } = await supabase.from('challenge_participants').insert({
        challenge_id: challengeId,
        user_id: user.id,
        status: 'pending',
        submission_text: description.trim() || null,
        submission_url: link.trim() || null,
        submission_media: mediaUrls.length > 0 ? mediaUrls : null,
      });

      if (error) throw error;

      Alert.alert(
        'Participação enviada! 🎉',
        'Sua participação foi registrada e está em análise. Boa sorte!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ChallengesHome'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting:', error);
      if (error.code === '23505') {
        Alert.alert('Ops!', 'Você já participou deste desafio.');
      } else {
        Alert.alert('Erro', 'Não foi possível enviar sua participação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Participar</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Sua Participação</Text>
            <Text style={styles.sectionSubtitle}>
              Envie as provas de que você completou o desafio
            </Text>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Descreva como você completou o desafio..."
                placeholderTextColor={colors.gray[400]}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                maxLength={1000}
              />
            </View>

            {/* Link */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Link (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor={colors.gray[400]}
                value={link}
                onChangeText={setLink}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            {/* Images */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fotos</Text>
              
              <View style={styles.imageButtons}>
                <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={24} color={colors.primary[600]} />
                  <Text style={styles.imageButtonText}>Tirar foto</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                  <Ionicons name="images" size={24} color={colors.primary[600]} />
                  <Text style={styles.imageButtonText}>Galeria</Text>
                </TouchableOpacity>
              </View>

              {images.length > 0 && (
                <View style={styles.imagesGrid}>
                  {images.map((uri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color={colors.error.main} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Card>

          {/* Tips */}
          <Card style={styles.tipsCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb-outline" size={20} color={colors.warning.main} />
              <Text style={styles.tipTitle}>Dicas</Text>
            </View>
            <Text style={styles.tipText}>
              • Seja criativo na sua participação{'\n'}
              • Fotos e vídeos aumentam suas chances{'\n'}
              • Descreva bem o que você fez{'\n'}
              • Quanto mais detalhes, melhor!
            </Text>
          </Card>

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.bottomButton}>
          <Button
            title="Enviar Participação"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
          />
        </View>
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
  formCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
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
    minHeight: 120,
  },
  imageButtons: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
  },
  imageButtonText: {
    marginLeft: spacing.xs,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[200],
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  tipsCard: {
    backgroundColor: colors.warning.light,
    borderColor: colors.warning.main,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tipTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.warning.dark,
    marginLeft: spacing.xs,
  },
  tipText: {
    fontSize: fontSize.sm,
    color: colors.warning.dark,
    lineHeight: 22,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
});
