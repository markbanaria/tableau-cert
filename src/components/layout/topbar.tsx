'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Settings, LogOut, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface TopBarProps {
  onMobileMenuOpen?: () => void
}

export default function TopBar({ onMobileMenuOpen }: TopBarProps) {
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMobileMenuOpen}
        className="md:hidden"
      >
        <ChevronRight className="h-5 w-5 text-gray-900" />
      </Button>
      
      <div className="flex items-center space-x-4 ml-auto">
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
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4 text-gray-600" />
                  <span className="text-gray-900">Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4 text-gray-600" />
                  <span className="text-gray-900">Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4 text-gray-600" />
                <span className="text-gray-900">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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