import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get('secret');
    const confirm = req.nextUrl.searchParams.get('confirm');

    if (secret !== 'delfosoluciones2026') {
      return NextResponse.json({ error: 'Unauthorized: Invalid secret' }, { status: 401 });
    }

    if (confirm !== 'ESTOY_SEGURO_DE_BORRAR_TODO') {
      return NextResponse.json(
        { 
          error: 'Protección contra borrado accidental', 
          message: 'Para ejecutar la limpieza de la base de datos debes agregar &confirm=ESTOY_SEGURO_DE_BORRAR_TODO a la URL.' 
        }, 
        { status: 400 }
      );
    }

    // Wipe data safely (keeping structure)
    // Deleting in reverse order of dependencies
    await prisma.responseSet.deleteMany({});
    await prisma.scoredResult.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.informedConsent.deleteMany({});
    await prisma.assessment.deleteMany({});
    await prisma.worker.deleteMany({});
    await prisma.interventionPlan.deleteMany({});
    await prisma.organization.deleteMany({});
    
    // Create or update delfosoluciones@gmail.com as Admin
    const email = 'delfosoluciones@gmail.com';
    const passwordHash = await bcrypt.hash('Delfosoluciones2026!', 12);

    const admin = await prisma.psychologist.upsert({
      where: { email },
      update: {
        isAdmin: true,
        status: 'ACTIVE',
        creditBalance: 999999999, // Infinite tokens essentially
        passwordHash // Update password to default
      },
      create: {
        email,
        passwordHash,
        fullName: 'Delfo Soluciones (Admin)',
        licenseNumber: 'DELFO-ADMIN-001',
        professionalCard: 'TP-DELFO',
        sstCredential: 'SST-DELFO',
        isAdmin: true,
        status: 'ACTIVE',
        creditBalance: 999999999
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Base de datos limpiada con éxito.',
      admin: {
        email: admin.email,
        status: admin.status,
        tokens: admin.creditBalance
      }
    });

  } catch (error: any) {
    console.error('Reset DB error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
