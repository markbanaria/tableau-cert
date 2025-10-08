import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certification: string }> }
) {
  try {
    const { certification } = await params;

    // Try to find certification in database first
    const dbCertification = await prisma.certification.findFirst({
      where: {
        OR: [
          { name: { contains: certification, mode: 'insensitive' } },
          { tracks: { contains: certification, mode: 'insensitive' } }
        ]
      },
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

    if (dbCertification) {
      // Extract sections/domains from the certification's tests and calculate weights
      const testSections = dbCertification.certificationTests
        .flatMap(ct => ct.test.testSections)
        .filter((ts, index, self) =>
          index === self.findIndex(t => t.section.id === ts.section.id)
        );

      // Calculate total questions across all sections
      const totalQuestions = testSections.reduce((sum, ts) => sum + ts.questionCount, 0);

      // Calculate weight for each domain based on question count percentage
      const domains = testSections.map(ts => ({
        id: ts.section.id,
        name: ts.section.name,
        weight: totalQuestions > 0 ? Math.round((ts.questionCount / totalQuestions) * 100) : 25
      }));

      return NextResponse.json({
        name: dbCertification.name,
        description: dbCertification.description || `Practice exam for ${dbCertification.name} certification`,
        domains
      });
    }

    // Fallback for known certifications not in database
    const certificationMap: Record<string, any> = {
      'tableau-consultant': {
        name: 'Tableau Consultant',
        description: 'Practice exam for Tableau Consultant certification',
        domains: [
          { id: 'domain1', name: 'Evaluate Current State', weight: 22 },
          { id: 'domain2', name: 'Plan and Prepare Data Connections', weight: 22 },
          { id: 'domain3', name: 'Design and Troubleshoot Calculations and Workbooks', weight: 40 },
          { id: 'domain4', name: 'Establish Governance and Support Published Content', weight: 16 }
        ]
      },
      'tableau-desktop-specialist': {
        name: 'Tableau Desktop Specialist',
        description: 'Practice exam for Tableau Desktop Specialist certification',
        domains: [
          { id: 'domain1', name: 'Connecting to and Preparing Data', weight: 25 },
          { id: 'domain2', name: 'Exploring and Analyzing Data', weight: 35 },
          { id: 'domain3', name: 'Sharing Insights', weight: 25 },
          { id: 'domain4', name: 'Understanding Tableau Concepts', weight: 15 }
        ]
      },
      'tableau-certified-data-analyst': {
        name: 'Tableau Certified Data Analyst',
        description: 'Practice exam for Tableau Certified Data Analyst certification',
        domains: [
          { id: 'domain1', name: 'Connect to and Transform Data', weight: 30 },
          { id: 'domain2', name: 'Explore and Analyze Data', weight: 40 },
          { id: 'domain3', name: 'Create Content', weight: 30 }
        ]
      }
    };

    const info = certificationMap[certification];
    if (info) {
      return NextResponse.json(info);
    }

    // Generic fallback
    const formatCertificationName = (slug: string): string => {
      return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    return NextResponse.json({
      name: formatCertificationName(certification),
      description: `Practice exam for ${formatCertificationName(certification)} certification`,
      domains: []
    });

  } catch (error) {
    console.error('Error fetching certification info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certification info' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}