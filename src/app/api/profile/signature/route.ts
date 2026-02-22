import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const db = prisma as any; // Use `as any` since Prisma is generated locally

/** GET /api/profile/signature */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const psychologistId = session.user.id;
    const signatures = await db.psychologistSignature.findMany({ where: { psychologistId } });

    return NextResponse.json({
      drawn: signatures.find((s: any) => s.signatureType === 'drawn') ?? null,
      uploaded: signatures.find((s: any) => s.signatureType === 'uploaded') ?? null,
    });
  } catch (error) {
    console.error('GET /api/profile/signature:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST /api/profile/signature */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const psychologistId = session.user.id;
    const { signatureType, dataUrl, imageUrl, fileName } = await req.json();

    if (!signatureType || !['drawn', 'uploaded'].includes(signatureType)) {
      return NextResponse.json({ error: 'Invalid signatureType' }, { status: 400 });
    }
    if (signatureType === 'drawn' && !dataUrl) {
      return NextResponse.json({ error: 'dataUrl required for drawn' }, { status: 400 });
    }
    if (signatureType === 'uploaded' && !imageUrl) {
      return NextResponse.json({ error: 'imageUrl required for uploaded' }, { status: 400 });
    }

    const signature = await db.psychologistSignature.upsert({
      where: { psychologistId_signatureType: { psychologistId, signatureType } },
      update: {
        dataUrl: signatureType === 'drawn' ? dataUrl : null,
        imageUrl: signatureType === 'uploaded' ? imageUrl : null,
        fileName: signatureType === 'uploaded' ? (fileName ?? null) : null,
      },
      create: {
        psychologistId,
        signatureType,
        dataUrl: signatureType === 'drawn' ? dataUrl : null,
        imageUrl: signatureType === 'uploaded' ? imageUrl : null,
        fileName: signatureType === 'uploaded' ? (fileName ?? null) : null,
      },
    });

    return NextResponse.json({ success: true, signature });
  } catch (error) {
    console.error('POST /api/profile/signature:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE /api/profile/signature?signatureType=drawn|uploaded */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const psychologistId = session.user.id;
    const signatureType = req.nextUrl.searchParams.get('signatureType');

    if (!signatureType || !['drawn', 'uploaded'].includes(signatureType)) {
      return NextResponse.json({ error: 'Invalid signatureType' }, { status: 400 });
    }

    const result = await db.psychologistSignature.deleteMany({
      where: { psychologistId, signatureType },
    });

    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error('DELETE /api/profile/signature:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
