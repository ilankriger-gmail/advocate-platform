import { View, Text, Image, TouchableOpacity, Pressable, Share } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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

interface PostCardProps {
  post: Post;
  onVote?: (postId: string, value: number) => void;
  onPress?: () => void;
  onComment?: () => void;
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
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('pt-BR');
}

// Extrair ID do YouTube para thumbnail
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

export default function PostCard({ post, onVote, onPress, onComment }: PostCardProps) {
  const hasMedia = post.media_url || post.youtube_url || post.instagram_url;
  const youtubeId = post.youtube_url ? extractYouTubeId(post.youtube_url) : null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.title || ''}\n\n${post.content?.substring(0, 200)}...`,
        title: post.title || 'Compartilhar post',
      });
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden border border-gray-100"
    >
      {/* Header */}
      <View className="flex-row items-center p-4 pb-3">
        {post.author?.avatar_url ? (
          <Image
            source={{ uri: post.author.avatar_url }}
            className="w-10 h-10 rounded-full bg-gray-200"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
            <Text className="text-primary-600 font-semibold text-sm">
              {getInitials(post.author?.full_name || 'U')}
            </Text>
          </View>
        )}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="font-semibold text-gray-900">
              {post.author?.full_name || 'Usuário'}
            </Text>
            {post.author?.is_creator && (
              <View className="ml-2 bg-primary-100 px-2 py-0.5 rounded-full">
                <Text className="text-primary-600 text-xs font-medium">Creator</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-500 text-xs mt-0.5">
            {formatDate(post.created_at)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="px-4 pb-3">
        {post.title && (
          <Text className="font-semibold text-gray-900 mb-1">
            {post.title}
          </Text>
        )}
        {post.content && (
          <Text className="text-gray-700 leading-5" numberOfLines={4}>
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

      {/* YouTube Video with Thumbnail */}
      {post.youtube_url && youtubeId && (
        <View className="w-full aspect-video bg-gray-900 relative">
          <Image
            source={{ uri: `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/30 items-center justify-center">
            <View className="w-14 h-14 rounded-full bg-red-600 items-center justify-center">
              <FontAwesome name="play" size={22} color="#fff" style={{ marginLeft: 3 }} />
            </View>
          </View>
          <View className="absolute bottom-2 right-2 bg-red-600 px-2 py-1 rounded flex-row items-center">
            <FontAwesome name="youtube-play" size={10} color="#fff" />
            <Text className="text-white text-[10px] font-bold ml-1">YouTube</Text>
          </View>
        </View>
      )}

      {/* Video indicator (non-YouTube) */}
      {post.media_url && post.media_type === 'video' && !post.youtube_url && (
        <View className="w-full aspect-video bg-gray-900 items-center justify-center">
          <View className="w-16 h-16 rounded-full bg-white/90 items-center justify-center">
            <FontAwesome name="play" size={24} color="#8B5CF6" />
          </View>
        </View>
      )}

      {/* Instagram indicator */}
      {post.instagram_url && !post.youtube_url && !post.media_url && (
        <View className="mx-4 mb-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-3">
          <View className="flex-row items-center gap-2">
            <FontAwesome name="instagram" size={20} color="#fff" />
            <Text className="text-white font-medium text-sm">Ver no Instagram</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
        {/* Votes */}
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => onVote?.(post.id, post.user_vote === 1 ? 0 : 1)}
            className="p-2"
          >
            <FontAwesome
              name={post.user_vote === 1 ? 'heart' : 'heart-o'}
              size={20}
              color={post.user_vote === 1 ? '#F472B6' : '#9CA3AF'}
            />
          </TouchableOpacity>
          <Text className="text-gray-700 font-medium ml-1">
            {post.vote_score || 0}
          </Text>
        </View>

        {/* Comments */}
        <TouchableOpacity
          onPress={onComment || onPress}
          className="flex-row items-center ml-6"
        >
          <FontAwesome name="comment-o" size={18} color="#9CA3AF" />
          <Text className="text-gray-500 ml-2">
            {post.comments_count || 0}
          </Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity onPress={handleShare} className="ml-auto p-2">
          <FontAwesome name="share" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}
