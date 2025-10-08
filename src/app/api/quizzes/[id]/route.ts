import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { securePrisma } from '@/lib/secure-prisma'

// GET /api/quizzes/[id] - Get a specific quiz (user can only access their own)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return requireAuth(async (authReq: AuthenticatedRequest) => {
    try {
      const userPrisma = securePrisma.forUser(authReq.userId)

      const quiz = await userPrisma.quiz.findUnique({
        where: { id: id },
        include: {
          test: {
            select: {
              id: true,
              name: true,
              description: true,
              timeLimit: true,
              passingScore: true,
            }
          },
          quizResponses: {
            include: {
              question: {
                select: {
                  id: true,
                  content: true,
                  questionType: true,
                }
              },
              answer: {
                select: {
                  id: true,
                  content: true,
                  isCorrect: true,
                }
              }
            }
          }
        }
      })

      if (!quiz) {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ quiz })
    } catch (error) {
      console.error('Error fetching quiz:', error)
      return NextResponse.json(
        { error: 'Failed to fetch quiz' },
        { status: 500 }
      )
    }
  })(req)
}

// PUT /api/quizzes/[id] - Update a quiz (user can only update their own)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return requireAuth(async (authReq: AuthenticatedRequest) => {
    try {
      const { status, score, completedAt, timeTaken } = await authReq.json()

      const userPrisma = securePrisma.forUser(authReq.userId)

      // Update quiz with automatic user isolation
      const quiz = await userPrisma.quiz.update({
        where: { id: id },
        data: {
          ...(status && { status }),
          ...(score !== undefined && { score }),
          ...(completedAt && { completedAt: new Date(completedAt) }),
          ...(timeTaken !== undefined && { timeTaken }),
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

      return NextResponse.json({ quiz })
    } catch (error) {
      console.error('Error updating quiz:', error)

      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Quiz not found or access denied' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to update quiz' },
        { status: 500 }
      )
    }
  })(req)
}

// DELETE /api/quizzes/[id] - Delete a quiz (user can only delete their own)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return requireAuth(async (authReq: AuthenticatedRequest) => {
    try {
      const userPrisma = securePrisma.forUser(authReq.userId)

      await userPrisma.quiz.delete({
        where: { id: id }
      })

      return NextResponse.json({ message: 'Quiz deleted successfully' })
    } catch (error) {
      console.error('Error deleting quiz:', error)

      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Quiz not found or access denied' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to delete quiz' },
        { status: 500 }
      )
    }
  })(req)
}