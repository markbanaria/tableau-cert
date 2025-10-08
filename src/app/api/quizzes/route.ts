import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { securePrisma } from '@/lib/secure-prisma'

// GET /api/quizzes - Get all quizzes for the authenticated user
export const GET = requireAuth(async (req: AuthenticatedRequest) => {
  try {
    const userPrisma = securePrisma.forUser(req.userId)

    const quizzes = await userPrisma.quiz.findMany({
      include: {
        test: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
        _count: {
          select: {
            quizResponses: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    })

    return NextResponse.json({ quizzes })
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    )
  }
})

// POST /api/quizzes - Create a new quiz for the authenticated user
export const POST = requireAuth(async (req: AuthenticatedRequest) => {
  try {
    const { testId } = await req.json()

    // Validate that the test exists (public data)
    if (testId) {
      const test = await securePrisma.test.findUnique({
        where: { id: testId },
        select: { id: true }
      })

      if (!test) {
        return NextResponse.json(
          { error: 'Invalid test ID' },
          { status: 400 }
        )
      }
    }

    const userPrisma = securePrisma.forUser(req.userId)

    const quiz = await userPrisma.quiz.create({
      data: {
        testId: testId || null,
        status: 'in_progress'
      },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        }
      }
    })

    return NextResponse.json({ quiz }, { status: 201 })
  } catch (error) {
    console.error('Error creating quiz:', error)
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    )
  }
})