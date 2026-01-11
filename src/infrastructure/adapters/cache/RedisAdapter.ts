import { createClient, RedisClientType } from 'redis';
import { ICachePort } from '../../../application/ports/ICachePort';

export class RedisAdapter implements ICachePort {
  private client: RedisClientType;
  private connected = false;

  constructor(url: string) {
    this.client = createClient({ url });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
      this.connected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.connect();
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    await this.connect();
    await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  }

  async delete(key: string): Promise<void> {
    await this.connect();
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    await this.connect();
    const result = await this.client.exists(key);
    return result === 1;
  }

  async clear(): Promise<void> {
    await this.connect();
    await this.client.flushDb();
  }
}

export class InMemoryCache implements ICachePort {
  private cache = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}
