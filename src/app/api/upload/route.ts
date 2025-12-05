import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isEncrypted = formData.get('encrypted') === 'true';
    const encryptedOriginalName = formData.get('originalName') as string | null;
    const originalType = formData.get('originalType') as string | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // For encrypted files, skip type validation (they're encrypted as binary)
    if (!isEncrypted) {
      // Validate file type (images, PDFs, audio for voice notes)
      const allowedTypes = [
        'image/', // All image types
        'application/pdf', // PDF documents
        'audio/', // Audio files for voice notes
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      ];
      
      const isValidType = allowedTypes.some(type => 
        file.type.startsWith(type) || file.type === type
      );
      
      if (!isValidType) {
        return NextResponse.json({ 
          error: 'Only images, PDFs, documents, and audio files are allowed' 
        }, { status: 400 });
      }
    }

    // Validate file size (max 10MB for images/documents, 5MB for audio)
    // Encrypted files may be slightly larger, so allow 20% overhead
    const maxSize = (originalType?.startsWith('audio/') ? 5 * 1024 * 1024 : 10 * 1024 * 1024) * (isEncrypted ? 1.2 : 1);
    if (file.size > maxSize) {
      const maxSizeMB = (isEncrypted ? maxSize / 1.2 : maxSize) / (1024 * 1024);
      return NextResponse.json({ 
        error: `File size must be less than ${maxSizeMB.toFixed(0)}MB` 
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    // For encrypted files, use .enc extension; otherwise use original extension
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = isEncrypted ? 'enc' : (file.name.split('.').pop() || 'bin');
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    
    // Save file (encrypted files are stored as-is)
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Return the file URL
    const fileUrl = `/uploads/${fileName}`;
    
    return NextResponse.json({
      success: true,
      fileName: fileName,
      fileUrl: fileUrl,
      originalName: isEncrypted && encryptedOriginalName ? encryptedOriginalName : file.name,
      size: file.size,
      type: isEncrypted && originalType ? originalType : file.type,
      encrypted: isEncrypted
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
