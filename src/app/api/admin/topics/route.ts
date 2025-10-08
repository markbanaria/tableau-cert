import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeQuestions = searchParams.get('includeQuestions') === 'true'
    const sectionId = searchParams.get('sectionId')

    const where: any = {}

    if (sectionId) {
      where.sectionTopics = {
        some: {
          sectionId: sectionId
        }
      }
    }

    const topics = await prisma.topic.findMany({
      where,
      include: {
        sectionTopics: {
          include: {
            section: true
          }
        },
        topicQuestions: includeQuestions ? {
          include: {
            question: {
              include: {
                answers: true
              }
            }
          }
        } : {
          select: {
            questionId: true
          }
        },
        _count: {
          select: {
            topicQuestions: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const response = topics.map(topic => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      createdAt: topic.createdAt,
      questionCount: topic._count.topicQuestions,
      sections: topic.sectionTopics.map(st => ({
        id: st.section.id,
        name: st.section.name,
        description: st.section.description
      })),
      ...(includeQuestions && {
        questions: topic.topicQuestions.map(tq => ({
          id: tq.question.id,
          content: tq.question.content,
          questionType: tq.question.questionType,
          difficultyLevel: tq.question.difficultyLevel,
          answers: tq.question.answers.map(answer => ({
            id: answer.id,
            content: answer.content,
            isCorrect: answer.isCorrect
          }))
        }))
      })
    }))

    return NextResponse.json({ topics: response })

  } catch (error) {
    console.error('Error fetching topics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, sectionIds } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create the topic
      const topic = await tx.topic.create({
        data: {
          name,
          description: description || `Topic: ${name}`
        }
      })

      // Link to sections if provided
      if (sectionIds && sectionIds.length > 0) {
        await Promise.all(
          sectionIds.map((sectionId: string) =>
            tx.sectionTopic.create({
              data: {
                topicId: topic.id,
                sectionId
              }
            })
          )
        )
      }

      return topic
    })

    return NextResponse.json({
      message: 'Topic created successfully',
      data: result
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating topic:', error)
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}