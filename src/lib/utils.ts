import fs from 'fs';
import path from 'path';

/**
 * Ensures a directory exists, creating it if necessary
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Normalizes a video path by removing leading slashes
 */
export function normalizeVideoPath(videoPath: string): string {
  return videoPath.startsWith('/') ? videoPath.slice(1) : videoPath;
}

/**
 * Gets the full file system path for a video
 */
export function getFullVideoPath(videoPath: string): string {
  const cleanPath = normalizeVideoPath(videoPath);
  return path.join(process.cwd(), 'public', cleanPath);
}

/**
 * Converts a full path to a public URL path
 */
export function toPublicPath(fullPath: string): string {
  return fullPath.replace(path.join(process.cwd(), 'public'), '').replace(/\\/g, '/');
}

/**
 * Generates a timestamped filename
 */
export function generateTimestampedFilename(extension: string = 'mp4'): string {
  return `output-${Date.now()}.${extension}`;
}

/**
 * Clamps a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Creates a delay promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
