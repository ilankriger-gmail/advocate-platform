/**
 * Tipos relacionados a Stories
 */

// Tipo de mídia do story
export type StoryMediaType = 'image' | 'carousel' | 'youtube' | 'instagram';

// Tipo de conteúdo vinculado
export type LinkedContentType = 'challenge' | 'reward' | 'ranking';

// Story base
export interface Story {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  media_url: string[];
  media_type: StoryMediaType;
  youtube_url: string | null;
  instagram_url: string | null;
  caption: string | null;
  position: number;
  linked_content_type: LinkedContentType | null;
  linked_content_id: string | null;
  created_at: string;
  updated_at: string;
}

// Visualização de story
export interface StoryView {
  id: string;
  story_id: string;
  user_id: string;
  viewed_at: string;
}

// Story com dados do autor
export interface StoryWithAuthor extends Story {
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Agrupamento de stories por criador (para a barra)
export interface CreatorStories {
  creator: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  stories: Story[];
  hasUnviewed: boolean;
  lastStoryAt: string;
}

// Dados para criar story
export interface CreateStoryData {
  title?: string;
  content?: string;
  media_url?: string[];
  media_type: StoryMediaType;
  youtube_url?: string;
  instagram_url?: string;
  caption?: string;
  linked_content_type?: LinkedContentType;
  linked_content_id?: string;
}

// Dados de conteúdo vinculado para exibição
export interface LinkedContent {
  type: LinkedContentType;
  id: string;
  title: string;
  image?: string;
  subtitle?: string;
}

// Dados para atualizar story
export interface UpdateStoryData {
  id: string;
  title?: string;
  content?: string;
  caption?: string;
  position?: number;
}

// Estado do viewer de stories
export interface StoryViewerState {
  creatorIndex: number;
  storyIndex: number;
  isPaused: boolean;
  progress: number;
}
