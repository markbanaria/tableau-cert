'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftIcon, BookOpenIcon, PlayIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/layout/main-layout';
import CertificationCard from '@/components/ui/certification-card';
import { ClientCache } from '@/lib/clientCache';

interface Certification {
  id: string;
  name: string;
  description: string;
  vendor: string;
  level: 'Associate' | 'Professional' | 'Specialist' | 'Expert';
  duration: number;
  questionCount: number;
  passingScore: number;
  domains: number;
  availableQuestions: number;
  coverage: number;
  color: string;
  icon: string;
  status: 'available' | 'coming_soon' | 'beta';
  sections?: Array<{ name: string; id: string }>;
}


export default function CertificationDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const certificationSlug = params.certification as string;
  const [certification, setCertification] = useState<Certification | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCertification, setUserCertification] = useState<any>(null);
  const [userCertificationLoading, setUserCertificationLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadCertificationData();
  }, [certificationSlug, session]);

  useEffect(() => {
    if (session?.user && certification) {
      loadUserCertificationStatus();
    }
  }, [session, certification]);

  const loadCertificationData = async () => {
    try {
      setLoading(true);

      // Get data from the general certifications list (more complete data)
      const listResponse = await fetch('/api/certifications');
      if (listResponse.ok) {
        const listData = await listResponse.json();
        const cert = listData.certifications.find((c: Certification) => c.id === certificationSlug);
        if (cert) {
            setCertification(cert);
        } else {
          console.error('Certification not found');
        }
      } else {
        console.error('Failed to load certification data');
      }
    } catch (error) {
      console.error('Error loading certification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserCertificationStatus = async () => {
    if (!certification?.id) return;

    try {
      setUserCertificationLoading(true);

      // Check cache first and display it immediately for better UX
      if (ClientCache.hasCachedUserCertification(certification.id)) {
        const cachedUserCert = ClientCache.getCachedUserCertification(certification.id);
        console.log('Using cached user certification status');
        setUserCertification(cachedUserCert);
        setUserCertificationLoading(false);
      }

      // Always fetch fresh data
      const response = await fetch(`/api/user-certifications/${certification.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserCertification(data.userCertification);
        // Cache the result (null or actual data)
        ClientCache.cacheUserCertification(certification.id, data.userCertification);
      } else if (response.status === 404) {
        // User hasn't started this certification
        setUserCertification(null);
        ClientCache.cacheUserCertification(certification.id, null);
      }
    } catch (error) {
      console.error('Error loading user certification status:', error);
    } finally {
      setUserCertificationLoading(false);
    }
  };

  const handleStartPracticing = async () => {
    console.log('handleStartPracticing called!');
    if (!certification || !session?.user) return;

    try {
      setIsUpdating(true);
      const response = await fetch('/api/user-certifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificationId: certification.id,
        }),
      });

      if (response.ok) {
        // Invalidate cache and reload
        ClientCache.invalidateUserCertification(certification.id);
        await loadUserCertificationStatus();
      }
    } catch (error) {
      console.error('Error starting certification:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteCertification = async () => {
    if (!certification || !session?.user) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/user-certifications/${certification.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
        }),
      });

      if (response.ok) {
        // Invalidate cache and reload
        ClientCache.invalidateUserCertification(certification.id);
        await loadUserCertificationStatus();
      }
    } catch (error) {
      console.error('Error completing certification:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveCertification = async () => {
    if (!certification || !session?.user) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/user-certifications/${certification.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Invalidate cache and set to null
        ClientCache.invalidateUserCertification(certification.id);
        setUserCertification(null);
      }
    } catch (error) {
      console.error('Error removing certification:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading certification details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!certification) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
          <div className="mb-4">
            <Link href="/certifications">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Certifications
              </Button>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Certification Not Found</h1>
            <p className="text-muted-foreground">The certification you're looking for doesn't exist.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isAvailable = certification.status === 'available';

  return (
    <MainLayout>
      <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
        <div className="mb-4">
          <Link href="/certifications">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Certifications
            </Button>
          </Link>
        </div>

        {/* Full Width Certification Card */}
        <CertificationCard certification={certification} fullWidth={true} />

        {/* Action Cards */}
        {isAvailable && (
          <div className="mt-6">
            {!session?.user ? (
              /* Not logged in - show limited options */
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Quick Review Card - Available for logged out users */}
                <Card className="shadow-none flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpenIcon className="w-5 h-5 mr-2" />
                      Quick Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-grow">
                    <p className="text-sm text-muted-foreground mb-4 flex-grow">
                      Practice with targeted questions by specific sections or topics to focus your study efforts.
                    </p>
                    <div className="mt-auto pt-8">
                      <Link href={`/certifications/${certificationSlug}/review`}>
                        <Button size="lg" className="bg-review hover:bg-review/90 text-white w-full">
                          Start Review
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Mock Exam Card - Requires login */}
                <Card className="shadow-none flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PlayIcon className="w-5 h-5 mr-2" />
                      Mock Exam
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-grow">
                    <p className="text-sm text-muted-foreground mb-4 flex-grow">
                      Take a full-length practice exam that simulates the real certification test experience with timed questions.
                    </p>
                    <div className="mt-auto pt-8">
                      <Link href="/auth/signin?mockExam=true">
                        <Button size="lg" className="w-full">
                          Sign In for Mock Exam
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : userCertificationLoading ? (
              /* Loading user certification status */
              <Card className="shadow-none">
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Checking certification status...</p>
                </CardContent>
              </Card>
            ) : !userCertification ? (
              /* Not taking certification - show Start Practicing */
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-center">Ready to start your certification journey?</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground mb-6">
                    Begin practicing with mock exams and targeted reviews to prepare for your certification.
                  </p>
                  <Button
                    size="lg"
                    onClick={handleStartPracticing}
                    disabled={isUpdating}
                    className="px-8"
                  >
                    {isUpdating ? 'Starting...' : 'Start Practicing'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Taking certification - show practice options */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {/* Mock Exam Card */}
                  <Card className="shadow-none flex flex-col">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <PlayIcon className="w-5 h-5 mr-2" />
                        Mock Exam
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-grow">
                      <p className="text-sm text-muted-foreground mb-4 flex-grow">
                        Take a full-length practice exam that simulates the real certification test experience with timed questions.
                      </p>
                      <div className="mt-auto pt-8">
                        <Link href={`/certifications/${certificationSlug}/quiz`}>
                          <Button size="lg">
                            Start Mock Exam
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Review Card */}
                  <Card className="shadow-none flex flex-col">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BookOpenIcon className="w-5 h-5 mr-2" />
                        Quick Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-grow">
                      <p className="text-sm text-muted-foreground mb-4 flex-grow">
                        Practice with targeted questions by specific sections or topics to focus your study efforts.
                      </p>
                      <div className="mt-auto pt-8">
                        <Link href={`/certifications/${certificationSlug}/review`}>
                          <Button size="lg" className="bg-review hover:bg-review/90 text-white">
                            Start Review
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Certification Management */}
                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle className="text-sm">Certification Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Status: <span className="font-medium text-foreground capitalize">{userCertification.status}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Started: {new Date(userCertification.started_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCompleteCertification}
                          disabled={isUpdating || userCertification.status === 'completed'}
                        >
                          {userCertification.status === 'completed' ? 'Completed' : 'Mark Complete'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveCertification}
                          disabled={isUpdating}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

      </div>
    </MainLayout>
  );
}