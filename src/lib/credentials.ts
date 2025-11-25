import fs from 'fs';
import path from 'path';

/**
 * Initializes Google Cloud credentials for serverless environments
 * Handles both local development (key.json) and production (base64 env var)
 */
export function initializeGoogleCredentials(): void {
  // If running locally with key.json, use it
  const localKeyPath = path.join(process.cwd(), 'key.json');
  if (fs.existsSync(localKeyPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = localKeyPath;
    return;
  }

  // For serverless environments (Vercel, etc.), decode base64 credentials
  const base64Creds = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (base64Creds) {
    try {
      const keyJson = Buffer.from(base64Creds, 'base64').toString('utf-8');
      const tempKeyPath = '/tmp/google-credentials.json';
      fs.writeFileSync(tempKeyPath, keyJson);
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tempKeyPath;
      console.log('Google credentials initialized from base64');
    } catch (error) {
      console.error('Failed to initialize Google credentials:', error);
    }
  }
}

/**
 * Checks if Google Cloud credentials are properly configured
 */
export function areCredentialsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_CREDENTIALS_BASE64
  );
}
