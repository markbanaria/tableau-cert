import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeTopics = searchParams.get('includeTopics') === 'true'

    const sections = await prisma.section.findMany({
      include: {
        sectionTopics: includeTopics ? {
          include: {
            topic: {
              include: {
                _count: {
                  select: {
                    topicQuestions: true
                  }
                }
              }
            }
          }
        } : {
          select: {
            topicId: true
          }
        },
        _count: {
          select: {
            sectionTopics: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const response = sections.map(section => ({
      id: section.id,
      name: section.name,
      description: section.description,
      createdAt: section.createdAt,
      topicCount: section._count.sectionTopics,
      ...(includeTopics && {
        topics: section.sectionTopics.map(st => ({
          id: st.topic.id,
          name: st.topic.name,
          description: st.topic.description,
          questionCount: st.topic._count.topicQuestions
        }))
      })
    }))

    return NextResponse.json({ sections: response })

  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const section = await prisma.section.create({
      data: {
        name,
        description: description || `Section: ${name}`
      }
    })

    return NextResponse.json({
      message: 'Section created successfully',
      data: section
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating section:', error)
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}