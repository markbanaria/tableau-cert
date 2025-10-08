import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET - Get specific user certification status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { certificationId } = await params;

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

    // Get user certification status
    const userCertification = await prisma.$queryRaw`
      SELECT
        uc.id,
        uc.status,
        uc.started_at,
        uc.completed_at
      FROM user_certifications uc
      WHERE uc.user_id = ${user.id}::uuid
        AND uc.certification_id = ${actualCertificationId}::uuid
    `;

    return NextResponse.json({
      userCertification: Array.isArray(userCertification) && userCertification.length > 0
        ? userCertification[0]
        : null
    });

  } catch (error) {
    console.error('Error fetching user certification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user certification' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update certification status (complete, pause, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ certificationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { certificationId } = await params;
    const { status } = await request.json();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!status || !['taking', 'completed', 'paused'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (taking, completed, paused)' },
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

    // Update user certification status
    await prisma.$queryRaw`
      UPDATE user_certifications
      SET
        status = ${status},
        completed_at = ${status === 'completed' ? new Date() : null},
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${user.id}::uuid
        AND certification_id = ${actualCertificationId}::uuid
    `;

    return NextResponse.json({
      message: `Certification status updated to ${status}`,
      status
    });

  } catch (error) {
    console.error('Error updating certification:', error);
    return NextResponse.json(
      { error: 'Failed to update certification' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Remove certification from user's tracking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ certificationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { certificationId } = await params;

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

    // Delete user certification
    await prisma.$queryRaw`
      DELETE FROM user_certifications
      WHERE user_id = ${user.id}::uuid
        AND certification_id = ${actualCertificationId}::uuid
    `;

    return NextResponse.json({
      message: 'Certification removed from tracking'
    });

  } catch (error) {
    console.error('Error removing certification:', error);
    return NextResponse.json(
      { error: 'Failed to remove certification' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}