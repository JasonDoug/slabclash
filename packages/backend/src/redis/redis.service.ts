import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.redis.zadd(key, score, member);
  }

  async zrem(key: string, member: string): Promise<number> {
    return this.redis.zrem(key, member);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redis.zrange(key, start, stop);
  }

  async zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<string[]> {
    return this.redis.zrangebyscore(key, min, max);
  }

  async zrank(key: string, member: string): Promise<number | null> {
    return this.redis.zrank(key, member);
  }

  async zcard(key: string): Promise<number> {
    return this.redis.zcard(key);
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, mode?: 'EX' | 'PX', duration?: number): Promise<string | null> {
    if (mode && duration !== undefined) {
      return this.redis.set(key, value, mode, duration) as Promise<string | null>;
    }
    return this.redis.set(key, value);
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    return this.redis.setex(key, seconds, value);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redis.expire(key, seconds);
  }

  async exists(key: string): Promise<number> {
    return this.redis.exists(key);
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.redis.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.redis.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.redis.smembers(key);
  }

  async eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<any> {
    return this.redis.eval(script, numKeys, ...args);
  }
}
