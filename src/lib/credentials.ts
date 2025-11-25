import fs from 'fs';
import path from 'path';


export function initializeGoogleCredentials(): void {
  const localKeyPath = path.join(process.cwd(), 'key.json');
  if (fs.existsSync(localKeyPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = localKeyPath;
    return;
  }

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


export function areCredentialsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_CREDENTIALS_BASE64
  );
}
