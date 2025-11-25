import fs from 'fs';
import path from 'path';


export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}


export function normalizeVideoPath(videoPath: string): string {
  return videoPath.startsWith('/') ? videoPath.slice(1) : videoPath;
}


export function getFullVideoPath(videoPath: string): string {
  const cleanPath = normalizeVideoPath(videoPath);
  return path.join(process.cwd(), 'public', cleanPath);
}


export function toPublicPath(fullPath: string): string {
  return fullPath.replace(path.join(process.cwd(), 'public'), '').replace(/\\/g, '/');
}

export function generateTimestampedFilename(extension: string = 'mp4'): string {
  return `output-${Date.now()}.${extension}`;
}


export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}


export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
