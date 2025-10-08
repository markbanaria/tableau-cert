'use client'

import { signIn } from 'next-auth/react'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import LogoReverse from '@/components/ui/logo-reverse'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const mockExam = searchParams.get('mockExam')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/'
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else if (result?.ok) {
        router.push('/')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
        <Card className="w-full border-gray-200 overflow-hidden pt-0">
        <div className="bg-review border-b border-gray-200 h-30 relative">
          <div className="flex items-center h-full">
            <div className="pl-8">
              <Link href="/" className="block">
                <LogoReverse />
              </Link>
            </div>
            <div className="absolute left-1/3 top-0 w-2/3 h-full opacity-20">
              <img
                src="/pattern.png"
                alt=""
                className="w-full h-full object-cover object-left"
              />
            </div>
          </div>
        </div>
        <CardHeader className="pt-0">
          <CardTitle className="text-lg text-gray-900">Sign In</CardTitle>
          <CardDescription className="text-gray-600">
            Enter your email and password to sign in
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            {registered && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">Account created successfully! Please sign in.</p>
              </div>
            )}

            {mockExam && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-600">Please sign in to take mock exams and track your progress.</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2 mt-4">
                <Label htmlFor="email" className="text-gray-900">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <div className="mt-6">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="pt-6 flex-col items-start space-y-2">
            <div className="text-sm text-gray-600 text-left w-full">
              <Link href="/auth/reset-password" className="text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="text-sm text-gray-600 text-left w-full">
              <p>
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-primary hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-[400px]">
          <Card className="w-full border-gray-200">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Sign In</CardTitle>
              <CardDescription className="text-gray-600">Loading...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}