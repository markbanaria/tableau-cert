import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { quizId } = await params;

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

    // Get quiz with detailed responses
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId: user.id // Ensure user can only access their own quizzes
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
            question: {
              include: {
                answers: true,
                topicQuestions: {
                  include: {
                    topic: {
                      include: {
                        sectionTopics: {
                          include: {
                            section: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            answer: true
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Transform the data for the frontend
    const questions = quiz.quizResponses.map((response, index) => {
      // Get section information from the question's topics
      let sectionName = 'Unknown';
      let sectionId = null;

      if (response.question.topicQuestions?.length > 0) {
        const topic = response.question.topicQuestions[0].topic;
        if (topic.sectionTopics?.length > 0) {
          sectionName = topic.sectionTopics[0].section.name;
          sectionId = topic.sectionTopics[0].section.id;
        }
      }

      return {
        id: response.question.id,
        question: response.question.content,
        options: response.question.answers.map(answer => answer.content),
        correctAnswer: response.question.answers.findIndex(answer => answer.isCorrect),
        explanation: response.question.explanation,
        userAnswer: response.answer ?
          response.question.answers.findIndex(answer => answer.id === response.answer?.id) :
          null,
        isCorrect: response.isCorrect || false,
        metadata: {
          domain: sectionId || 'unknown',
          domainName: sectionName
        }
      };
    });

    // Calculate results
    const totalQuestions = quiz.quizResponses.length;
    const correctAnswers = quiz.quizResponses.filter(r => r.isCorrect).length;
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Convert percentage to score out of 1000 and check against test's passing score
    const scoreOutOf1000 = Math.round((correctAnswers / totalQuestions) * 1000);
    const passingScore = quiz.test?.passingScore || 750; // Default to 750 if not set
    const passed = scoreOutOf1000 >= passingScore;

    // Calculate section-wise scores
    const sectionScores = new Map<string, { name: string; correct: number; total: number; percentage: number }>();

    questions.forEach(question => {
      const sectionName = question.metadata.domainName;

      if (!sectionScores.has(sectionName)) {
        sectionScores.set(sectionName, {
          name: sectionName,
          correct: 0,
          total: 0,
          percentage: 0
        });
      }

      const section = sectionScores.get(sectionName)!;
      section.total += 1;

      if (question.isCorrect) {
        section.correct += 1;
      }
    });

    // Calculate percentages for each section
    sectionScores.forEach(section => {
      section.percentage = section.total > 0 ? Math.round((section.correct / section.total) * 100) : 0;
    });

    const quizData = {
      id: quiz.id,
      title: quiz.test?.name || 'Quiz Review',
      status: quiz.status,
      startedAt: quiz.startedAt,
      completedAt: quiz.completedAt,
      timeTaken: quiz.timeTaken,
      score: quiz.score,
      totalQuestions,
      correctAnswers,
      percentage,
      passed,
      questions,
      sectionScores: Array.from(sectionScores.values())
    };

    return NextResponse.json(quizData);

  } catch (error) {
    console.error('Error fetching quiz review data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz review data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}