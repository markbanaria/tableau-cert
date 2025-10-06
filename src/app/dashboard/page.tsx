'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import MainLayout from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">Loading...</p>
        </div>
      </MainLayout>
    )
  }

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {session.user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Total Users</CardTitle>
              <CardDescription className="text-gray-600">Active users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">1,234</p>
              <p className="text-sm text-gray-400 mt-2">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Active Sessions</CardTitle>
              <CardDescription className="text-gray-600">Currently active sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">89</p>
              <p className="text-sm text-gray-400 mt-2">Live now</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">API Calls</CardTitle>
              <CardDescription className="text-gray-600">Total API calls today</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">12.5K</p>
              <p className="text-sm text-gray-400 mt-2">Within normal range</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Activity</CardTitle>
            <CardDescription className="text-gray-600">Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-gray-900 font-bold">New user registration</p>
                  <p className="text-sm text-gray-600">user@example.com joined</p>
                </div>
                <p className="text-sm text-gray-400">2 minutes ago</p>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-gray-900 font-bold">System update completed</p>
                  <p className="text-sm text-gray-600">Version 2.0.1 deployed</p>
                </div>
                <p className="text-sm text-gray-400">1 hour ago</p>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-gray-900 font-bold">Backup completed</p>
                  <p className="text-sm text-gray-600">Daily backup successful</p>
                </div>
                <p className="text-sm text-gray-400">3 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}