'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon, HomeIcon, Cog6ToothIcon, DocumentTextIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import AYXLogo from '@/components/ui/ayx-logo'

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    {
      title: 'Home',
      icon: HomeIcon,
      href: '/',
      children: []
    },
    {
      title: 'Mock Exam',
      icon: DocumentTextIcon,
      href: '/quiz',
      children: []
    },
    {
      title: 'Quick Review',
      icon: ChartBarIcon,
      href: '/review',
      children: []
    },
    {
      title: 'Settings',
      icon: Cog6ToothIcon,
      href: '/settings',
      children: []
    }
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed md:static h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 ${
          isCollapsed ? 'w-16' : 'w-60'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <AYXLogo />
            </div>
          )}
          <Button
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            size="sm"
            className="w-8 h-8 p-0 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 text-gray-900" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4 text-gray-900" />
            )}
          </Button>
        </div>

      <nav className="p-4">
        {isCollapsed ? (
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Link key={item.title} href={item.href}>
                <Button variant="ghost" size="icon" className="w-full">
                  <item.icon className="h-4 w-4 text-gray-900" />
                </Button>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link key={item.title} href={item.href}>
                <Button variant="ghost" className="w-full justify-start">
                  <item.icon className="mr-2 h-4 w-4 text-gray-900" />
                  <span className="text-gray-900">{item.title}</span>
                </Button>
              </Link>
            ))}
          </div>
        )}
      </nav>
      </div>
    </>
  )
}