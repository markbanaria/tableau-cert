import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { getServerSession } from 'next-auth/next'

const prisma = new PrismaClient()

interface QuizGenerationRequest {
  topicIds?: string[]
  sectionIds?: string[]
  difficultyLevel?: number | 'mixed'
  questionCount?: number
  questionTypes?: string[]
  userId?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    const body: QuizGenerationRequest = await request.json()

    const {
      topicIds = [],
      sectionIds = [],
      difficultyLevel = 'mixed',
      questionCount = 10,
      questionTypes = ['multiple_choice'],
      userId = (session?.user as any)?.id
    } = body

    // Validate inputs
    if (questionCount < 1 || questionCount > 100) {
      return NextResponse.json(
        { error: 'Question count must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Build where clause for question selection
    const where: any = {
      questionType: {
        in: questionTypes
      }
    }

    // Add topic or section filters
    if (topicIds.length > 0) {
      where.topicQuestions = {
        some: {
          topicId: {
            in: topicIds
          }
        }
      }
    } else if (sectionIds.length > 0) {
      where.topicQuestions = {
        some: {
          topic: {
            sectionTopics: {
              some: {
                sectionId: {
                  in: sectionIds
                }
              }
            }
          }
        }
      }
    }

    // Add difficulty filter if not mixed
    if (difficultyLevel !== 'mixed' && typeof difficultyLevel === 'number') {
      where.difficultyLevel = difficultyLevel
    }

    // Get test configuration for section-based distribution
    const testConfig = await prisma.test.findFirst({
      where: { name: 'Tableau Consultant Exam' },
      include: {
        testSections: {
          include: {
            section: true
          }
        }
      }
    });

    let shuffledQuestions: any[] = [];

    if (testConfig && testConfig.testSections.length > 0) {
      // Use section-based distribution with proportional scaling
      console.log('Using section-based question distribution with proportional scaling');

      // Filter test sections if specific sections are requested
      let sectionsToProcess = testConfig.testSections;
      if (sectionIds.length > 0) {
        sectionsToProcess = testConfig.testSections.filter((testSection: any) =>
          sectionIds.includes(testSection.sectionId)
        );
        console.log(`Filtering to requested sections: ${sectionIds.join(', ')}`);
        console.log(`Found ${sectionsToProcess.length} matching sections out of ${testConfig.testSections.length} total`);
      }

      // If no matching sections found, fall back to original random selection
      if (sectionsToProcess.length === 0) {
        console.log('No matching sections found in test config, falling back to random selection');
        sectionsToProcess = [];
      } else {
        // Calculate total questions in the filtered configuration
        const totalConfigQuestions = sectionsToProcess.reduce(
          (sum: number, section: any) => sum + section.questionCount,
          0
        );

        // Calculate proportional distribution
        const sectionAllocations = sectionsToProcess.map((testSection: any) => {
          const proportion = testSection.questionCount / totalConfigQuestions;
          const allocatedCount = Math.round(proportion * questionCount);
          return {
            ...testSection,
            allocatedCount
          };
        });

        // Adjust allocations to exactly match requested count
        let totalAllocated = sectionAllocations.reduce((sum: number, section: any) => sum + section.allocatedCount, 0);
        const difference = questionCount - totalAllocated;

        if (difference !== 0) {
          // Adjust the largest section by the difference
          const largestSection = sectionAllocations.reduce((max: any, section: any) =>
            section.allocatedCount > max.allocatedCount ? section : max
          );
          largestSection.allocatedCount += difference;
        }

        for (const sectionAllocation of sectionAllocations) {
        const sectionWhere = {
          ...where,
          topicQuestions: {
            some: {
              topic: {
                sectionTopics: {
                  some: {
                    sectionId: sectionAllocation.sectionId
                  }
                }
              }
            }
          }
        };

        const sectionQuestions = await prisma.question.findMany({
          where: sectionWhere,
          include: {
            answers: {
              orderBy: { createdAt: 'asc' }
            },
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
        });

        // Shuffle and take the allocated number for this section
        const shuffledSectionQuestions = sectionQuestions
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(sectionAllocation.allocatedCount, sectionQuestions.length));

        shuffledQuestions.push(...shuffledSectionQuestions);

        console.log(`Section "${sectionAllocation.section.name}": ${shuffledSectionQuestions.length}/${sectionAllocation.allocatedCount} questions (${((sectionAllocation.questionCount / totalConfigQuestions) * 100).toFixed(1)}% of total)`);
        }
      }
    }

    // If we didn't get questions from section-based distribution, use fallback
    if (shuffledQuestions.length === 0) {
      // Fallback to original random selection
      console.log('Using fallback random question distribution');

      const availableQuestions = await prisma.question.findMany({
        where,
        include: {
          answers: {
            orderBy: { createdAt: 'asc' }
          },
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
      });

      if (availableQuestions.length === 0) {
        return NextResponse.json(
          { error: 'No questions found matching the criteria' },
          { status: 404 }
        )
      }

      shuffledQuestions = availableQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(questionCount, availableQuestions.length));
    }

    if (shuffledQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found matching the criteria' },
        { status: 404 }
      )
    }

    // Create quiz session if user is provided
    let quizId: string | null = null
    if (userId) {
      try {
        const quiz = await prisma.quiz.create({
          data: {
            userId,
            status: 'in_progress'
          }
        })
        quizId = quiz.id
      } catch (error) {
        console.warn('Could not create quiz session:', error)
        // Continue without quiz session
      }
    }

    // Format questions for the response
    const formattedQuestions = shuffledQuestions.map((question, index) => {
      // Keep answers in original order - no shuffling
      const answers = question.answers;

      // Find which index position has the correct answer
      const correctAnswerIndex = answers.findIndex((answer: any) => answer.isCorrect);

      // Debug log to see what's in the database
      if (index < 2) { // Only log first 2 questions to avoid spam
        console.log(`Question ${index + 1}:`, {
          questionId: question.id,
          answers: answers.map((a: any, i: number) => ({ index: i, content: a.content, isCorrect: a.isCorrect })),
          correctAnswerIndex
        });
      }

      return {
        id: question.id,
        questionNumber: index + 1,
        content: question.content,
        questionType: question.questionType,
        difficultyLevel: question.difficultyLevel,
        explanation: question.explanation,
        sourceUrl: question.sourceUrl,
        correctAnswer: correctAnswerIndex,
        answers: answers.map((answer: any) => ({
          id: answer.id,
          content: answer.content
        })),
        options: answers.map((answer: any) => answer.content),
        answerIds: answers.map((answer: any) => answer.id),
        topics: question.topicQuestions.map((tq: any) => ({
          id: tq.topic.id,
          name: tq.topic.name,
          sections: tq.topic.sectionTopics.map((st: any) => ({
            id: st.section.id,
            name: st.section.name
          }))
        }))
      };
    })

    // Get quiz metadata
    const topicBreakdown = new Map<string, number>()
    const sectionBreakdown = new Map<string, number>()
    const difficultyBreakdown = new Map<number, number>()

    shuffledQuestions.forEach(question => {
      // Count by difficulty
      const diff = question.difficultyLevel || 3
      difficultyBreakdown.set(diff, (difficultyBreakdown.get(diff) || 0) + 1)

      // Count by topic and section
      question.topicQuestions.forEach((tq: any) => {
        topicBreakdown.set(tq.topic.name, (topicBreakdown.get(tq.topic.name) || 0) + 1)

        tq.topic.sectionTopics.forEach((st: any) => {
          sectionBreakdown.set(st.section.name, (sectionBreakdown.get(st.section.name) || 0) + 1)
        })
      })
    })

    const response = {
      quizId,
      questions: formattedQuestions,
      metadata: {
        totalQuestions: formattedQuestions.length,
        requestedCount: questionCount,
        availableQuestions: shuffledQuestions.length,
        generatedAt: new Date().toISOString(),
        topicBreakdown: Object.fromEntries(topicBreakdown),
        sectionBreakdown: Object.fromEntries(sectionBreakdown),
        difficultyBreakdown: Object.fromEntries(difficultyBreakdown)
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error generating quiz:', error)
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certification = searchParams.get('certification');

    // If certification is specified, filter sections by that certification
    let sectionsQuery: any = {
      select: {
        id: true,
        name: true,
        sectionTopics: {
          select: {
            topic: {
              select: {
                id: true,
                name: true,
                _count: {
                  select: {
                    topicQuestions: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    };

    if (certification) {
      // Filter sections that belong to the specified certification
      sectionsQuery.where = {
        testSections: {
          some: {
            test: {
              certificationTests: {
                some: {
                  certification: {
                    tracks: certification
                  }
                }
              }
            }
          }
        }
      };
    }

    // Return available quiz generation options
    const [topics, sections] = await Promise.all([
      prisma.topic.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              topicQuestions: true
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.section.findMany(sectionsQuery)
    ])

    const sectionsWithCounts = sections.map((section: any) => ({
      id: section.id,
      name: section.name,
      questionCount: section.sectionTopics.reduce(
        (sum: number, st: any) => sum + st.topic._count.topicQuestions,
        0
      ),
      topics: section.sectionTopics.map((st: any) => ({
        id: st.topic.id,
        name: st.topic.name,
        questionCount: st.topic._count.topicQuestions
      }))
    }))

    return NextResponse.json({
      topics: topics.map(topic => ({
        id: topic.id,
        name: topic.name,
        questionCount: topic._count.topicQuestions
      })),
      sections: sectionsWithCounts,
      questionTypes: ['multiple_choice'],
      difficultyLevels: [
        { value: 1, label: 'Beginner', description: 'Basic concepts and terminology' },
        { value: 3, label: 'Intermediate', description: 'Practical application and analysis' },
        { value: 5, label: 'Advanced', description: 'Complex scenarios and best practices' },
        { value: 'mixed', label: 'Mixed', description: 'Questions from all difficulty levels' }
      ],
      maxQuestions: 100
    })

  } catch (error) {
    console.error('Error fetching quiz options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz options' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}