import { Storage } from '@google-cloud/storage';
import { initializeGoogleCredentials } from './credentials';

// Initialize credentials
initializeGoogleCredentials();

const storage = new Storage();
const BUCKET_NAME = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'captiongenerator';

export interface UploadResult {
  publicUrl: string;
  gcsUri: string;
  fileName: string;
}

/**
 * Upload a file to Google Cloud Storage
 */
export async function uploadToGCS(
  filePath: string,
  destination: string,
  makePublic: boolean = true
): Promise<UploadResult> {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Upload the file
    const [file] = await bucket.upload(filePath, {
      destination: destination,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Make file publicly accessible if requested
    if (makePublic) {
      await file.makePublic();
    }

    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destination}`;
    const gcsUri = `gs://${BUCKET_NAME}/${destination}`;

    return {
      publicUrl,
      gcsUri,
      fileName: destination,
    };
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    throw error;
  }
}

/**
 * Delete a file from Google Cloud Storage
 */
export async function deleteFromGCS(fileName: string): Promise<void> {
  try {
    await storage.bucket(BUCKET_NAME).file(fileName).delete();
    console.log(`Deleted ${fileName} from GCS`);
  } catch (error) {
    console.error('Error deleting from GCS:', error);
    // Don't throw - deletion failures shouldn't break the flow
  }
}

/**
 * Get a signed URL for temporary access (useful for private files)
 */
export async function getSignedUrl(
  fileName: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  try {
    const [url] = await storage
      .bucket(BUCKET_NAME)
      .file(fileName)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
      });
    
    return url;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
}

/**
 * Check if a file exists in GCS
 */
export async function fileExistsInGCS(fileName: string): Promise<boolean> {
  try {
    const [exists] = await storage.bucket(BUCKET_NAME).file(fileName).exists();
    return exists;
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
}
