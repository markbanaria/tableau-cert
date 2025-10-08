import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { getServerSession } from 'next-auth/next'

const prisma = new PrismaClient()

interface QuizSubmission {
  quizId?: string
  answers: Array<{
    questionId: string
    answerId?: string
    userAnswer?: string // For short answer questions
  }>
  timeTaken?: number // in seconds
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    const body: QuizSubmission = await request.json()

    const { quizId, answers, timeTaken } = body

    if (!answers || answers.length === 0) {
      return NextResponse.json(
        { error: 'No answers provided' },
        { status: 400 }
      )
    }

    // Get questions with their correct answers
    const questionIds = answers.map(a => a.questionId)
    const questions = await prisma.question.findMany({
      where: {
        id: {
          in: questionIds
        }
      },
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
    })

    // Create a map for quick lookups
    const questionMap = new Map(questions.map(q => [q.id, q]))

    // Score the quiz
    const results = answers.map(userAnswer => {
      const question = questionMap.get(userAnswer.questionId)
      if (!question) {
        return {
          questionId: userAnswer.questionId,
          isCorrect: false,
          error: 'Question not found'
        }
      }

      const correctAnswer = question.answers.find(a => a.isCorrect)
      const selectedAnswer = question.answers.find(a => a.id === userAnswer.answerId)

      const isCorrect = userAnswer.answerId === correctAnswer?.id

      return {
        questionId: userAnswer.questionId,
        userAnswerId: userAnswer.answerId,
        correctAnswerId: correctAnswer?.id,
        isCorrect,
        question: {
          id: question.id,
          content: question.content,
          explanation: question.explanation,
          difficultyLevel: question.difficultyLevel,
          topics: question.topicQuestions.map(tq => tq.topic.name)
        },
        userAnswer: selectedAnswer ? {
          id: selectedAnswer.id,
          content: selectedAnswer.content
        } : null,
        correctAnswer: correctAnswer ? {
          id: correctAnswer.id,
          content: correctAnswer.content,
          explanation: correctAnswer.explanation
        } : null,
        allAnswers: question.answers.map(answer => ({
          id: answer.id,
          content: answer.content,
          isCorrect: answer.isCorrect,
          explanation: answer.explanation
        }))
      }
    })

    const correctCount = results.filter(r => r.isCorrect).length
    const totalCount = results.length
    const score = Math.round((correctCount / totalCount) * 100)

    // Update quiz record if provided
    let updatedQuiz = null
    if (quizId && (session?.user as any)?.id) {
      try {
        // Use a transaction to ensure both quiz update and responses are saved atomically
        const result = await prisma.$transaction(async (tx) => {
          // Update quiz record
          const quiz = await tx.quiz.update({
            where: { id: quizId },
            data: {
              status: 'completed',
              score,
              completedAt: new Date(),
              timeTaken: timeTaken || null
            }
          });

          // Record individual responses
          const quizResponses = results
            .filter(result => result.questionId) // Only include valid questions
            .map(result => ({
              quizId,
              questionId: result.questionId,
              answerId: result.userAnswerId || null,
              isCorrect: result.isCorrect
            }));

          if (quizResponses.length > 0) {
            await tx.quizResponse.createMany({
              data: quizResponses,
              skipDuplicates: true // Avoid conflicts if responses already exist
            });
          }

          return quiz;
        });

        updatedQuiz = result;
      } catch (error) {
        console.error('Could not update quiz record:', error)
        // Continue without updating quiz
      }
    }

    // Calculate performance by topic and difficulty
    const topicPerformance = new Map<string, { correct: number, total: number }>()
    const difficultyPerformance = new Map<number, { correct: number, total: number }>()

    results.forEach(result => {
      const difficulty = result.question?.difficultyLevel || 3
      const current = difficultyPerformance.get(difficulty) || { correct: 0, total: 0 }
      difficultyPerformance.set(difficulty, {
        correct: current.correct + (result.isCorrect ? 1 : 0),
        total: current.total + 1
      })

      result.question?.topics?.forEach(topic => {
        const current = topicPerformance.get(topic) || { correct: 0, total: 0 }
        topicPerformance.set(topic, {
          correct: current.correct + (result.isCorrect ? 1 : 0),
          total: current.total + 1
        })
      })
    })

    // Determine performance level and recommendations
    let performanceLevel: string
    let recommendations: string[] = []

    if (score >= 85) {
      performanceLevel = 'Excellent'
      recommendations.push('Great job! You demonstrate strong understanding of Tableau concepts.')
      recommendations.push('Consider taking a certification exam if you haven\'t already.')
    } else if (score >= 70) {
      performanceLevel = 'Good'
      recommendations.push('Good performance! Review the topics where you missed questions.')
      recommendations.push('Practice more questions in your weaker areas.')
    } else if (score >= 60) {
      performanceLevel = 'Average'
      recommendations.push('You\'re on the right track. Focus on understanding core concepts.')
      recommendations.push('Review explanations carefully and practice regularly.')
    } else {
      performanceLevel = 'Needs Improvement'
      recommendations.push('Consider reviewing fundamental Tableau concepts.')
      recommendations.push('Focus on understanding rather than memorization.')
      recommendations.push('Take your time with each question and read explanations.')
    }

    const response = {
      quizId: updatedQuiz?.id || quizId,
      score: {
        correct: correctCount,
        total: totalCount,
        percentage: score
      },
      performance: {
        level: performanceLevel,
        recommendations
      },
      results,
      analytics: {
        topicPerformance: Object.fromEntries(
          Array.from(topicPerformance.entries()).map(([topic, perf]) => [
            topic,
            {
              ...perf,
              percentage: Math.round((perf.correct / perf.total) * 100)
            }
          ])
        ),
        difficultyPerformance: Object.fromEntries(
          Array.from(difficultyPerformance.entries()).map(([diff, perf]) => [
            diff,
            {
              ...perf,
              percentage: Math.round((perf.correct / perf.total) * 100)
            }
          ])
        )
      },
      timeTaken,
      completedAt: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error submitting quiz:', error)
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}