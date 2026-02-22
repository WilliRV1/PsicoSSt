import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/profile/signature
 * Get psychologist's current signatures (drawn and/or uploaded)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const psychologist = await prisma.psychologist.findUnique({
      where: { email: session.user.email },
      include: {
        signatures: true,
      },
    });

    if (!psychologist) {
      return NextResponse.json(
        { error: 'Psychologist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      drawn: psychologist.signatures.find((s) => s.signatureType === 'drawn'),
      uploaded: psychologist.signatures.find((s) => s.signatureType === 'uploaded'),
    });
  } catch (error) {
    console.error('GET /api/profile/signature error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/signature
 * Save or update a signature (drawn or uploaded)
 * Body: { signatureType: 'drawn' | 'uploaded', dataUrl?: string, imageUrl?: string, fileName?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { signatureType, dataUrl, imageUrl, fileName } = body;

    // Validation
    if (!signatureType || !['drawn', 'uploaded'].includes(signatureType)) {
      return NextResponse.json(
        { error: 'Invalid signature type. Must be "drawn" or "uploaded"' },
        { status: 400 }
      );
    }

    if (signatureType === 'drawn' && !dataUrl) {
      return NextResponse.json(
        { error: 'dataUrl required for drawn signatures' },
        { status: 400 }
      );
    }

    if (signatureType === 'uploaded' && !imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl required for uploaded signatures' },
        { status: 400 }
      );
    }

    const psychologist = await prisma.psychologist.findUnique({
      where: { email: session.user.email },
    });

    if (!psychologist) {
      return NextResponse.json(
        { error: 'Psychologist not found' },
        { status: 404 }
      );
    }

    // Upsert signature
    const signature = await prisma.psychologistSignature.upsert({
      where: {
        psychologistId_signatureType: {
          psychologistId: psychologist.id,
          signatureType,
        },
      },
      update: {
        dataUrl: signatureType === 'drawn' ? dataUrl : null,
        imageUrl: signatureType === 'uploaded' ? imageUrl : null,
        fileName: signatureType === 'uploaded' ? fileName : null,
        updatedAt: new Date(),
      },
      create: {
        psychologistId: psychologist.id,
        signatureType,
        dataUrl: signatureType === 'drawn' ? dataUrl : null,
        imageUrl: signatureType === 'uploaded' ? imageUrl : null,
        fileName: signatureType === 'uploaded' ? fileName : null,
      },
    });

    return NextResponse.json({
      success: true,
      signature,
    });
  } catch (error) {
    console.error('POST /api/profile/signature error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/signature
 * Delete a signature (drawn or uploaded)
 * Query params: signatureType (drawn | uploaded)
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const signatureType = req.nextUrl.searchParams.get('signatureType');

    if (!signatureType || !['drawn', 'uploaded'].includes(signatureType)) {
      return NextResponse.json(
        { error: 'Invalid or missing signatureType parameter' },
        { status: 400 }
      );
    }

    const psychologist = await prisma.psychologist.findUnique({
      where: { email: session.user.email },
    });

    if (!psychologist) {
      return NextResponse.json(
        { error: 'Psychologist not found' },
        { status: 404 }
      );
    }

    const result = await prisma.psychologistSignature.deleteMany({
      where: {
        psychologistId: psychologist.id,
        signatureType,
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error('DELETE /api/profile/signature error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
