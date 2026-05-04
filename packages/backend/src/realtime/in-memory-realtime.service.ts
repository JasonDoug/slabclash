import { Injectable, Logger } from '@nestjs/common';
import { RealtimeEvent, RealtimeService } from './realtime.interface';

@Injectable()
export class InMemoryRealtimeService implements RealtimeService {
  private readonly logger = new Logger(InMemoryRealtimeService.name);
  private events = new Map<string, RealtimeEvent[]>();
  private listeners = new Map<string, Array<(event: RealtimeEvent) => void>>();

  async publishToUser(userId: string, eventName: string, payload: any): Promise<void> {
    const event: RealtimeEvent = {
      event: eventName,
      data: payload,
      timestamp: new Date(),
    };

    // Store event
    const userEvents = this.events.get(userId) || [];
    userEvents.push(event);
    this.events.set(userId, userEvents);

    // Notify listeners (for SSE and tests)
    const userListeners = this.listeners.get(userId) || [];
    userListeners.forEach(cb => cb(event));

    this.logger.log(`Published ${eventName} to user ${userId}`);
  }

  subscribe(userId: string, callback: (event: RealtimeEvent) => void): void {
    const userListeners = this.listeners.get(userId) || [];
    userListeners.push(callback);
    this.listeners.set(userId, userListeners);
  }

  unsubscribe(userId: string, callback: Function): void {
    const userListeners = this.listeners.get(userId) || [];
    const idx = userListeners.indexOf(callback as any);
    if (idx !== -1) userListeners.splice(idx, 1);
    this.listeners.set(userId, userListeners);
  }

  // For SSE: get stored events for a user (since connection opened)
  getEventStream(userId: string): RealtimeEvent[] {
    return this.events.get(userId) || [];
  }
}
