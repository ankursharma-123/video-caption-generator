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
  const bucket = storage.bucket(BUCKET_NAME);
  
  try {
    // Determine content type based on file extension
    const contentType = destination.endsWith('.mp4') ? 'video/mp4' : 
                       destination.endsWith('.mp3') ? 'audio/mpeg' : 
                       'application/octet-stream';
    
    // Upload the file with public access (if uniform bucket-level access is enabled)
    const uploadOptions: any = {
      destination: destination,
      metadata: {
        contentType: contentType,
        cacheControl: 'public, max-age=31536000',
        metadata: {
          firebaseStorageDownloadTokens: undefined, // Prevent Firebase token
        },
      },
    };

    // If makePublic is true, set predefined ACL during upload
    if (makePublic) {
      uploadOptions.predefinedAcl = 'publicRead';
    }

    const [file] = await bucket.upload(filePath, uploadOptions);

    // URL encode the filename for the public URL
    const encodedDestination = destination.split('/').map(part => encodeURIComponent(part)).join('/');
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${encodedDestination}`;
    const gcsUri = `gs://${BUCKET_NAME}/${destination}`;

    return {
      publicUrl,
      gcsUri,
      fileName: destination,
    };
  } catch (error: any) {
    // If uniform bucket-level access is enabled, we can't use predefinedAcl
    // Check if it's that specific error and handle gracefully
    if (error.message && error.message.includes('uniform bucket-level access')) {
      console.log('Note: Bucket has uniform access enabled. Files will use bucket-level permissions.');
      
      // Determine content type
      const contentType = destination.endsWith('.mp4') ? 'video/mp4' : 
                         destination.endsWith('.mp3') ? 'audio/mpeg' : 
                         'application/octet-stream';
      
      // Upload without ACL
      const [file] = await bucket.upload(filePath, {
        destination: destination,
        metadata: {
          contentType: contentType,
          cacheControl: 'public, max-age=31536000',
        },
      });

      // URL encode the filename for the public URL
      const encodedDestination = destination.split('/').map(part => encodeURIComponent(part)).join('/');
      const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${encodedDestination}`;
      const gcsUri = `gs://${BUCKET_NAME}/${destination}`;

      return {
        publicUrl,
        gcsUri,
        fileName: destination,
      };
    }
    
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
