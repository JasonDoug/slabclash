export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
}
