import { unstable_cache } from 'next/cache'

// Cache configuration
export const CACHE_TAGS = {
  CERTIFICATIONS: 'certifications',
  QUIZ_OPTIONS: 'quiz-options',
  QUESTIONS: 'questions',
} as const

export const CACHE_DURATIONS = {
  FOUR_HOURS: 60 * 60 * 4, // 4 hours in seconds
  ONE_HOUR: 60 * 60,       // 1 hour in seconds
} as const

// Server-side cache wrapper for certifications
export const getCachedCertifications = unstable_cache(
  async () => {
    // This will be called by the API route
    return null // Placeholder - actual implementation in API route
  },
  ['certifications'],
  {
    revalidate: CACHE_DURATIONS.FOUR_HOURS,
    tags: [CACHE_TAGS.CERTIFICATIONS]
  }
)

// Server-side cache wrapper for quiz options
export const getCachedQuizOptions = unstable_cache(
  async (certificationSlug?: string) => {
    // This will be called by the API route
    return null // Placeholder - actual implementation in API route
  },
  ['quiz-options'],
  {
    revalidate: CACHE_DURATIONS.FOUR_HOURS,
    tags: [CACHE_TAGS.QUIZ_OPTIONS]
  }
)

// Utility to invalidate cache
export async function revalidateCache(tag: string) {
  if (typeof window === 'undefined') {
    const { revalidateTag } = await import('next/cache')
    revalidateTag(tag)
  }
}