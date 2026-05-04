export interface RealtimeEvent {
  event: string; // 'match:found' | 'match:start' | 'match:result'
  data: any;
  timestamp: Date;
}

export interface RealtimeService {
  publishToUser(userId: string, eventName: string, payload: any): Promise<void>;
  // For local integration tests
  subscribe(userId: string, callback: (event: RealtimeEvent) => void): void;
  unsubscribe(userId: string, callback: Function): void;
}
