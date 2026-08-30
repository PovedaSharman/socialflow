import { Redis } from 'ioredis';

// Create a mock Redis implementation for testing environments
class MockRedis {
  private data: Map<string, any> = new Map();

  async get(key: string) {
    return this.data.get(key);
  }

  async set(key: string, value: any, ...args: any[]) {
    if (args.includes('NX') && this.data.has(key)) {
      return null;
    }
    this.data.set(key, value);
    return 'OK';
  }

  async getdel(key: string) {
    const value = this.data.get(key);
    this.data.delete(key);
    return value;
  }

  async del(key: string) {
    this.data.delete(key);
    return 1;
  }

  async eval(
    script: string,
    _numberOfKeys: number,
    key: string,
    ...args: any[]
  ) {
    if (this.data.get(key) !== args[0]) {
      return 0;
    }
    if (script.includes("'completed'")) {
      this.data.set(key, 'completed');
      return 1;
    }
    this.data.delete(key);
    return 1;
  }

  // Add other Redis methods as needed for your tests
}

// Use real Redis if REDIS_URL is defined, otherwise use MockRedis
export const ioRedis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 10000,
    })
  : (new MockRedis() as unknown as Redis); // Type cast to Redis to maintain interface compatibility
