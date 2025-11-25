import type { NextApiRequest, NextApiResponse } from 'next';
import { transcribeAudio, extractAudioFromVideo } from '@/services/speechToText';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { runMiddleware, unlinkAsync } from '@/lib/middleware';
import { isFFmpegInstalled, validateGoogleCloudConfig } from '@/lib/validation';
import { initializeGoogleCredentials } from '@/lib/credentials';
import { uploadToGCS, deleteFromGCS } from '@/lib/storage';
import { ERROR_MESSAGES, FILE_CONFIG, PATHS } from '@/lib/constants';
import type { UploadResponse, ErrorResponse } from '@/lib/types';

// Configure multer for temporary file uploads
const upload = multer({
  dest: `/tmp/uploads/`,
  limits: { fileSize: FILE_CONFIG.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
});

const uploadMiddleware = upload.single('video');

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * POST /api/upload
 * Uploads a video to GCS, extracts audio, and generates captions using Google Cloud Speech-to-Text
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  let videoTempPath: string | null = null;
  let audioTempPath: string | null = null;
  let uploadedVideoFileName: string | null = null;

  try {
    // Initialize Google Cloud credentials (for Vercel/Render deployment)
    initializeGoogleCredentials();

    // Validate FFmpeg installation
    if (!isFFmpegInstalled()) {
      return res.status(500).json({
        error: ERROR_MESSAGES.FFMPEG_NOT_INSTALLED,
        details: 'FFmpeg is required to extract audio from video. Please install FFmpeg from https://ffmpeg.org or run: choco install ffmpeg',
      });
    }

    // Validate Google Cloud configuration
    const gcpValidation = validateGoogleCloudConfig();
    if (!gcpValidation.isValid) {
      return res.status(500).json({
        error: gcpValidation.error!,
        details: gcpValidation.details,
      });
    }

    // Handle file upload to temporary location
    await runMiddleware(req, res, uploadMiddleware);

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: ERROR_MESSAGES.NO_FILE_UPLOADED });
    }

    videoTempPath = file.path;
    const timestamp = Date.now();
    const videoFileName = `videos/${timestamp}-${file.originalname}`;
    
    // Upload video to Google Cloud Storage
    console.log('Uploading video to Google Cloud Storage...');
    const videoUpload = await uploadToGCS(videoTempPath, videoFileName, true);
    uploadedVideoFileName = videoUpload.fileName;
    
    console.log('Video uploaded to GCS:', videoUpload.publicUrl);

    // Extract audio to temporary location
    audioTempPath = `/tmp/uploads/${timestamp}-audio.mp3`;
    console.log('Extracting audio from video...');
    await extractAudioFromVideo(videoTempPath, audioTempPath);

    // Transcribe audio (this also uploads audio to GCS internally)
    console.log('Transcribing audio...');
    const captions = await transcribeAudio(audioTempPath);

    // Clean up temporary files
    if (videoTempPath && fs.existsSync(videoTempPath)) {
      await unlinkAsync(videoTempPath);
    }
    if (audioTempPath && fs.existsSync(audioTempPath)) {
      await unlinkAsync(audioTempPath);
    }

    // Return the public URL for the video
    res.status(200).json({
      success: true,
      videoPath: videoUpload.publicUrl, // Public GCS URL
      captions,
    });
  } catch (error: any) {
    console.error('Error processing video:', error);
    
    // Clean up temporary files on error
    if (videoTempPath && fs.existsSync(videoTempPath)) {
      await unlinkAsync(videoTempPath).catch(console.error);
    }
    if (audioTempPath && fs.existsSync(audioTempPath)) {
      await unlinkAsync(audioTempPath).catch(console.error);
    }
    
    // Clean up uploaded video from GCS on error
    if (uploadedVideoFileName) {
      await deleteFromGCS(uploadedVideoFileName);
    }

    res.status(500).json({
      error: ERROR_MESSAGES.UPLOAD_FAILED,
      details: error.message,
    });
  }
}
