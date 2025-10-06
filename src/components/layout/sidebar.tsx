'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Home, Settings, FileText, BarChart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    {
      title: 'Home',
      icon: Home,
      href: '/',
      children: []
    },
    {
      title: 'Mock Exam',
      icon: FileText,
      href: '/quiz',
      children: []
    },
    {
      title: 'Quick Review',
      icon: BarChart,
      href: '/review',
      children: []
    },
    {
      title: 'Settings',
      icon: Settings,
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
              {/* XM Logo */}
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">XM</span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.innerWidth < 768 && onMobileClose) {
                onMobileClose()
              } else {
                setIsCollapsed(!isCollapsed)
              }
            }}
            className="ml-auto"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-900" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-900" />
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