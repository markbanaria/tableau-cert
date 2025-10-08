import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export interface AuthenticatedRequest extends NextRequest {
  userId: string
  user: {
    id: string
    email: string
    name?: string
  }
}

/**
 * Middleware to authenticate API requests and extract user information
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get the JWT token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token || !token.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Add user information to the request
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.userId = token.id as string
    authenticatedRequest.user = {
      id: token.id as string,
      email: token.email!,
      name: token.name || undefined
    }

    return await handler(authenticatedRequest)
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )
  }
}

/**
 * Higher-order function to wrap API routes with authentication
 */
export function requireAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return (request: NextRequest) => withAuth(request, handler)
}