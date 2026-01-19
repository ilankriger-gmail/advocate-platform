import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Share,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { postsApi, feedApi } from '@/lib/api';
import YouTubePreview from '@/components/YouTubePreview';

interface Author {
  id: string;
  full_name: string;
  avatar_url: string | null;
  is_creator: boolean;
}

interface Post {
  id: string;
  title: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  type: string;
  status: string;
  likes_count: number;
  comments_count: number;
  vote_score: number;
  created_at: string;
  user_id: string;
  author: Author;
  user_vote: number | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author: Author;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Agora';
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return date.toLocaleDateString('pt-BR');
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const fetchPost = useCallback(async (isRefresh = false) => {
    if (!id) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await postsApi.getById(id);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setPost((result.data as { post: Post }).post);
      }
    } catch (err) {
      setError('Erro ao carregar post');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  const fetchComments = useCallback(async (isRefresh = false) => {
    if (!id) return;

    if (isRefresh) {
      setCommentsCursor(null);
      setComments([]);
    }

    setIsLoadingComments(true);

    try {
      const result = await postsApi.getComments(id, {
        cursor: isRefresh ? undefined : commentsCursor || undefined,
      });

      if (result.data) {
        const response = result.data as { comments: Comment[]; nextCursor: string | null; hasMore: boolean };
        if (isRefresh) {
          setComments(response.comments);
        } else {
          setComments(prev => [...prev, ...response.comments]);
        }
        setCommentsCursor(response.nextCursor);
        setHasMoreComments(response.hasMore);
      }
    } catch (err) {
      console.error('Erro ao carregar comentários:', err);
    } finally {
      setIsLoadingComments(false);
    }
  }, [id, commentsCursor]);

  useEffect(() => {
    fetchPost();
    fetchComments(true);
  }, [id]);

  const handleVote = async (value: number) => {
    if (!post) return;

    const oldVote = post.user_vote || 0;
    const newValue = post.user_vote === value ? 0 : value;
    const newScore = post.vote_score - oldVote + newValue;

    // Atualização otimista
    setPost({ ...post, user_vote: newValue || null, vote_score: newScore });

    try {
      await feedApi.vote(post.id, newValue);
    } catch {
      // Reverter em caso de erro
      setPost({ ...post, user_vote: oldVote || null, vote_score: post.vote_score });
    }
  };

  const handleShare = async () => {
    if (!post) return;

    try {
      await Share.share({
        message: `${post.title || ''}\n\n${post.content?.substring(0, 200)}...`,
        title: post.title || 'Compartilhar post',
      });
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  const handleSendComment = async () => {
    if (!id || !commentText.trim()) return;

    setIsSendingComment(true);

    try {
      const result = await postsApi.createComment(id, commentText.trim());

      if (result.data) {
        const response = result.data as { comment: Comment };
        setComments(prev => [response.comment, ...prev]);
        setCommentText('');

        // Atualizar contador
        if (post) {
          setPost({ ...post, comments_count: post.comments_count + 1 });
        }
      }
    } catch (err) {
      console.error('Erro ao enviar comentário:', err);
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleOpenInstagram = () => {
    if (post?.instagram_url) {
      Linking.openURL(post.instagram_url);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-gray-500 mt-4">Carregando post...</Text>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-6xl mb-4">😕</Text>
        <Text className="text-gray-900 font-semibold text-lg mb-2">Post não encontrado</Text>
        <Text className="text-gray-500 text-center mb-6">{error}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-600 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Post',
          headerShown: true,
          headerBackTitle: 'Voltar',
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-50"
        keyboardVerticalOffset={90}
      >
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                fetchPost(true);
                fetchComments(true);
              }}
              tintColor="#8B5CF6"
            />
          }
        >
          {/* Post Content */}
          <View className="bg-white border-b border-gray-100">
            {/* Author Header */}
            <View className="flex-row items-center p-4">
              <TouchableOpacity
                onPress={() => post.author?.id && router.push(`/profile/${post.author.id}`)}
                disabled={!post.author?.id}
              >
                {post.author?.avatar_url ? (
                  <Image
                    source={{ uri: post.author.avatar_url }}
                    className="w-12 h-12 rounded-full bg-gray-200"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
                    <Text className="text-primary-600 font-semibold">
                      {getInitials(post.author?.full_name || 'U')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => post.author?.id && router.push(`/profile/${post.author.id}`)}
                    disabled={!post.author?.id}
                  >
                    <Text className="font-bold text-gray-900 text-base">
                      {post.author?.full_name || 'Usuário'}
                    </Text>
                  </TouchableOpacity>
                  {post.author?.is_creator && (
                    <View className="ml-2 bg-primary-100 px-2 py-0.5 rounded-full">
                      <Text className="text-primary-600 text-xs font-medium">Creator</Text>
                    </View>
                  )}
                </View>
                <Text className="text-gray-500 text-sm">
                  {formatDate(post.created_at)}
                </Text>
              </View>
            </View>

            {/* Title & Content */}
            <View className="px-4 pb-4">
              {post.title && (
                <Text className="font-bold text-gray-900 text-xl mb-2">
                  {post.title}
                </Text>
              )}
              {post.content && (
                <Text className="text-gray-700 text-base leading-6">
                  {post.content}
                </Text>
              )}
            </View>

            {/* Media */}
            {post.media_url && post.media_type === 'image' && (
              <Image
                source={{ uri: post.media_url }}
                className="w-full aspect-video bg-gray-100"
                resizeMode="cover"
              />
            )}

            {/* YouTube Video */}
            {post.youtube_url && (
              <View className="px-4 pb-4">
                <YouTubePreview url={post.youtube_url} />
              </View>
            )}

            {/* Instagram Link */}
            {post.instagram_url && (
              <TouchableOpacity
                onPress={handleOpenInstagram}
                className="mx-4 mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center">
                    <FontAwesome name="instagram" size={24} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold">Ver no Instagram</Text>
                    <Text className="text-white/70 text-sm">Abrir post original</Text>
                  </View>
                  <FontAwesome name="external-link" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            )}

            {/* Actions */}
            <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
              {/* Vote */}
              <TouchableOpacity
                onPress={() => handleVote(1)}
                className="flex-row items-center"
              >
                <FontAwesome
                  name={post.user_vote === 1 ? 'heart' : 'heart-o'}
                  size={22}
                  color={post.user_vote === 1 ? '#F472B6' : '#9CA3AF'}
                />
                <Text className="text-gray-700 font-medium ml-2 text-base">
                  {post.vote_score || 0}
                </Text>
              </TouchableOpacity>

              {/* Comments Count */}
              <View className="flex-row items-center ml-6">
                <FontAwesome name="comment-o" size={20} color="#9CA3AF" />
                <Text className="text-gray-500 ml-2">
                  {post.comments_count || 0}
                </Text>
              </View>

              {/* Share */}
              <TouchableOpacity onPress={handleShare} className="ml-auto p-2">
                <FontAwesome name="share" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments Section */}
          <View className="p-4">
            <Text className="text-gray-900 font-bold text-lg mb-4">
              Comentários ({post.comments_count || 0})
            </Text>

            {comments.length === 0 && !isLoadingComments && (
              <View className="items-center py-8">
                <Text className="text-4xl mb-2">💬</Text>
                <Text className="text-gray-500 text-center">
                  Nenhum comentário ainda.{'\n'}Seja o primeiro a comentar!
                </Text>
              </View>
            )}

            {comments.map((comment) => (
              <View key={comment.id} className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
                <View className="flex-row items-start">
                  <TouchableOpacity
                    onPress={() => comment.author?.id && router.push(`/profile/${comment.author.id}`)}
                    disabled={!comment.author?.id}
                  >
                    {comment.author?.avatar_url ? (
                      <Image
                        source={{ uri: comment.author.avatar_url }}
                        className="w-9 h-9 rounded-full bg-gray-200"
                      />
                    ) : (
                      <View className="w-9 h-9 rounded-full bg-primary-100 items-center justify-center">
                        <Text className="text-primary-600 font-semibold text-xs">
                          {getInitials(comment.author?.full_name || 'U')}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => comment.author?.id && router.push(`/profile/${comment.author.id}`)}
                        disabled={!comment.author?.id}
                      >
                        <Text className="font-semibold text-gray-900 text-sm">
                          {comment.author?.full_name || 'Usuário'}
                        </Text>
                      </TouchableOpacity>
                      {comment.author?.is_creator && (
                        <View className="ml-2 bg-primary-100 px-1.5 py-0.5 rounded">
                          <Text className="text-primary-600 text-[10px] font-medium">Creator</Text>
                        </View>
                      )}
                      <Text className="text-gray-400 text-xs ml-2">
                        {formatDate(comment.created_at)}
                      </Text>
                    </View>
                    <Text className="text-gray-700 mt-1 leading-5">
                      {comment.content}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {isLoadingComments && (
              <View className="py-4 items-center">
                <ActivityIndicator color="#8B5CF6" />
              </View>
            )}

            {hasMoreComments && comments.length > 0 && !isLoadingComments && (
              <TouchableOpacity
                onPress={() => fetchComments()}
                className="py-3 items-center"
              >
                <Text className="text-primary-600 font-medium">Carregar mais comentários</Text>
              </TouchableOpacity>
            )}

            {/* Spacer for input */}
            <View className="h-20" />
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3">
          <View className="flex-row items-center gap-2">
            <TextInput
              ref={inputRef}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Escreva um comentário..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-gray-900"
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              onPress={handleSendComment}
              disabled={!commentText.trim() || isSendingComment}
              className={`w-11 h-11 rounded-full items-center justify-center ${
                commentText.trim() && !isSendingComment ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              {isSendingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesome
                  name="send"
                  size={16}
                  color={commentText.trim() ? '#fff' : '#9CA3AF'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
