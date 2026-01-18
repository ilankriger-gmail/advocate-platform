import { useAuthStore } from '../stores/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function api<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<{ data?: T; error?: string }> {
  const { requireAuth = true, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Adicionar token de autenticação se necessário
  if (requireAuth) {
    const session = useAuthStore.getState().session;
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      return { error: 'Não autenticado' };
    }
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Se token expirado, fazer logout (apenas se ainda estiver autenticado)
      if (response.status === 401) {
        const { isAuthenticated, logout } = useAuthStore.getState();
        if (isAuthenticated) {
          logout();
        }
      }
      return { error: data.error || 'Erro na requisição' };
    }

    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Erro de conexão' };
  }
}

// Helpers para cada endpoint
export const feedApi = {
  getFeed: (params?: { cursor?: string; limit?: number; type?: string; sort?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.type) searchParams.set('type', params.type);
    if (params?.sort) searchParams.set('sort', params.sort);

    const query = searchParams.toString();
    return api(`/api/mobile/feed${query ? `?${query}` : ''}`);
  },
  vote: (postId: string, value: number) =>
    api('/api/mobile/votes', {
      method: 'POST',
      body: JSON.stringify({ postId, value }),
    }),
};

export const postsApi = {
  getById: (id: string) => api(`/api/mobile/posts/${id}`),
  getComments: (postId: string, params?: { cursor?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return api(`/api/mobile/posts/${postId}/comments${query ? `?${query}` : ''}`);
  },
  createComment: (postId: string, content: string) =>
    api(`/api/mobile/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};

export const challengesApi = {
  getAll: (params?: { status?: string; type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.type) searchParams.set('type', params.type);

    const query = searchParams.toString();
    return api(`/api/mobile/challenges${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api(`/api/mobile/challenges/${id}`),
  getMyParticipations: () => api('/api/mobile/challenges/my-participations'),
  participate: (data: {
    challengeId: string;
    resultValue?: number;
    videoProofUrl: string;
    instagramProofUrl?: string;
  }) =>
    api('/api/mobile/challenges/participate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const rewardsApi = {
  getAll: (params?: { type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);

    const query = searchParams.toString();
    return api(`/api/mobile/rewards${query ? `?${query}` : ''}`);
  },
  getMyClaims: () => api('/api/mobile/rewards/my-claims'),
  claim: (data: {
    rewardId: string;
    selectedOption?: string;
    deliveryInfo?: {
      name?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      phone?: string;
      pixKey?: string;
      pixKeyType?: 'cpf' | 'email' | 'phone' | 'random';
    };
  }) =>
    api('/api/mobile/rewards/claim', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const eventsApi = {
  getAll: () => api('/api/mobile/events'),
  getMyRegistrations: () => api('/api/mobile/events/my-registrations'),
  register: (eventId: string) =>
    api('/api/mobile/events/register', {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    }),
  cancelRegistration: (eventId: string) =>
    api('/api/mobile/events/register', {
      method: 'DELETE',
      body: JSON.stringify({ eventId }),
    }),
};

export const profileApi = {
  get: () => api('/api/mobile/profile'),
  update: (data: Record<string, string>) =>
    api('/api/mobile/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
