'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import Logo from '@/components/ui/logo'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowRightOnRectangleIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import CertificationActionsGroup from '@/components/ui/certification-actions-group'

interface TopBarProps {
  onMobileMenuOpen?: () => void
  isSidebarOpen?: boolean
  onSidebarToggle?: () => void
}

export default function TopBar({ onMobileMenuOpen, isSidebarOpen = true, onSidebarToggle }: TopBarProps) {
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between">
      {/* Desktop sidebar toggle section with divider */}
      {!isSidebarOpen && (
        <div className="hidden md:flex items-center h-full">
          <div className="px-6 h-full flex items-center border-r border-gray-200">
            <Button
              variant="outline"
              size="icon"
              onClick={onSidebarToggle}
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-900" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Layout: [24px, draw button 24px width, 16px, logo, flex-grow, avatar, 24px] */}
      <div className="flex items-center w-full md:hidden" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
        {/* Mobile Menu Button - 32px width */}
        <div style={{ width: '32px' }} className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={onMobileMenuOpen}
            className="p-0 h-8 w-8 shadow-none"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-900" />
          </Button>
        </div>

        {/* 8px gap */}
        <div style={{ width: '8px' }} />

        {/* Logo */}
        <Link href="/">
          <Logo />
        </Link>

        {/* Flex grow spacer */}
        <div className="flex-grow" />

        {/* Mobile Avatar */}
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                  <AvatarFallback className="bg-gray-900 text-white">
                    {session.user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white border-gray-200" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold text-gray-900">{session.user?.name || 'User'}</p>
                  <p className="text-xs text-gray-600">{session.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4 text-gray-600" />
                <span className="text-gray-900">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center space-x-2">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-gray-900 text-xs">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gray-900 hover:bg-gray-900/90 text-white text-xs">Register</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-4 px-6">
        {/* Logo - show on desktop only when sidebar is slid out */}
        <Link href="/" className={`${!isSidebarOpen ? '' : 'hidden'}`}>
          <Logo />
        </Link>
      </div>

      <div className="flex items-center space-x-4 hidden md:flex md:ml-auto md:px-6">
        {session ? (
          <>
            <CertificationActionsGroup className="" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                    <AvatarFallback className="bg-gray-900 text-white">
                      {session.user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white border-gray-200" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold text-gray-900">{session.user?.name || 'User'}</p>
                    <p className="text-xs text-gray-600">{session.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4 text-gray-600" />
                  <span className="text-gray-900">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-gray-900">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gray-900 hover:bg-gray-900/90 text-white">Register</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}