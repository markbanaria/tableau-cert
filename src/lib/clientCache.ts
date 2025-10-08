// Client-side session cache utilities

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface QuizResult {
  id: string;
  score: number;
  percentage: number;
  completedAt: string;
  timeTaken: number;
  answers: any[];
}

interface QuizHistory {
  items: QuizResult[];
  lastFetched: number;
}

export class ClientCache {
  private static SESSION_DURATION = 1000 * 60 * 60 * 2; // 2 hours
  private static QUIZ_HISTORY_DURATION = 1000 * 60 * 15; // 15 minutes

  // Generic cache methods
  static set<T>(key: string, data: T, duration: number = this.SESSION_DURATION): void {
    if (typeof window === 'undefined') return;

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration
    };

    try {
      sessionStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  static get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const cached = sessionStorage.getItem(key);
      if (!cached) return null;

      const item: CacheItem<T> = JSON.parse(cached);

      // Check if expired
      if (Date.now() > item.expiresAt) {
        this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  static remove(key: string): void {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove cached data:', error);
    }
  }

  static clear(): void {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Quiz-specific cache methods
  static cacheQuizResult(result: QuizResult): void {
    this.set(`quiz-result-${result.id}`, result);
  }

  static getCachedQuizResult(quizId: string): QuizResult | null {
    return this.get<QuizResult>(`quiz-result-${quizId}`);
  }

  static cacheQuizHistory(history: QuizResult[]): void {
    const cacheData: QuizHistory = {
      items: history,
      lastFetched: Date.now()
    };
    this.set('quiz-history', cacheData, this.QUIZ_HISTORY_DURATION);
  }

  static getCachedQuizHistory(): QuizResult[] | null {
    const cached = this.get<QuizHistory>('quiz-history');
    return cached ? cached.items : null;
  }

  static preloadQuizData(userId: string): void {
    // Preload quiz history if not already cached
    const cached = this.getCachedQuizHistory();
    if (!cached) {
      this.fetchAndCacheQuizHistory();
    }
  }

  private static async fetchAndCacheQuizHistory(): Promise<void> {
    try {
      const response = await fetch('/api/quiz/sessions');
      if (response.ok) {
        const data = await response.json();
        this.cacheQuizHistory(data.quizzes || []);
      }
    } catch (error) {
      console.warn('Failed to preload quiz history:', error);
    }
  }

  // Quiz options cache
  static cacheQuizOptions(certificationSlug: string, options: any): void {
    this.set(`quiz-options-${certificationSlug}`, options);
  }

  static getCachedQuizOptions(certificationSlug: string): any | null {
    return this.get(`quiz-options-${certificationSlug}`);
  }

  // Certification cache
  static cacheCertifications(certifications: any[]): void {
    this.set('certifications', certifications);
  }

  static getCachedCertifications(): any[] | null {
    return this.get<any[]>('certifications');
  }
}