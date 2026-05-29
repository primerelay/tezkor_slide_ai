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
  totalSlides: number;
  totalIncome: number;
  totalAiCost: number;
  profit: number;
  userGrowth: number;
  presentationGrowth: number;
  incomeGrowth: number;
}

export interface ChartData {
  date: string;
  income: number;
  presentations: number;
  users: number;
  aiCost: number;
}

export interface RecentPresentation {
  id: string;
  title: string;
  userName: string;
  createdAt: string;
  slidesCount: number;
}

export interface RecentUser {
  id: number;
  firstName: string;
  telegramId: string;
  language: string;
  credits: number;
  createdAt: string;
  presentationsCount: number;
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

  async getChartData(filter: DateFilter = '1m'): Promise<ChartData[]> {
    const response = await fetch(`${API_BASE}/chart?filter=${filter}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch chart data');
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

  async getRecentUsers(limit = 10): Promise<RecentUser[]> {
    const response = await fetch(`${API_BASE}/users/recent?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },
};
