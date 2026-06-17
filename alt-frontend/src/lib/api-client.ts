import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  signup: (data: any) => apiClient.post('/auth/signup', data),
  login: (data: any) => apiClient.post('/auth/login', data),
};

export const scanApi = {
  upload: (data: any) => apiClient.post('/scan/upload', data),
  confirm: (scanJobId: string, data: any) => apiClient.post(`/scan/confirm/${scanJobId}`, data),
};

export const lineupApi = {
  create: (data: any) => apiClient.post('/lineups', data),
};

export const matchApi = {
  resolve: (data: any) => apiClient.post('/match/resolve', data),
};

export const cardApi = {
  getMine: () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return Promise.reject(new Error('No user ID found'));
    return apiClient.get(`/users/${userId}/cards`);
  },
  transfer: (cardId: string, userId: string) => apiClient.patch(`/cards/${cardId}/transfer`, { userId }),
};
