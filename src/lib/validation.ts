import { execSync } from 'child_process';

export function isFFmpegInstalled(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function validateGoogleCloudConfig(): { isValid: boolean; error?: string; details?: string } {
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID === 'your-project-id') {
    return {
      isValid: false,
      error: 'Google Cloud not configured',
      details: 'Please set GOOGLE_CLOUD_PROJECT_ID in your .env file with your actual Google Cloud Project ID',
    };
  }

  if (!process.env.GOOGLE_CLOUD_BUCKET_NAME) {
    return {
      isValid: false,
      error: 'Google Cloud Storage not configured',
      details: 'Please set GOOGLE_CLOUD_BUCKET_NAME in your .env file with your bucket name',
    };
  }

  return { isValid: true };
}
