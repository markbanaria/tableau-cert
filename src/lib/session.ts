import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth-options'

export interface AuthenticatedUser {
  id: string
  email: string
  name?: string
  image?: string
}

/**
 * Get the current authenticated user session
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

  return {
    id: (session.user as any).id,
    email: session.user.email!,
    name: session.user.name || undefined,
    image: session.user.image || undefined,
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

/**
 * Get user ID from session - throws if not authenticated
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  return user.id
}