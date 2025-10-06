'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setIsSubmitted(true)
      }
    } catch (error) {
      console.error('Reset password error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-[400px] border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Check your email</CardTitle>
            <CardDescription className="text-gray-600">
              We've sent you a password reset link to {email}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/auth/signin" className="w-full">
              <Button className="w-full bg-gray-900 hover:bg-gray-900/90 text-white">
                Back to Sign In
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px] border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900">Reset Password</CardTitle>
          <CardDescription className="text-gray-600">
            Enter your email address to reset your password
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-900/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Sending reset link...' : 'Send Reset Link'}
            </Button>
            <div className="text-sm text-gray-600 text-center">
              <p>
                Remember your password?{' '}
                <Link href="/auth/signin" className="text-gray-900 font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}