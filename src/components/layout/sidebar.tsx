'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import Logo from '@/components/ui/logo'

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
  isOpen?: boolean
  onToggle?: () => void
}

export default function Sidebar({ isMobileOpen = false, onMobileClose, isOpen = true, onToggle }: SidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      title: 'Home',
      href: '/',
      children: []
    },
    {
      title: 'Certifications',
      href: '/certifications',
      children: []
    },
    {
      title: 'Exam History',
      href: '/quiz-history',
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
        className={`fixed h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 w-60 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isOpen ? 'md:translate-x-0' : 'md:-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              // On mobile, close the mobile menu; on desktop, toggle sidebar
              if (window.innerWidth < 768) {
                onMobileClose?.();
              } else {
                onToggle?.();
              }
            }}
            size="sm"
            className="w-8 h-8 p-0 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <ChevronLeftIcon className="h-4 w-4 text-gray-900" />
          </Button>
        </div>

        <nav className="p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))

              return (
                <Link key={item.title} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      isActive
                        ? 'bg-gray-100 hover:bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>{item.title}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}