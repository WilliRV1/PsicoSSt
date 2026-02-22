import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** POST /api/admin/psychologists/approve */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await prisma.psychologist.findUnique({ where: { id: session.user.id } });
    if (!admin?.isAdmin) return NextResponse.json({ error: 'Forbidden: Admin required' }, { status: 403 });

    const { psychologistId, status } = await req.json();
    if (!psychologistId || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const psychologist = await prisma.psychologist.findUnique({ where: { id: psychologistId } });
    if (!psychologist) return NextResponse.json({ error: 'Psychologist not found' }, { status: 404 });

    const updated = await prisma.psychologist.update({
      where: { id: psychologistId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: status === 'ACTIVE' ? 'CREATE' : 'DELETE',
        resourceType: 'Psychologist',
        resourceId: psychologistId,
        metadata: { action: status === 'ACTIVE' ? 'approved' : 'rejected', previousStatus: psychologist.status, newStatus: status },
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
        userAgent: req.headers.get('user-agent') ?? 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Psicólogo ${status === 'ACTIVE' ? 'aprobado' : 'rechazado'}`,
      psychologist: { id: updated.id, email: updated.email, fullName: updated.fullName, status: updated.status },
    });
  } catch (error) {
    console.error('POST /api/admin/psychologists/approve:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** GET /api/admin/psychologists/approve?status=... */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await prisma.psychologist.findUnique({ where: { id: session.user.id } });
    if (!admin?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const statusParam = req.nextUrl.searchParams.get('status') as any;
    const psychologists = await prisma.psychologist.findMany({
      where: statusParam ? { status: statusParam } : undefined,
      select: { id: true, email: true, fullName: true, licenseNumber: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      pending: await prisma.psychologist.count({ where: { status: 'PENDING' } }),
      active: await prisma.psychologist.count({ where: { status: 'ACTIVE' } }),
      inactive: await prisma.psychologist.count({ where: { status: 'INACTIVE' } }),
    };

    return NextResponse.json({ psychologists, stats });
  } catch (error) {
    console.error('GET /api/admin/psychologists/approve:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
