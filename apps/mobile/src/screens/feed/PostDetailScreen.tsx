import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Avatar, Card } from '../../components/ui';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';
import { PostWithAuthor, CommentWithAuthor, FeedStackParamList } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Props = NativeStackScreenProps<FeedStackParamList, 'PostDetail'>;

export function PostDetailScreen({ route, navigation }: Props) {
  const { postId } = route.params;
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      // Check if liked
      if (user) {
        const { data: like } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single();

        setPost({ ...data, is_liked: !!like } as PostWithAuthor);
      } else {
        setPost(data as PostWithAuthor);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          author:users!post_comments_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments((data as CommentWithAuthor[]) || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPost();
    fetchComments();
  }, []);

  const handleLike = async () => {
    if (!user || !post) return;

    const isLiked = post.is_liked;

    // Optimistic update
    setPost({
      ...post,
      is_liked: !isLiked,
      likes_count: post.likes_count + (isLiked ? -1 : 1),
    });

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase.from('post_likes').insert({
          post_id: postId,
          user_id: user.id,
        });
      }
    } catch (error) {
      // Revert on error
      setPost({
        ...post,
        is_liked: isLiked,
        likes_count: post.likes_count,
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select(`
          *,
          author:users!post_comments_user_id_fkey(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      setComments([...comments, data as CommentWithAuthor]);
      setNewComment('');

      // Update post comment count
      if (post) {
        setPost({ ...post, comments_count: post.comments_count + 1 });
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Post Content */}
          <Card style={styles.postCard}>
            {/* Author */}
            <View style={styles.authorRow}>
              <Avatar uri={post.author?.avatar_url} name={post.author?.full_name} size="md" />
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{post.author?.full_name || 'Usuário'}</Text>
                <Text style={styles.postTime}>
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </Text>
              </View>
            </View>

            {/* Content */}
            <Text style={styles.postTitle}>{post.title}</Text>
            {post.content && <Text style={styles.postContent}>{post.content}</Text>}

            {/* Media */}
            {post.media_url && post.media_url.length > 0 && (
              <Image
                source={{ uri: post.media_url[0] }}
                style={styles.postImage}
                resizeMode="cover"
              />
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <Ionicons
                  name={post.is_liked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={post.is_liked ? colors.error.main : colors.gray[600]}
                />
                <Text style={styles.actionText}>{post.likes_count}</Text>
              </TouchableOpacity>

              <View style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={22} color={colors.gray[600]} />
                <Text style={styles.actionText}>{post.comments_count}</Text>
              </View>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Comments */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comentários ({comments.length})
            </Text>

            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Avatar
                  uri={comment.author?.avatar_url}
                  name={comment.author?.full_name}
                  size="sm"
                />
                <View style={styles.commentContent}>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>
                      {comment.author?.full_name || 'Usuário'}
                    </Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                  </View>
                  <Text style={styles.commentTime}>
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </Text>
                </View>
              </View>
            ))}

            {comments.length === 0 && (
              <Text style={styles.noComments}>Nenhum comentário ainda. Seja o primeiro!</Text>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <Avatar uri={user?.avatar_url} name={user?.full_name} size="sm" />
          <TextInput
            style={styles.commentInput}
            placeholder="Escreva um comentário..."
            placeholderTextColor={colors.gray[400]}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newComment.trim() || submitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
          >
            <Ionicons
              name="send"
              size={20}
              color={newComment.trim() && !submitting ? colors.primary[600] : colors.gray[400]}
            />
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  postCard: {
    margin: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorInfo: {
    marginLeft: spacing.sm,
  },
  authorName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  postTime: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  postTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  postContent: {
    fontSize: fontSize.base,
    color: colors.gray[700],
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.gray[200],
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginLeft: spacing.xs,
  },
  commentsSection: {
    padding: spacing.md,
  },
  commentsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  commentContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  commentBubble: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  commentAuthor: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  commentText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    lineHeight: 20,
  },
  commentTime: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  noComments: {
    textAlign: 'center',
    color: colors.gray[500],
    fontSize: fontSize.sm,
    paddingVertical: spacing.xl,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  commentInput: {
    flex: 1,
    marginHorizontal: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    fontSize: fontSize.sm,
    maxHeight: 100,
    color: colors.gray[900],
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
