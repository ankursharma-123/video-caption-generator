import type { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import { transcribeAudio, extractAudioFromVideo } from '@/services/speechToText';
import fs from 'fs';
import path from 'path';
import { unlinkAsync } from '@/lib/middleware';
import { validateGoogleCloudConfig } from '@/lib/validation';
import { initializeGoogleCredentials } from '@/lib/credentials';
import { ERROR_MESSAGES } from '@/lib/constants';
import type { UploadResponse, ErrorResponse } from '@/lib/types';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Small payload - just the file path
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  let videoTempPath: string | null = null;
  let audioTempPath: string | null = null;

  try {
    initializeGoogleCredentials();

    const gcpValidation = validateGoogleCloudConfig();
    if (!gcpValidation.isValid) {
      return res.status(500).json({
        error: gcpValidation.error!,
        details: gcpValidation.details,
      });
    }

    const { gcsFileName, publicUrl } = req.body;

    if (!gcsFileName || !publicUrl) {
      return res.status(400).json({ 
        error: 'Missing required parameters: gcsFileName and publicUrl' 
      });
    }

    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'captiongenerator';
    if (!bucketName) {
      return res.status(500).json({ error: ERROR_MESSAGES.GOOGLE_CLOUD_STORAGE_NOT_CONFIGURED });
    }

    // Download the video from GCS to a temp file
    console.log('Downloading video from GCS for processing...');
    const storage = new Storage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(gcsFileName);

    const timestamp = Date.now();
    videoTempPath = `/tmp/uploads/${timestamp}-video.mp4`;
    audioTempPath = `/tmp/uploads/${timestamp}-audio.mp3`;

    // Ensure temp directory exists
    const tempDir = path.dirname(videoTempPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Download video to temp file
    await file.download({ destination: videoTempPath });
    console.log('Video downloaded to temp file');

    // Extract audio from video
    console.log('Extracting audio from video...');
    await extractAudioFromVideo(videoTempPath, audioTempPath);

    // Transcribe audio
    console.log('Transcribing audio...');
    const captions = await transcribeAudio(audioTempPath);

    // Cleanup temp files
    if (videoTempPath && fs.existsSync(videoTempPath)) {
      await unlinkAsync(videoTempPath);
    }
    if (audioTempPath && fs.existsSync(audioTempPath)) {
      await unlinkAsync(audioTempPath);
    }

    console.log('Video processed successfully');

    res.status(200).json({
      success: true,
      videoPath: publicUrl,
      captions,
    });
  } catch (error: any) {
    console.error('Error processing video:', error);

    // Cleanup temp files on error
    if (videoTempPath && fs.existsSync(videoTempPath)) {
      await unlinkAsync(videoTempPath).catch(console.error);
    }
    if (audioTempPath && fs.existsSync(audioTempPath)) {
      await unlinkAsync(audioTempPath).catch(console.error);
    }

    res.status(500).json({
      error: ERROR_MESSAGES.UPLOAD_FAILED,
      details: error.message,
    });
  }
}
