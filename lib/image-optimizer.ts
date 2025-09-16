import sharp from 'sharp';
import QRCode from 'qrcode';
import { performanceTracker } from './performance';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'avif' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

class ImageOptimizer {
  private cache: Map<string, Buffer> = new Map();
  private readonly maxCacheSize = 100; // Maximum number of cached images
  private readonly cacheTimeout = 15 * 60 * 1000; // 15 minutes

  /**
   * Optimize an image with Sharp
   */
  async optimizeImage(
    input: Buffer | string,
    options: ImageOptimizationOptions = {}
  ): Promise<Buffer> {
    performanceTracker.mark('image_optimize_start');
    
    try {
      const {
        width,
        height,
        quality = 85,
        format = 'webp',
        fit = 'cover',
      } = options;

      let pipeline = sharp(input);

      // Resize if dimensions provided
      if (width || height) {
        pipeline = pipeline.resize(width, height, { fit });
      }

      // Convert to specified format with quality
      switch (format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality, progressive: true });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality });
          break;
        case 'avif':
          pipeline = pipeline.avif({ quality });
          break;
        case 'png':
          pipeline = pipeline.png({ 
            quality, 
            compressionLevel: 9,
            progressive: true 
          });
          break;
      }

      const optimized = await pipeline.toBuffer();
      
      performanceTracker.measure('image_optimization', 'image_optimize_start');
      
      return optimized;
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw new Error('Failed to optimize image');
    }
  }

  /**
   * Generate QR code for exam codes
   */
  async generateQRCode(
    data: string,
    options: QRCodeOptions = {}
  ): Promise<Buffer> {
    performanceTracker.mark('qr_generate_start');
    
    // Check cache first
    const cacheKey = `qr_${data}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const {
        width = 300,
        margin = 4,
        color = {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel = 'M',
      } = options;

      // Generate QR code as buffer
      const qrBuffer = await QRCode.toBuffer(data, {
        width,
        margin,
        color,
        errorCorrectionLevel,
        type: 'png',
      });

      // Optimize the QR code image
      const optimized = await this.optimizeImage(qrBuffer, {
        format: 'png',
        quality: 100, // Keep high quality for QR codes
      });

      // Cache the result
      this.addToCache(cacheKey, optimized);
      
      performanceTracker.measure('qr_generation', 'qr_generate_start');
      
      return optimized;
    } catch (error) {
      console.error('QR code generation failed:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate responsive image set
   */
  async generateResponsiveImages(
    input: Buffer | string,
    sizes: number[] = [640, 750, 828, 1080, 1200, 1920]
  ): Promise<Map<number, Buffer>> {
    performanceTracker.mark('responsive_generate_start');
    
    const results = new Map<number, Buffer>();
    
    try {
      // Process images in parallel for better performance
      const promises = sizes.map(async (width) => {
        const optimized = await this.optimizeImage(input, {
          width,
          format: 'webp',
          quality: 85,
        });
        return { width, buffer: optimized };
      });

      const processed = await Promise.all(promises);
      
      for (const { width, buffer } of processed) {
        results.set(width, buffer);
      }
      
      performanceTracker.measure('responsive_generation', 'responsive_generate_start');
      
      return results;
    } catch (error) {
      console.error('Responsive image generation failed:', error);
      throw new Error('Failed to generate responsive images');
    }
  }

  /**
   * Compress upload images
   */
  async compressUpload(
    input: Buffer,
    maxWidth: number = 2048,
    maxFileSize: number = 1024 * 1024 // 1MB
  ): Promise<Buffer> {
    performanceTracker.mark('compress_upload_start');
    
    try {
      // Get metadata
      const metadata = await sharp(input).metadata();
      
      // Calculate resize dimensions if needed
      let width = metadata.width;
      if (width && width > maxWidth) {
        width = maxWidth;
      }

      // Start with high quality
      let quality = 95;
      let compressed: Buffer;
      
      // Progressively reduce quality to meet file size requirement
      do {
        compressed = await this.optimizeImage(input, {
          width,
          format: 'jpeg',
          quality,
        });
        
        if (compressed.length <= maxFileSize) {
          break;
        }
        
        quality -= 5;
      } while (quality > 60);
      
      performanceTracker.measure('upload_compression', 'compress_upload_start');
      
      return compressed;
    } catch (error) {
      console.error('Upload compression failed:', error);
      throw new Error('Failed to compress upload');
    }
  }

  /**
   * Generate thumbnail
   */
  async generateThumbnail(
    input: Buffer | string,
    size: number = 200
  ): Promise<Buffer> {
    return this.optimizeImage(input, {
      width: size,
      height: size,
      fit: 'cover',
      format: 'webp',
      quality: 80,
    });
  }

  /**
   * Cache management
   */
  private addToCache(key: string, value: Buffer) {
    // Implement LRU cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, value);
    
    // Auto-clear after timeout
    setTimeout(() => {
      this.cache.delete(key);
    }, this.cacheTimeout);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const imageOptimizer = new ImageOptimizer();

// Utility functions for common operations
export const imageUtils = {
  /**
   * Generate exam code QR with standard formatting
   */
  async generateExamQR(examCode: string): Promise<Buffer> {
    const data = JSON.stringify({
      code: examCode,
      platform: 'TBAT Mock Exam',
      timestamp: Date.now(),
    });
    
    return imageOptimizer.generateQRCode(data, {
      width: 400,
      errorCorrectionLevel: 'H', // High error correction for exam codes
    });
  },

  /**
   * Process profile avatar
   */
  async processAvatar(input: Buffer): Promise<Buffer> {
    return imageOptimizer.optimizeImage(input, {
      width: 256,
      height: 256,
      fit: 'cover',
      format: 'webp',
      quality: 90,
    });
  },

  /**
   * Process document preview
   */
  async processDocumentPreview(input: Buffer): Promise<Buffer> {
    return imageOptimizer.optimizeImage(input, {
      width: 1200,
      format: 'jpeg',
      quality: 85,
    });
  },
};