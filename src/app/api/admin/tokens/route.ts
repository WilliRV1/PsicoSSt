import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit, extractRequestMeta } from '@/lib/auth/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.psychologist.findUnique({ where: { id: session.user.id } });
    if (!admin?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin required' }, { status: 403 });
    }

    const body = await req.json();
    const { psychologistId, tokens } = body;
    const tokensToAdd = parseInt(tokens);

    if (!psychologistId || isNaN(tokensToAdd) || tokensToAdd <= 0) {
      return NextResponse.json({ error: 'Monto de tokens inválido o usuario no especificado' }, { status: 400 });
    }

    const psychologist = await prisma.psychologist.findUnique({ where: { id: psychologistId } });
    if (!psychologist) {
      return NextResponse.json({ error: 'Psychologist not found' }, { status: 404 });
    }

    const newBalance = psychologist.creditBalance + tokensToAdd;

    // Assign tokens in a transaction
    const [updated] = await prisma.$transaction([
      prisma.psychologist.update({
        where: { id: psychologistId },
        data: { creditBalance: newBalance }
      }),
      prisma.creditTransaction.create({
        data: {
          psychologistId,
          amount: tokensToAdd,
          balanceAfter: newBalance,
          type: 'ADMIN_GRANT',
          description: `Tokens asignados manualmente por el administrador (${admin.email})`
        }
      })
    ]);

    const { ipAddress, userAgent } = extractRequestMeta(req);
    await logAudit({
      userId: admin.id,
      action: 'UPDATE',
      resourceType: 'Psychologist',
      resourceId: psychologistId,
      metadata: { action: 'assigned_tokens', amount: tokensToAdd, previousBalance: psychologist.creditBalance },
      ipAddress,
      userAgent
    });

    return NextResponse.json({
      success: true,
      message: `${tokensToAdd} tokens asignados a ${psychologist.fullName}`,
      newBalance: updated.creditBalance
    });

  } catch (error) {
    console.error('POST /api/admin/tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
