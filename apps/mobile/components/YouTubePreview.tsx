import { View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface YouTubePreviewProps {
  url: string;
  title?: string;
}

// Extrair o ID do vídeo do YouTube da URL
function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // Formatos possíveis:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID

  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export default function YouTubePreview({ url, title }: YouTubePreviewProps) {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <TouchableOpacity
        onPress={() => Linking.openURL(url)}
        className="bg-gray-100 rounded-xl p-4 flex-row items-center"
      >
        <View className="w-12 h-12 bg-red-500 rounded-xl items-center justify-center mr-3">
          <FontAwesome name="youtube-play" size={24} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold" numberOfLines={2}>
            {title || 'Assistir vídeo'}
          </Text>
          <Text className="text-gray-500 text-xs mt-1">
            Toque para abrir no YouTube
          </Text>
        </View>
        <FontAwesome name="external-link" size={16} color="#6B7280" />
      </TouchableOpacity>
    );
  }

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  const handlePress = () => {
    Linking.openURL(url);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      className="rounded-xl overflow-hidden bg-black"
    >
      {/* Thumbnail */}
      <View className="relative">
        <Image
          source={{ uri: thumbnailUrl }}
          className="w-full aspect-video"
          resizeMode="cover"
        />

        {/* Overlay com botão de play */}
        <View className="absolute inset-0 bg-black/30 items-center justify-center">
          <View className="w-16 h-16 bg-red-600 rounded-full items-center justify-center shadow-lg">
            <FontAwesome name="play" size={28} color="#fff" style={{ marginLeft: 4 }} />
          </View>
        </View>

        {/* Badge do YouTube */}
        <View className="absolute bottom-2 right-2 bg-red-600 rounded px-2 py-1 flex-row items-center">
          <FontAwesome name="youtube-play" size={12} color="#fff" />
          <Text className="text-white text-xs font-bold ml-1">YouTube</Text>
        </View>
      </View>

      {/* Título */}
      {title && (
        <View className="bg-gray-900 px-4 py-3">
          <Text className="text-white font-medium" numberOfLines={2}>
            {title}
          </Text>
          <Text className="text-gray-400 text-xs mt-1">
            Toque para assistir
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
