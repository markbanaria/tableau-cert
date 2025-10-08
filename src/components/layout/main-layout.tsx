'use client'

import { ReactNode, useState } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from './sidebar'
import TopBar from './topbar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Logo from '@/components/ui/logo'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { data: session, status } = useSession()

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Logged out state - simple layout with AYX logo in top-left and auth buttons in top-right
  if (!session) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
          <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
            <Logo />
          </Link>
          <div className="flex items-center space-x-2">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
        <main className="flex-1 overflow-auto md:p-6">
          {children}
        </main>
      </div>
    )
  }

  // Logged in state - full layout with sidebar and topbar
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-60' : 'md:ml-0'}`}>
        {/* Desktop: Scrollable layout */}
        <div className="hidden md:block md:h-screen md:overflow-auto">
          <TopBar
            onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
            isSidebarOpen={isSidebarOpen}
            onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />
          <main className="md:p-6">
            {children}
          </main>
        </div>

        {/* Mobile: Fixed layout with proper scrolling */}
        <div className="md:hidden flex flex-col h-screen">
          <TopBar
            onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
            isSidebarOpen={isSidebarOpen}
            onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />
          <main className="flex-1 overflow-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}