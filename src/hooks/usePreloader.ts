import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ClientCache } from '@/lib/clientCache';

export function usePreloader() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Preload quiz data when user is authenticated
      ClientCache.preloadQuizData((session.user as any).id);
    }
  }, [session, status]);
}

// Hook specifically for quiz-related preloading
export function useQuizPreloader(certificationSlug?: string) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Preload quiz history
      ClientCache.preloadQuizData((session.user as any).id);

      // Preload quiz options for specific certification if provided
      if (certificationSlug) {
        preloadQuizOptions(certificationSlug);
      }
    }
  }, [session, status, certificationSlug]);

  const preloadQuizOptions = async (slug: string) => {
    // Check if already cached
    const cached = ClientCache.getCachedQuizOptions(slug);
    if (!cached) {
      try {
        const response = await fetch(`/api/quiz/generate?certification=${slug}`);
        if (response.ok) {
          const options = await response.json();
          ClientCache.cacheQuizOptions(slug, options);
        }
      } catch (error) {
        console.warn('Failed to preload quiz options:', error);
      }
    }
  };
}