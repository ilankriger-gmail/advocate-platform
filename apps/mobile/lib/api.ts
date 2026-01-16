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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
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
      // Se token expirado, fazer logout
      if (response.status === 401) {
        useAuthStore.getState().logout();
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
};

export const challengesApi = {
  getAll: (params?: { status?: string; type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.type) searchParams.set('type', params.type);

    const query = searchParams.toString();
    return api(`/api/mobile/challenges${query ? `?${query}` : ''}`);
  },
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
};

export const eventsApi = {
  getAll: () => api('/api/mobile/events'),
};

export const profileApi = {
  get: () => api('/api/mobile/profile'),
  update: (data: Record<string, string>) =>
    api('/api/mobile/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
