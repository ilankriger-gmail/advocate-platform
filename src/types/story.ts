/**
 * Tipos relacionados a Stories
 */

// Tipo de mídia do story
export type StoryMediaType = 'image' | 'carousel';

// Story base
export interface Story {
  id: string;
  user_id: string;
  media_url: string[];
  media_type: StoryMediaType;
  caption: string | null;
  position: number;
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
  media_url: string[];
  media_type: StoryMediaType;
  caption?: string;
}

// Dados para atualizar story
export interface UpdateStoryData {
  id: string;
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
