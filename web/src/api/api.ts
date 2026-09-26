const API_BASE = '/api/admin';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface Admin {
  id: number;
  phone: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  admin: Admin;
}

export interface StatsResponse {
  totalUsers: number;
  totalPresentations: number;
  totalIncome: number;
}

export interface FeatureStat {
  key: string;
  label: string;
  emoji: string;
  count: number;
  revenue: number;
  aiCost: number;
  profit: number;
}

export interface FeatureStatsResponse {
  features: FeatureStat[];
  totals: { count: number; revenue: number; aiCost: number; profit: number };
}

export interface RecentPresentation {
  id: string;
  title: string;
  userName: string;
  createdAt: string;
  slidesCount: number;
}

export interface UserCreated {
  presentation: number;
  document: number;
  flashcard: number;
  glossary: number;
  crossword: number;
  resume: number;
  quiz: number;
  translator: number;
}

export interface AdminUser {
  id: number;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  language: string;
  credits: number;
  referralCount: number;
  createdAt: string;
  createdAgo: string;
  created: UserCreated;
  totalCreated: number;
}

export type DateFilter = '7d' | '1m' | '2m' | '1y' | 'all';

export const api = {
  async login(phone: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Login failed');
    }
    return response.json();
  },

  async verifyToken(token: string): Promise<{ admin: Admin }> {
    const response = await fetch(`${API_BASE}/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error('Invalid token');
    }
    return response.json();
  },

  async getStats(filter: DateFilter = '1m'): Promise<StatsResponse> {
    const response = await fetch(`${API_BASE}/stats?filter=${filter}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    return response.json();
  },

  async getFeatureStats(filter: DateFilter = '1m'): Promise<FeatureStatsResponse> {
    const response = await fetch(`${API_BASE}/features?filter=${filter}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch feature stats');
    }
    return response.json();
  },

  async getRecentPresentations(limit = 10): Promise<RecentPresentation[]> {
    const response = await fetch(`${API_BASE}/presentations/recent?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch presentations');
    }
    return response.json();
  },

  async getUsers(search = '', limit = 50): Promise<AdminUser[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (search.trim()) params.set('search', search.trim());
    const response = await fetch(`${API_BASE}/users?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },
};
