import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get('secret');

    // Simple security check so not anyone can run this
    if (secret !== 'recuperar2026') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const email = 'delfosoluciones@gmail.com';
    const passwordHash = await bcrypt.hash('Delfosoluciones2026!', 12);

    const admin = await prisma.psychologist.upsert({
      where: { email },
      update: {
        isAdmin: true,
        status: 'ACTIVE',
        passwordHash, 
        creditBalance: 999999999, // Restore tokens just in case
      },
      create: {
        email,
        passwordHash,
        fullName: 'Delfo Soluciones',
        licenseNumber: 'DELFO-ADMIN-001',
        professionalCard: 'TP-DELFO',
        sstCredential: 'SST-DELFO',
        isAdmin: true,
        status: 'ACTIVE',
        creditBalance: 999999999,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Cuenta de administrador forzada/recuperada con éxito.',
      email: admin.email,
    });

  } catch (error: any) {
    console.error('Force admin error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
