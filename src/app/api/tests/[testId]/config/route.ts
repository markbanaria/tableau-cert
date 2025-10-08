import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;

    // Get test configuration with section question counts
    const testConfig = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        testSections: {
          include: {
            section: true
          }
        }
      }
    });

    if (!testConfig) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Format the response for quiz sampler
    const sectionConfig = testConfig.testSections.map(ts => ({
      sectionId: ts.section.id,
      sectionName: ts.section.name,
      questionCount: ts.questionCount
    }));

    return NextResponse.json({
      testId: testConfig.id,
      testName: testConfig.name,
      timeLimit: testConfig.timeLimit,
      passingScore: testConfig.passingScore,
      totalQuestions: testConfig.testSections.reduce((sum, ts) => sum + ts.questionCount, 0),
      sections: sectionConfig
    });

  } catch (error) {
    console.error('Error fetching test configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test configuration' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}