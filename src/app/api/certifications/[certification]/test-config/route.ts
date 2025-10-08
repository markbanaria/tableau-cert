import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certification: string }> }
) {
  try {
    const { certification } = await params;

    // Find certification and its test configuration
    const certificationData = await prisma.certification.findFirst({
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
          },
          take: 1 // Get the first test for this certification
        }
      }
    });

    if (!certificationData || certificationData.certificationTests.length === 0) {
      return NextResponse.json(
        { error: 'Certification or test configuration not found' },
        { status: 404 }
      );
    }

    const test = certificationData.certificationTests[0].test;

    // Format the response for quiz sampler
    const sectionConfig = test.testSections.map(ts => ({
      sectionId: ts.section.id,
      sectionName: ts.section.name,
      questionCount: ts.questionCount
    }));

    return NextResponse.json({
      certificationId: certificationData.id,
      certificationName: certificationData.name,
      testId: test.id,
      testName: test.name,
      timeLimit: test.timeLimit,
      passingScore: test.passingScore,
      totalQuestions: test.testSections.reduce((sum, ts) => sum + ts.questionCount, 0),
      sections: sectionConfig
    });

  } catch (error) {
    console.error('Error fetching certification test configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certification test configuration' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}