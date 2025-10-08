'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ClientCache } from '@/lib/clientCache';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftIcon, ClockIcon, CheckCircleIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { getQuizSampler } from '@/services/quizSampler';
import { LoadingState } from '@/components/QuestionBankLoader';
import MainLayout from '@/components/layout/main-layout';
import CertificationCard from '@/components/ui/certification-card';
import { usePreloader } from '@/hooks/usePreloader';

interface Certification {
  id: string;
  name: string;
  description: string;
  vendor: string;
  level: 'Associate' | 'Professional' | 'Specialist' | 'Expert';
  duration: number; // in minutes
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

const STATUS_CONFIG = {
  available: {
    label: 'Available',
    className: 'border-[var(--passed-border)]',
    style: { backgroundColor: 'var(--passed)', color: 'white' }
  },
  coming_soon: {
    label: 'Coming Soon',
    className: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    style: {}
  },
  beta: {
    label: 'Beta',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    style: {}
  }
};

const LEVEL_CONFIG = {
  Specialist: { color: 'bg-green-100 text-green-800' },
  Associate: { color: 'bg-blue-100 text-blue-800' },
  Professional: { color: 'bg-purple-100 text-purple-800' },
  Expert: { color: 'bg-red-100 text-red-800' }
};

export default function CertificationsPage() {
  const { data: session } = useSession();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [samplerReady, setSamplerReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading certification data...');

  // Preload quiz data for authenticated users
  usePreloader();

  useEffect(() => {
    initializeCertificationData();
  }, []);

  const initializeCertificationData = async () => {
    try {
      // Check for cached certifications first
      setLoadingMessage('Loading certifications...');
      let dbCertifications: Certification[] = [];

      const cachedCertifications = ClientCache.getCachedCertifications();
      if (cachedCertifications) {
        console.log('Using cached certifications');
        dbCertifications = cachedCertifications;
      } else {
        try {
          const response = await fetch('/api/certifications');
          if (response.ok) {
            const data = await response.json();
            dbCertifications = data.certifications.map((cert: any) => ({
              ...cert,
              sections: cert.sections || []
            }));
            // Cache the certifications
            ClientCache.cacheCertifications(dbCertifications);
          } else {
            throw new Error('Failed to fetch certifications');
          }
        } catch (error) {
          console.warn('Using fallback certification data:', error);
        }
      }

      setCertifications(dbCertifications);

      // Then load question bank data
      const quizSampler = getQuizSampler();

      await quizSampler.loadQuestionBanks((loaded, total, message) => {
        setLoadingMessage(message);
      });

      // Get stats for Tableau Consultant certification
      const stats = quizSampler.getQuestionBankStats();
      const coverage = await quizSampler.getDomainCoverage('tableau-consultant');
      const totalQuestions = Object.values(stats).reduce((sum, stat) => sum + stat.questionCount, 0);

      // Calculate average coverage
      const totalCoverage = Object.values(coverage).reduce((sum, data: any) => sum + data.coveragePercentage, 0);
      const avgCoverage = Math.round(totalCoverage / Object.keys(coverage).length);

      // Update certification data with question bank stats
      setCertifications(prev =>
        prev.map(cert =>
          cert.id === 'tableau-consultant'
            ? { ...cert, availableQuestions: totalQuestions, coverage: avgCoverage }
            : cert
        )
      );

      setSamplerReady(true);
    } catch (error) {
      console.error('Failed to load certification data:', error);
      setSamplerReady(true);
    }
  };

  if (!samplerReady) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
          {session?.user && (
            <div className="mb-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          )}
          <LoadingState message={loadingMessage} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
        {session?.user && (
          <div className="mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Certification Marketplace</h1>
          <p className="text-muted-foreground">
            Choose your certification path and start practicing with comprehensive exam preparation
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {certifications.map((cert) => {
            const isAvailable = cert.status === 'available';

            if (isAvailable) {
              return (
                <Link key={cert.id} href={`/certifications/${cert.id}`} className="block">
                  <CertificationCard certification={cert} />
                </Link>
              );
            }

            return (
              <div key={cert.id}>
                <CertificationCard certification={cert} />
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}