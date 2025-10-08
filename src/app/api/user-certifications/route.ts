import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

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

    // Get user's certifications
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
      ORDER BY
        CASE WHEN uc.status = 'taking' THEN 0 ELSE 1 END,
        uc.started_at DESC
    `;

    return NextResponse.json({
      userCertifications
    });

  } catch (error) {
    console.error('Error fetching user certifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user certifications' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { certificationId } = await request.json();

    if (!certificationId) {
      return NextResponse.json(
        { error: 'Certification ID is required' },
        { status: 400 }
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

    // First get the actual certification UUID
    const certification = await prisma.$queryRaw`
      SELECT id FROM certifications WHERE tracks = ${certificationId}
    `;

    if (!Array.isArray(certification) || certification.length === 0) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      );
    }

    const actualCertificationId = certification[0].id;

    // Start taking certification (or update existing)
    await prisma.$queryRaw`
      INSERT INTO user_certifications (user_id, certification_id, status, started_at)
      VALUES (${user.id}::uuid, ${actualCertificationId}::uuid, 'taking', CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, certification_id)
      DO UPDATE SET
        status = 'taking',
        started_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({
      message: 'Started taking certification',
      status: 'taking'
    });

  } catch (error) {
    console.error('Error starting certification:', error);
    return NextResponse.json(
      { error: 'Failed to start certification' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}