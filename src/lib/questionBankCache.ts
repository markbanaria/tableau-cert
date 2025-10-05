/**
 * IndexedDB utility for caching question banks
 * Provides persistent storage with version management
 */

const DB_NAME = 'TableauCertQuestionBanks';
const DB_VERSION = 1;
const STORE_NAME = 'questionBanks';
const BUNDLE_KEY = 'bundleData';

export interface CachedBundle {
  version: string;
  generatedAt: string;
  questionBanks: Record<string, any>;
  cachedAt: number;
}

class QuestionBankCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        // Server-side or no IndexedDB support
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn('IndexedDB initialization failed:', request.error);
        resolve(); // Don't block on cache failure
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get cached bundle data
   */
  async get(): Promise<CachedBundle | null> {
    await this.init();
    
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(BUNDLE_KEY);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          console.warn('Failed to read from cache:', request.error);
          resolve(null);
        };
      } catch (error) {
        console.warn('Cache read error:', error);
        resolve(null);
      }
    });
  }

  /**
   * Store bundle data in cache
   */
  async set(bundle: CachedBundle): Promise<void> {
    await this.init();
    
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const bundleWithTimestamp: CachedBundle = {
          ...bundle,
          cachedAt: Date.now()
        };

        const request = store.put(bundleWithTimestamp, BUNDLE_KEY);

        request.onsuccess = () => {
          console.log('✅ Question banks cached successfully');
          resolve();
        };

        request.onerror = () => {
          console.warn('Failed to write to cache:', request.error);
          resolve(); // Don't block on cache failure
        };
      } catch (error) {
        console.warn('Cache write error:', error);
        resolve();
      }
    });
  }

  /**
   * Clear the cache
   */
  async clear(): Promise<void> {
    await this.init();
    
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('Cache cleared');
          resolve();
        };

        request.onerror = () => {
          console.warn('Failed to clear cache:', request.error);
          resolve();
        };
      } catch (error) {
        console.warn('Cache clear error:', error);
        resolve();
      }
    });
  }

  /**
   * Check if cached data is still valid
   */
  async isValid(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<boolean> {
    const cached = await this.get();
    
    if (!cached) return false;
    
    const age = Date.now() - cached.cachedAt;
    return age < maxAgeMs;
  }
}

// Export singleton instance
export const questionBankCache = new QuestionBankCache();
