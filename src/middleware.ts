import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect /quiz routes
        if (req.nextUrl.pathname.startsWith('/quiz')) {
          return !!token
        }
        // Allow all other routes
        return true
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
)

export const config = {
  matcher: [
    '/quiz/:path*',
    // Don't run middleware on these paths
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ]
}
