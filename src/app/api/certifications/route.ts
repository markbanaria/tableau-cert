import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, CACHE_DURATIONS } from '@/lib/cache';

const prisma = new PrismaClient();

// Cached function for fetching certifications
const getCachedCertifications = unstable_cache(
  async () => {
    return await prisma.certification.findMany({
      include: {
        certificationTests: {
          include: {
            test: {
              include: {
                testSections: {
                  include: {
                    section: true
                  }
                }
              }
            }
          }
        }
      }
    });
  },
  ['certifications'],
  {
    revalidate: CACHE_DURATIONS.FOUR_HOURS,
    tags: [CACHE_TAGS.CERTIFICATIONS]
  }
);

export async function GET(request: NextRequest) {
  try {
    // Get all certifications with 4-hour cache
    const certifications = await getCachedCertifications();

    // Define certification metadata
    const certMetadata: Record<string, any> = {
      'tableau-consultant': {
        level: 'Professional',
        duration: 120,
        questionCount: 60,
        passingScore: 750,
        status: 'available'
      },
      'tableau-desktop-foundations': {
        level: 'Specialist',
        duration: 60,
        questionCount: 40,
        passingScore: 700,
        status: 'coming_soon'
      },
      'tableau-data-analyst': {
        level: 'Associate',
        duration: 120,
        questionCount: 45,
        passingScore: 750,
        status: 'coming_soon'
      },
      'tableau-server-admin': {
        level: 'Professional',
        duration: 90,
        questionCount: 55,
        passingScore: 750,
        status: 'coming_soon'
      },
      'tableau-architect': {
        level: 'Expert',
        duration: 150,
        questionCount: 65,
        passingScore: 800,
        status: 'coming_soon'
      }
    };

    // Transform the data for the frontend
    const formattedCertifications = certifications.map(cert => {
      const firstTest = cert.certificationTests[0]?.test;
      const domains = firstTest?.testSections?.length || 0;
      const sections = firstTest?.testSections?.map(ts => ({
        id: ts.section.id,
        name: ts.section.name
      })) || [];

      const metadata = certMetadata[cert.tracks || ''] || certMetadata['tableau-consultant'];

      return {
        id: cert.tracks || cert.id, // Use tracks as ID for URL routing
        name: cert.name,
        description: cert.description || `Practice exam for ${cert.name} certification`,
        vendor: 'Salesforce',
        level: metadata.level,
        duration: firstTest?.timeLimit || metadata.duration,
        questionCount: metadata.questionCount,
        passingScore: firstTest?.passingScore || metadata.passingScore,
        domains,
        sections,
        availableQuestions: 0, // Will be populated by frontend
        coverage: 0, // Will be populated by frontend
        color: 'bg-primary',
        icon: '/tableau-logo.png',
        status: metadata.status
      };
    });

    return NextResponse.json({ certifications: formattedCertifications });

  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certifications' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}