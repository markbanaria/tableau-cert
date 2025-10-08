import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { action, certificationId, status } = await request.json();

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (action === 'start') {
      // Start taking a certification
      await prisma.$queryRaw`
        INSERT INTO user_certifications (user_id, certification_id, status, started_at)
        SELECT ${user.id}::uuid, c.id, 'taking', CURRENT_TIMESTAMP
        FROM certifications c
        WHERE c.tracks = ${certificationId} OR c.id = ${certificationId}::uuid
        ON CONFLICT (user_id, certification_id)
        DO UPDATE SET
          status = 'taking',
          started_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `;

      return NextResponse.json({ message: 'Started taking certification', status: 'taking' });
    }

    if (action === 'update') {
      // Update certification status
      await prisma.$queryRaw`
        UPDATE user_certifications
        SET
          status = ${status},
          completed_at = ${status === 'completed' ? new Date() : null},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${user.id}::uuid
          AND certification_id = (
            SELECT id FROM certifications
            WHERE tracks = ${certificationId} OR id = ${certificationId}::uuid
          )
      `;

      return NextResponse.json({ message: `Certification status updated to ${status}`, status });
    }

    if (action === 'remove') {
      // Remove certification
      await prisma.$queryRaw`
        DELETE FROM user_certifications
        WHERE user_id = ${user.id}::uuid
          AND certification_id = (
            SELECT id FROM certifications
            WHERE tracks = ${certificationId} OR id = ${certificationId}::uuid
          )
      `;

      return NextResponse.json({ message: 'Certification removed from tracking' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error managing user certification:', error);
    return NextResponse.json(
      { error: 'Failed to manage user certification' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's recent quiz history (last 5 quizzes)
    const recentQuizzes = await prisma.quiz.findMany({
      where: {
        userId: user.id,
        status: 'completed'
      },
      include: {
        test: {
          include: {
            testSections: {
              include: {
                section: true
              }
            }
          }
        },
        quizResponses: true
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 5
    });

    // Get quiz statistics
    const totalQuizzesTaken = await prisma.quiz.count({
      where: {
        userId: user.id,
        status: 'completed'
      }
    });

    const totalQuestionsAnswered = await prisma.quizResponse.count({
      where: {
        quiz: {
          userId: user.id
        }
      }
    });

    const correctAnswers = await prisma.quizResponse.count({
      where: {
        quiz: {
          userId: user.id
        },
        isCorrect: true
      }
    });

    // Calculate average score
    const completedQuizzes = await prisma.quiz.findMany({
      where: {
        userId: user.id,
        status: 'completed',
        score: { not: null }
      },
      select: {
        score: true
      }
    });

    let averageScore = 0;
    if (completedQuizzes.length > 0) {
      const totalScore = completedQuizzes.reduce((sum, quiz) => {
        // Score is already stored as a percentage (0-100)
        return sum + (quiz.score || 0);
      }, 0);
      averageScore = Math.round(totalScore / completedQuizzes.length);
    }

    // Transform recent quizzes for the frontend
    const formattedRecentQuizzes = recentQuizzes.map(quiz => {
      const totalQuestions = quiz.quizResponses.length;
      const correctAnswers = quiz.quizResponses.filter(r => r.isCorrect).length;
      const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const passed = percentage >= 70;

      return {
        id: quiz.id,
        completedAt: quiz.completedAt,
        score: quiz.score,
        totalQuestions,
        correctAnswers,
        timeTaken: quiz.timeTaken,
        testName: quiz.test?.name || (quiz.test?.testSections?.length > 0 ?
          quiz.test.testSections.map(ts => ts.section.name).join(', ') : 'Quick Review'),
        passed,
        percentage
      };
    });

    // Get user's active certifications
    const userCertifications = await prisma.$queryRaw`
      SELECT
        uc.id as user_certification_id,
        uc.status,
        uc.started_at,
        uc.completed_at,
        c.id as certification_id,
        c.name,
        c.description,
        c.tracks
      FROM user_certifications uc
      JOIN certifications c ON uc.certification_id = c.id
      WHERE uc.user_id = ${user.id}::uuid
        AND uc.status IN ('taking', 'completed')
      ORDER BY
        CASE WHEN uc.status = 'taking' THEN 0 ELSE 1 END,
        uc.started_at DESC
      LIMIT 5
    `;

    // Top certifications data (static for now, could be dynamic based on popularity/availability)
    const topCertifications = [
      {
        id: 'tableau-consultant',
        name: 'Tableau Consultant',
        description: 'Advanced certification for solution architects and consultants',
        vendor: 'Salesforce',
        level: 'Professional',
        color: 'bg-blue-600',
        icon: '/tableau-logo.png',
        status: 'available'
      },
      {
        id: 'tableau-desktop-specialist',
        name: 'Tableau Desktop Specialist',
        description: 'Entry-level certification covering fundamental Tableau Desktop skills',
        vendor: 'Salesforce',
        level: 'Specialist',
        color: 'bg-green-600',
        icon: '/tableau-logo.png',
        status: 'coming_soon'
      },
      {
        id: 'tableau-data-analyst',
        name: 'Tableau Certified Data Analyst',
        description: 'Mid-level certification for analysts creating advanced visualizations',
        vendor: 'Salesforce',
        level: 'Associate',
        color: 'bg-purple-600',
        icon: '/tableau-logo.png',
        status: 'coming_soon'
      }
    ];

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email
      },
      stats: {
        totalQuizzesTaken,
        totalQuestionsAnswered,
        correctAnswers,
        averageScore,
        accuracyPercentage: totalQuestionsAnswered > 0
          ? Math.round((correctAnswers / totalQuestionsAnswered) * 100)
          : 0
      },
      recentQuizzes: formattedRecentQuizzes,
      userCertifications,
      topCertifications
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}