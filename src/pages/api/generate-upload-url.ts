import type { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import { initializeGoogleCredentials } from '@/lib/credentials';
import { ERROR_MESSAGES } from '@/lib/constants';

interface GenerateUrlResponse {
  uploadUrl: string;
  fileName: string;
  publicUrl: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateUrlResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  try {
    initializeGoogleCredentials();

    const { fileName, contentType } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'captiongenerator';
    if (!bucketName) {
      return res.status(500).json({ error: ERROR_MESSAGES.GOOGLE_CLOUD_STORAGE_NOT_CONFIGURED });
    }

    const storage = new Storage();
    const bucket = storage.bucket(bucketName);

    // Generate a unique file name
    const timestamp = Date.now();
    const sanitizedFilename = fileName
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-_]/g, '')
      .toLowerCase();
    const gcsFileName = `videos/${timestamp}-${sanitizedFilename}`;

    const file = bucket.file(gcsFileName);

    // Generate a signed URL for uploading (valid for 15 minutes)
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType || 'video/mp4',
    });

    // Generate a signed URL for reading (valid for 7 days)
    const [publicUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      uploadUrl,
      fileName: gcsFileName,
      publicUrl,
    });
  } catch (error: any) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({
      error: 'Failed to generate upload URL',
      details: error.message,
    });
  }
}
