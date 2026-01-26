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
import { Button } from '../../components/ui';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';
import { FeedStackParamList } from '../../types';

type Props = NativeStackScreenProps<FeedStackParamList, 'NewPost'>;

export function NewPostScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
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

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'Digite um título para o post');
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
          const fileName = `${user.id}/${Date.now()}.jpg`;
          const response = await fetch(imageUri);
          const blob = await response.blob();

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('posts')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);

          mediaUrls.push(urlData.publicUrl);
        }
      }

      // Create post
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim() || null,
        media_url: mediaUrls.length > 0 ? mediaUrls : null,
        media_type: mediaUrls.length > 0 ? (mediaUrls.length > 1 ? 'carousel' : 'image') : 'none',
        type: 'community',
        status: 'pending', // Needs approval
      });

      if (error) throw error;

      Alert.alert(
        'Post enviado!',
        'Seu post foi enviado para análise e será publicado em breve.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Erro', 'Não foi possível criar o post. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.gray[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Post</Text>
        <Button
          title="Publicar"
          size="sm"
          onPress={handleSubmit}
          loading={loading}
          disabled={!title.trim()}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {/* Title Input */}
          <TextInput
            style={styles.titleInput}
            placeholder="Título do seu post"
            placeholderTextColor={colors.gray[400]}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            autoFocus
          />

          {/* Content Input */}
          <TextInput
            style={styles.contentInput}
            placeholder="Compartilhe seus pensamentos..."
            placeholderTextColor={colors.gray[400]}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />

          {/* Images Preview */}
          {images.length > 0 && (
            <View style={styles.imagesContainer}>
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
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color={colors.primary[600]} />
            <Text style={styles.actionText}>Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="videocam-outline" size={24} color={colors.primary[600]} />
            <Text style={styles.actionText}>Vídeo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="link-outline" size={24} color={colors.primary[600]} />
            <Text style={styles.actionText}>Link</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
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
  titleInput: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  contentInput: {
    fontSize: fontSize.base,
    color: colors.gray[700],
    lineHeight: 24,
    minHeight: 150,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
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
  bottomActions: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  actionText: {
    marginLeft: spacing.xs,
    color: colors.primary[600],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
