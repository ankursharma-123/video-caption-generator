import { Storage } from "@google-cloud/storage";
import { initializeGoogleCredentials } from "./credentials";

// Initialize credentials
initializeGoogleCredentials();

const storage = new Storage();
const BUCKET_NAME = process.env.GOOGLE_CLOUD_BUCKET_NAME || "captiongenerator";

export interface UploadResult {
  publicUrl: string;
  gcsUri: string;
  fileName: string;
}

export async function uploadToGCS(
  filePath: string,
  destination: string
): Promise<UploadResult> {
  const bucket = storage.bucket(BUCKET_NAME);
  const contentType = destination.endsWith(".mp4")
    ? "video/mp4"
    : destination.endsWith(".mp3")
    ? "audio/mpeg"
    : "application/octet-stream";

  const [file] = await bucket.upload(filePath, {
    destination: destination,
    metadata: {
      contentType: contentType,
      cacheControl: "public, max-age=31536000",
    },
  });

  // Generate signed URL for secure access (valid for 7 days)
  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const gcsUri = `gs://${BUCKET_NAME}/${destination}`;

  return {
    publicUrl: signedUrl,
    gcsUri,
    fileName: destination,
  };
}

export async function deleteFromGCS(fileName: string): Promise<void> {
  try {
    await storage.bucket(BUCKET_NAME).file(fileName).delete();
    console.log(`Deleted ${fileName} from GCS`);
  } catch (error) {
    console.error("Error deleting from GCS:", error);
  }
}

export async function getSignedUrl(
  fileName: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  try {
    const [url] = await storage
      .bucket(BUCKET_NAME)
      .file(fileName)
      .getSignedUrl({
        action: "read",
        expires: Date.now() + expiresIn * 1000,
      });

    return url;
  } catch (error) {
    console.error("Error getting signed URL:", error);
    throw error;
  }
}

