import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { getServerSession } from 'next-auth/next'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication check
    // const session = await getServerSession()
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const topicId = searchParams.get('topicId')
    const sectionId = searchParams.get('sectionId')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (topicId) {
      where.topicQuestions = {
        some: {
          topicId: topicId
        }
      }
    }

    if (difficulty) {
      const difficultyMap: Record<string, number> = {
        'easy': 1,
        'medium': 3,
        'hard': 5
      }
      where.difficultyLevel = difficultyMap[difficulty.toLowerCase()] || 3
    }

    if (search) {
      where.OR = [
        {
          content: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          explanation: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Get questions with related data
    const questions = await prisma.question.findMany({
      where,
      skip,
      take: limit,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get total count for pagination
    const totalCount = await prisma.question.count({ where })

    const response = {
      questions: questions.map(question => ({
        id: question.id,
        content: question.content,
        questionType: question.questionType,
        difficultyLevel: question.difficultyLevel,
        explanation: question.explanation,
        createdAt: question.createdAt,
        answers: question.answers.map(answer => ({
          id: answer.id,
          content: answer.content,
          isCorrect: answer.isCorrect,
          explanation: answer.explanation
        })),
        topics: question.topicQuestions.map(tq => ({
          id: tq.topic.id,
          name: tq.topic.name,
          sections: tq.topic.sectionTopics.map(st => ({
            id: st.section.id,
            name: st.section.name
          }))
        }))
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check
    // const session = await getServerSession()
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { content, questionType, difficultyLevel, explanation, answers, topicIds } = body

    // Validate required fields
    if (!content || !answers || answers.length < 2) {
      return NextResponse.json(
        { error: 'Content and at least 2 answers are required' },
        { status: 400 }
      )
    }

    // Check that exactly one answer is marked as correct
    const correctAnswers = answers.filter((answer: any) => answer.isCorrect)
    if (correctAnswers.length !== 1) {
      return NextResponse.json(
        { error: 'Exactly one answer must be marked as correct' },
        { status: 400 }
      )
    }

    // Create question with answers in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the question
      const question = await tx.question.create({
        data: {
          content,
          questionType: questionType || 'multiple_choice',
          difficultyLevel: difficultyLevel || 3,
          explanation
        }
      })

      // Create answers
      const createdAnswers = await Promise.all(
        answers.map((answer: any) =>
          tx.answer.create({
            data: {
              questionId: question.id,
              content: answer.content,
              isCorrect: answer.isCorrect,
              explanation: answer.explanation
            }
          })
        )
      )

      // Link to topics if provided
      if (topicIds && topicIds.length > 0) {
        await Promise.all(
          topicIds.map((topicId: string) =>
            tx.topicQuestion.create({
              data: {
                questionId: question.id,
                topicId
              }
            })
          )
        )
      }

      return { question, answers: createdAnswers }
    })

    return NextResponse.json({
      message: 'Question created successfully',
      data: result
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}