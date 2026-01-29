/**
 * Types for Advocate Platform Mobile App
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// User roles
export type UserRole = 'creator' | 'fan';

// Post types
export type PostType = 'creator' | 'community';
export type PostStatus = 'pending' | 'approved' | 'rejected' | 'blocked';
export type ContentCategory = 'normal' | 'help_request';
export type MediaType = 'none' | 'image' | 'carousel' | 'youtube' | 'instagram';

// Challenge types
export type ChallengeType = 'content' | 'engagement' | 'purchase' | 'referral' | 'social' | 'quiz' | 'participe' | 'engajamento' | 'fisico' | 'atos_amor';
export type ChallengeStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type ParticipationStatus = 'pending' | 'approved' | 'rejected' | 'winner';

// Event status
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

// User
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  twitter_handle: string | null;
  website_url: string | null;
  role: UserRole;
  is_creator: boolean;
  created_at: string;
  updated_at: string;
}

// Post
export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  media_url: string[] | null;
  media_type: MediaType;
  youtube_url: string | null;
  instagram_url: string | null;
  type: PostType;
  status: PostStatus;
  content_category: ContentCategory;
  likes_count: number;
  comments_count: number;
  vote_score: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostWithAuthor extends Post {
  author: Pick<User, 'id' | 'full_name' | 'avatar_url'>;
  is_liked?: boolean;
  is_saved?: boolean;
}

// Comment
export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_deleted: boolean;
  parent_id: string | null;
  likes_count: number;
}

export interface CommentWithAuthor extends Comment {
  author: Pick<User, 'id' | 'full_name' | 'avatar_url'>;
}

// Challenge
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  status: ChallengeStatus;
  reward_description: string | null;
  coin_reward: number;
  start_date: string | null;
  end_date: string | null;
  max_participants: number | null;
  submission_type: 'text' | 'image' | 'video' | 'link' | 'multiple';
  created_at: string;
  updated_at: string;
  participants_count?: number;
}

export interface ChallengeParticipation {
  id: string;
  challenge_id: string;
  user_id: string;
  status: ParticipationStatus;
  submission_text: string | null;
  submission_url: string | null;
  submission_media: string[] | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

// Event
export interface Event {
  id: string;
  title: string;
  description: string;
  location: string | null;
  start_time: string;
  end_time: string;
  max_participants: number | null;
  required_level: number;
  is_virtual: boolean;
  meeting_url: string | null;
  image_url: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
  registrations_count?: number;
  is_registered?: boolean;
}

// Reward
export interface Reward {
  id: string;
  title: string;
  description: string;
  coin_cost: number;
  required_level: number;
  quantity_available: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

// User stats for ranking
export interface UserStats {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_coins: number;
  level: number;
  posts_count: number;
  challenges_won: number;
  rank?: number;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Feed: undefined;
  Challenges: undefined;
  Events: undefined;
  Ranking: undefined;
  Profile: undefined;
};

export type FeedStackParamList = {
  FeedHome: undefined;
  PostDetail: { postId: string };
  NewPost: undefined;
};

export type ChallengesStackParamList = {
  ChallengesHome: undefined;
  ChallengeDetail: { challengeId: string };
  SubmitChallenge: { challengeId: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  SavedPosts: undefined;
  MyPosts: undefined;
  Settings: undefined;
};
