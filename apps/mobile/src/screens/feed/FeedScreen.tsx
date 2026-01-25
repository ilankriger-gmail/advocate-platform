import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Avatar } from '../../components/ui';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, shadows } from '../../utils/theme';
import { PostWithAuthor, FeedStackParamList } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FeedScreenProps = {
  navigation: NativeStackNavigationProp<FeedStackParamList, 'FeedHome'>;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function FeedScreen({ navigation }: FeedScreenProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Check if user has liked each post
      if (user && data) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);

        const likedPostIds = new Set(likes?.map((l) => l.post_id) || []);

        const postsWithLikes = data.map((post) => ({
          ...post,
          is_liked: likedPostIds.has(post.id),
        }));

        setPosts(postsWithLikes as PostWithAuthor[]);
      } else {
        setPosts((data as PostWithAuthor[]) || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, []);

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    // Optimistic update
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              is_liked: !isLiked,
              likes_count: post.likes_count + (isLiked ? -1 : 1),
            }
          : post
      )
    );

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
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: isLiked,
                likes_count: post.likes_count + (isLiked ? 1 : -1),
              }
            : post
        )
      );
    }
  };

  const renderPost = ({ item: post }: { item: PostWithAuthor }) => (
    <Card style={styles.postCard} padding="none">
      {/* Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.authorInfo}>
          <Avatar uri={post.author?.avatar_url} name={post.author?.full_name} size="md" />
          <View style={styles.authorText}>
            <Text style={styles.authorName}>{post.author?.full_name || 'Usuário'}</Text>
            <Text style={styles.postTime}>
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.gray[500]} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <TouchableOpacity
        onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
        activeOpacity={0.9}
      >
        <Text style={styles.postTitle}>{post.title}</Text>
        {post.content && (
          <Text style={styles.postContent} numberOfLines={3}>
            {post.content}
          </Text>
        )}

        {/* Media */}
        {post.media_url && post.media_url.length > 0 && (
          <Image
            source={{ uri: post.media_url[0] }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(post.id, post.is_liked || false)}
        >
          <Ionicons
            name={post.is_liked ? 'heart' : 'heart-outline'}
            size={24}
            color={post.is_liked ? colors.error.main : colors.gray[600]}
          />
          <Text style={styles.actionText}>{post.likes_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
        >
          <Ionicons name="chatbubble-outline" size={22} color={colors.gray[600]} />
          <Text style={styles.actionText}>{post.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={24} color={colors.gray[600]} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity
          style={styles.newPostButton}
          onPress={() => navigation.navigate('NewPost')}
        >
          <Ionicons name="add-circle" size={32} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[600]]}
            tintColor={colors.primary[600]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>Nenhum post ainda</Text>
              <Text style={styles.emptySubtitle}>
                Seja o primeiro a compartilhar algo!
              </Text>
            </View>
          ) : null
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  newPostButton: {
    padding: spacing.xs,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  postCard: {
    marginBottom: spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorText: {
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
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  postContent: {
    fontSize: fontSize.base,
    color: colors.gray[700],
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 250,
    backgroundColor: colors.gray[200],
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginLeft: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[500],
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
});
