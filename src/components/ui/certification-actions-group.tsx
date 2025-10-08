'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { AcademicCapIcon, ClockIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface UserCertification {
  user_certification_id: string
  status: 'taking' | 'completed'
  started_at: string
  completed_at?: string
  certification_id: string
  name: string
  description: string
  tracks: string
}

interface CertificationActionsGroupProps {
  className?: string
}

export default function CertificationActionsGroup({ className = '' }: CertificationActionsGroupProps) {
  const [userCertifications, setUserCertifications] = useState<UserCertification[]>([])
  const [selectedCert, setSelectedCert] = useState<UserCertification | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserCertifications = async () => {
      try {
        const response = await fetch('/api/user-certifications')
        if (response.ok) {
          const data = await response.json()
          const certs = data.userCertifications || []
          setUserCertifications(certs)
          // Auto-select the first "taking" certification or first one
          const activeCert = certs.find((c: UserCertification) => c.status === 'taking') || certs[0]
          setSelectedCert(activeCert || null)
        }
      } catch (error) {
        console.error('Error fetching user certifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserCertifications()
  }, [])

  if (loading) {
    return (
      <div className={`flex items-center rounded-md border border-input bg-background ${className}`}>
        <div className="animate-pulse flex items-center gap-2 px-3 py-2">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="w-px bg-border h-8"></div>
        <div className="animate-pulse h-8 w-16 bg-gray-200 rounded-r-md"></div>
        <div className="animate-pulse h-8 w-16 bg-gray-200"></div>
      </div>
    )
  }

  if (userCertifications.length === 0) {
    return (
      <div className={`flex items-center ${className}`}>
        <Link href="/certifications">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <AcademicCapIcon className="h-4 w-4" />
            Browse Certifications
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className={`flex items-center rounded-md border border-input bg-background ${className}`}>
      {/* My Certifications Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 px-3 py-2 rounded-l-md rounded-r-none border-0 h-auto hover:bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <span className="text-sm font-medium">
              {selectedCert ? selectedCert.name.split(' ').slice(0, 2).join(' ') : 'My Certifications'}
            </span>
            {userCertifications.length > 1 && (
              <Badge variant="secondary" className="text-xs">
                {userCertifications.length}
              </Badge>
            )}
            <ChevronDownIcon className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 bg-white border-gray-200 p-0" align="start" forceMount>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AcademicCapIcon className="h-4 w-4" />
              <span className="text-sm font-medium">My Certifications</span>
            </div>
            <div className="space-y-2">
              {userCertifications.map((cert) => (
                <DropdownMenuItem
                  key={cert.user_certification_id}
                  className="cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 focus:bg-gray-100"
                  onClick={() => setSelectedCert(cert)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {cert.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={cert.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {cert.status === 'completed' ? 'Completed' : 'In Progress'}
                        </Badge>
                        {cert.status === 'taking' && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            Started {new Date(cert.started_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedCert?.user_certification_id === cert.user_certification_id && (
                      <div className="h-2 w-2 bg-blue-600 rounded-full ml-2"></div>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 mt-3">
              <Link href="/certifications">
                <Button size="sm" variant="outline" className="w-full">
                  Browse More Certifications
                </Button>
              </Link>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Separator */}
      <div className="w-px bg-border h-8"></div>

      {/* Review Button */}
      <Link href={selectedCert ? `/certifications/${selectedCert.tracks}/review` : '/certifications'}>
        <Button
          size="sm"
          className="rounded-none border-0 h-auto px-3 py-2 bg-review hover:bg-review/90 text-white"
          disabled={!selectedCert}
        >
          Review
        </Button>
      </Link>

      {/* Mock Exam Button */}
      <Link href={selectedCert ? `/certifications/${selectedCert.tracks}/quiz` : '/certifications'}>
        <Button
          size="sm"
          className="rounded-l-none rounded-r-md border-0 h-auto px-3 py-2"
          disabled={!selectedCert}
        >
          Mock Exam
        </Button>
      </Link>
    </div>
  )
}