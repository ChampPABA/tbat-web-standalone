import { NextRequest, NextResponse } from 'next/server';
import { imageOptimizer } from '@/lib/image-optimizer';
import { z } from 'zod';
import { getServerSession } from 'next-auth';

const qrSchema = z.object({
  data: z.string().min(1).max(1000),
  width: z.number().min(100).max(1000).optional(),
  margin: z.number().min(0).max(10).optional(),
  errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { data, ...options } = qrSchema.parse(body);

    // Generate QR code
    const qrBuffer = await imageOptimizer.generateQRCode(data, options);

    // Return QR code image
    return new NextResponse(qrBuffer as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const data = searchParams.get('data');
    
    if (!data) {
      return NextResponse.json(
        { error: 'No data provided' },
        { status: 400 }
      );
    }

    const options = {
      width: searchParams.get('width') ? Number(searchParams.get('width')) : undefined,
      margin: searchParams.get('margin') ? Number(searchParams.get('margin')) : undefined,
    };

    // Generate QR code
    const qrBuffer = await imageOptimizer.generateQRCode(data, options);

    // Return QR code image
    return new NextResponse(qrBuffer as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}