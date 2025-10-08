'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BookOpenIcon, PlayIcon, AcademicCapIcon, ClockIcon } from '@heroicons/react/24/outline'

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

interface MyCertificationsPreviewProps {
  className?: string
  compact?: boolean
}

export default function MyCertificationsPreview({ className = '', compact = false }: MyCertificationsPreviewProps) {
  const [userCertifications, setUserCertifications] = useState<UserCertification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserCertifications = async () => {
      try {
        const response = await fetch('/api/user-certifications')
        if (response.ok) {
          const data = await response.json()
          setUserCertifications(data.userCertifications || [])
        }
      } catch (error) {
        console.error('Error fetching user certifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserCertifications()
  }, [])

  // Compact mode for topbar
  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={`flex items-center gap-2 ${className}`}>
            <AcademicCapIcon className="h-4 w-4" />
            My Certifications
            {userCertifications.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {userCertifications.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 bg-white border-gray-200 p-0" align="end" forceMount>
          {loading ? (
            <div className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : userCertifications.length === 0 ? (
            <div className="p-4">
              <div className="text-center py-6">
                <AcademicCapIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">No certifications started yet</p>
                <Link href="/certifications">
                  <Button size="sm" className="w-full">
                    Browse Certifications
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AcademicCapIcon className="h-4 w-4" />
                <span className="text-sm font-medium">My Certifications</span>
              </div>
              <div className="space-y-3">
                {userCertifications.slice(0, 3).map((cert) => (
                  <div key={cert.user_certification_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                    <div className="flex gap-1 ml-2">
                      <Link href={`/certifications/${cert.tracks}/practice`}>
                        <Button size="sm" variant="outline" className="px-2 py-1 h-7">
                          <BookOpenIcon className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Link href={`/certifications/${cert.tracks}/exam`}>
                        <Button size="sm" variant="outline" className="px-2 py-1 h-7">
                          <PlayIcon className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}

                {userCertifications.length > 3 && (
                  <div className="text-center pt-2">
                    <Link href="/certifications">
                      <Button variant="ghost" size="sm" className="text-xs">
                        View all ({userCertifications.length})
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100">
                  <Link href="/certifications">
                    <Button size="sm" variant="outline" className="w-full">
                      Browse More Certifications
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (userCertifications.length === 0) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AcademicCapIcon className="h-4 w-4" />
            My Certifications
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-6">
            <AcademicCapIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">No certifications started yet</p>
            <Link href="/certifications">
              <Button size="sm" className="w-full">
                Browse Certifications
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AcademicCapIcon className="h-4 w-4" />
          My Certifications
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {userCertifications.slice(0, 3).map((cert) => (
            <div key={cert.user_certification_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
              <div className="flex gap-1 ml-2">
                <Link href={`/certifications/${cert.tracks}/practice`}>
                  <Button size="sm" variant="outline" className="px-2 py-1 h-7">
                    <BookOpenIcon className="h-3 w-3" />
                  </Button>
                </Link>
                <Link href={`/certifications/${cert.tracks}/exam`}>
                  <Button size="sm" variant="outline" className="px-2 py-1 h-7">
                    <PlayIcon className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {userCertifications.length > 3 && (
            <div className="text-center pt-2">
              <Link href="/certifications">
                <Button variant="ghost" size="sm" className="text-xs">
                  View all ({userCertifications.length})
                </Button>
              </Link>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <Link href="/certifications">
              <Button size="sm" variant="outline" className="w-full">
                Browse More Certifications
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}