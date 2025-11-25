import type { NextApiRequest, NextApiResponse } from 'next';
import { transcribeAudio, extractAudioFromVideo } from '@/services/speechToText';
import multer from 'multer';
import path from 'path';
import { runMiddleware, unlinkAsync } from '@/lib/middleware';
import { isFFmpegInstalled, validateGoogleCloudConfig } from '@/lib/validation';
import { initializeGoogleCredentials } from '@/lib/credentials';
import { ERROR_MESSAGES, FILE_CONFIG, PATHS } from '@/lib/constants';
import type { UploadResponse, ErrorResponse } from '@/lib/types';

// Configure multer for file uploads
const upload = multer({
  dest: `./${PATHS.UPLOADS_DIR}/`,
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
 * Uploads a video, extracts audio, and generates captions using Google Cloud Speech-to-Text
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  try {
    // Initialize Google Cloud credentials (for Vercel deployment)
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

    // Handle file upload
    await runMiddleware(req, res, uploadMiddleware);

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: ERROR_MESSAGES.NO_FILE_UPLOADED });
    }

    const videoPath = file.path;
    const audioPath = path.join(`./${PATHS.UPLOADS_DIR}/`, `${file.filename}.mp3`);

    // Extract audio from video
    console.log('Extracting audio from video...');
    await extractAudioFromVideo(videoPath, audioPath);

    // Transcribe audio to generate captions
    console.log('Transcribing audio...');
    const captions = await transcribeAudio(audioPath);

    // Clean up temporary audio file
    await unlinkAsync(audioPath);

    res.status(200).json({
      success: true,
      videoPath: `/uploads/${file.filename}`,
      captions,
    });
  } catch (error: any) {
    console.error('Error processing video:', error);
    res.status(500).json({
      error: ERROR_MESSAGES.UPLOAD_FAILED,
      details: error.message,
    });
  }
}
