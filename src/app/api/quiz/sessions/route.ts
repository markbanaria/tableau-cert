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

    const body = await request.json();
    const {
      certificationSlug,
      type,
      questionCount,
      sectionIds,
      topicIds,
      difficultyLevel,
      startedAt,
      result,
      completedAt
    } = body;

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

    // If this is a completion request (has result), update existing quiz
    if (result && completedAt) {
      const quizId = body.quizId || body.sessionId;
      if (!quizId) {
        return NextResponse.json(
          { error: 'Quiz ID required for completion' },
          { status: 400 }
        );
      }

      // Use a transaction to ensure both quiz update and responses are saved atomically
      const updatedQuiz = await prisma.$transaction(async (tx) => {
        // Calculate percentage score for database storage
        const percentageScore = result.totalQuestions > 0
          ? Math.round((result.score / result.totalQuestions) * 100)
          : 0;

        const quiz = await tx.quiz.update({
          where: { id: quizId },
          data: {
            status: 'completed',
            score: percentageScore,
            completedAt: new Date(completedAt),
            timeTaken: result.timeTaken || null
          }
        });

        // Store quiz responses if provided
        if (result.responses && Array.isArray(result.responses)) {
          // First, get all questions with their correct answers to verify scores
          const questionIds = result.responses.map((r: any) => r.questionId);
          const questions = await tx.question.findMany({
            where: { id: { in: questionIds } },
            include: { answers: true }
          });

          const questionMap = new Map(questions.map(q => [q.id, q]));

          const quizResponses = result.responses.map((response: any) => {
            // Use the isCorrect value already calculated by the frontend
            // If not provided, fall back to calculating it here
            let isCorrect = response.isCorrect;
            if (isCorrect === undefined || isCorrect === null) {
              const question = questionMap.get(response.questionId);
              const correctAnswer = question?.answers.find(a => a.isCorrect);
              isCorrect = response.answerId === correctAnswer?.id;
            }

            return {
              quizId: quiz.id,
              questionId: response.questionId,
              answerId: response.answerId || null,
              userAnswer: response.userAnswer || null,
              isCorrect: isCorrect
            };
          });

          // Use createMany to insert all responses
          if (quizResponses.length > 0) {
            await tx.quizResponse.createMany({
              data: quizResponses,
              skipDuplicates: true // Avoid conflicts if responses already exist
            });
          }
        }

        return quiz;
      });

      return NextResponse.json({
        id: updatedQuiz.id,
        status: updatedQuiz.status,
        score: updatedQuiz.score,
        completedAt: updatedQuiz.completedAt
      });
    }

    // Otherwise, create a new quiz session
    if (!certificationSlug || !type || !startedAt) {
      return NextResponse.json(
        { error: 'Missing required fields: certificationSlug, type, startedAt' },
        { status: 400 }
      );
    }

    // Find or create a test for this certification/type combination
    let testId = null;
    try {
      // Try to find existing test based on certification
      const certification = await prisma.certification.findFirst({
        where: {
          OR: [
            { name: { contains: certificationSlug, mode: 'insensitive' } },
            { tracks: { contains: certificationSlug, mode: 'insensitive' } }
          ]
        },
        include: {
          certificationTests: {
            include: { test: true },
            take: 1
          }
        }
      });

      if (certification && certification.certificationTests.length > 0) {
        testId = certification.certificationTests[0].test.id;
      }
    } catch (error) {
      console.warn('Could not find certification test:', error);
    }

    // Create quiz session
    const quiz = await prisma.quiz.create({
      data: {
        userId: user.id,
        testId,
        status: 'in_progress',
        startedAt: new Date(startedAt)
      }
    });

    return NextResponse.json({
      id: quiz.id,
      userId: quiz.userId,
      testId: quiz.testId,
      status: quiz.status,
      startedAt: quiz.startedAt,
      metadata: {
        certificationSlug,
        type,
        questionCount,
        sectionIds,
        topicIds,
        difficultyLevel
      }
    });

  } catch (error) {
    console.error('Error handling quiz session:', error);
    return NextResponse.json(
      { error: 'Failed to handle quiz session' },
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

    const { searchParams } = new URL(request.url);
    const certificationSlug = searchParams.get('certification');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // Get user's quiz history (only completed quizzes)
    const quizzes = await prisma.quiz.findMany({
      where: {
        userId: user.id,
        status: 'completed', // Only show completed quizzes in history
        ...(certificationSlug ? {
          // Filter by certification if specified
          // Note: This is a simplified approach - in a real system you might want
          // to store certification info directly in the quiz record
        } : {})
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
        quizResponses: {
          include: {
            question: true,
            answer: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    return NextResponse.json({
      quizzes: quizzes.map(quiz => {
        const totalQuestions = quiz.quizResponses.length;
        const correctAnswers = quiz.quizResponses.filter(r => r.isCorrect).length;
        const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        const passed = percentage >= 70;

        return {
          id: quiz.id,
          status: quiz.status,
          score: percentage, // Use calculated percentage instead of stored score
          startedAt: quiz.startedAt,
          completedAt: quiz.completedAt,
          timeTaken: quiz.timeTaken,
          testName: quiz.test?.name || 'Unknown Test',
          totalQuestions,
          correctAnswers,
          percentage,
          passed
        };
      }),
      pagination: {
        limit,
        offset,
        total: await prisma.quiz.count({
          where: {
            userId: user.id,
            status: 'completed' // Only count completed quizzes
          }
        })
      }
    });

  } catch (error) {
    console.error('Error fetching quiz sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz sessions' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}