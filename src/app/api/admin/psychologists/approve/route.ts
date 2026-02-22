import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/psychologists/approve
 * Admin endpoint to approve or reject psychologist registration
 * Body: { psychologistId: string, status: 'ACTIVE' | 'INACTIVE' }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const admin = await prisma.psychologist.findUnique({
      where: { id: session.user.id },
    });

    if (!admin?.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { psychologistId, status } = await req.json();

    // Validation
    if (!psychologistId || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid request. psychologistId and valid status required.' },
        { status: 400 }
      );
    }

    // Fetch psychologist
    const psychologist = await prisma.psychologist.findUnique({
      where: { id: psychologistId },
    });

    if (!psychologist) {
      return NextResponse.json(
        { error: 'Psychologist not found' },
        { status: 404 }
      );
    }

    // Update status
    const updatedPsychologist = await prisma.psychologist.update({
      where: { id: psychologistId },
      data: {
        status: status as any, // 'ACTIVE' | 'INACTIVE'
      },
    });

    // Log to audit trail
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: status === 'ACTIVE' ? 'CREATE' : 'DELETE',
        resourceType: 'Psychologist',
        resourceId: psychologistId,
        metadata: {
          action: status === 'ACTIVE' ? 'approved' : 'rejected',
          previousStatus: psychologist.status,
          newStatus: status,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Psychologist ${status === 'ACTIVE' ? 'approved' : 'rejected'} successfully`,
      psychologist: {
        id: updatedPsychologist.id,
        email: updatedPsychologist.email,
        fullName: updatedPsychologist.fullName,
        status: updatedPsychologist.status,
      },
    });
  } catch (error) {
    console.error('POST /api/admin/psychologists/approve error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/psychologists
 * Get list of all psychologists (for admin dashboard)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const admin = await prisma.psychologist.findUnique({
      where: { id: session.user.id },
    });

    if (!admin?.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all psychologists by status
    const status = req.nextUrl.searchParams.get('status') || undefined;

    const psychologists = await prisma.psychologist.findMany({
      where: status ? { status: status as any } : undefined,
      select: {
        id: true,
        email: true,
        fullName: true,
        licenseNumber: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      pending: await prisma.psychologist.count({
        where: { status: 'PENDING' },
      }),
      active: await prisma.psychologist.count({
        where: { status: 'ACTIVE' },
      }),
      inactive: await prisma.psychologist.count({
        where: { status: 'INACTIVE' },
      }),
    };

    return NextResponse.json({
      psychologists,
      stats,
    });
  } catch (error) {
    console.error('GET /api/admin/psychologists error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
