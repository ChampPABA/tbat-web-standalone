import { NextRequest, NextResponse } from 'next/server';
import { imageOptimizer } from '@/lib/image-optimizer';
import { z } from 'zod';

const optimizeSchema = z.object({
  width: z.number().min(1).max(4096).optional(),
  height: z.number().min(1).max(4096).optional(),
  quality: z.number().min(1).max(100).optional(),
  format: z.enum(['jpeg', 'webp', 'avif', 'png']).optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Parse options
    const options = optimizeSchema.parse({
      width: formData.get('width') ? Number(formData.get('width')) : undefined,
      height: formData.get('height') ? Number(formData.get('height')) : undefined,
      quality: formData.get('quality') ? Number(formData.get('quality')) : undefined,
      format: formData.get('format') || undefined,
      fit: formData.get('fit') || undefined,
    });

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optimize image
    const optimized = await imageOptimizer.optimizeImage(buffer, options);

    // Return optimized image
    return new NextResponse(optimized as BodyInit, {
      headers: {
        'Content-Type': `image/${options.format || 'webp'}`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize image' },
      { status: 500 }
    );
  }
}