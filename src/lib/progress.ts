import fs from 'fs';
import path from 'path';
import { FILE_CONFIG } from './constants';
import { ProgressData } from './types';
import { clamp, ensureDirectoryExists } from './utils';

// Use /tmp directory for progress file on serverless/production environments
const PROGRESS_DIR = process.env.NODE_ENV === 'production' 
  ? '/tmp' 
  : path.join(process.cwd(), 'public');

const PROGRESS_FILE = path.join(PROGRESS_DIR, FILE_CONFIG.PROGRESS_FILE_NAME);

/**
 * Writes render progress to a file for cross-instance communication
 */
export function setRenderProgress(progress: number): void {
  const clampedProgress = clamp(progress, 0, 100);
  const progressData: ProgressData = {
    progress: clampedProgress,
    timestamp: Date.now(),
  };

  try {
    // Ensure directory exists
    ensureDirectoryExists(PROGRESS_DIR);
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progressData));
  } catch (error) {
    console.error('Error writing progress:', error);
  }
}

/**
 * Reads the current render progress from file
 */
export function getRenderProgress(): number {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      const progressData: ProgressData = JSON.parse(data);
      return progressData.progress;
    }
  } catch (error) {
    console.error('Error reading progress:', error);
  }
  return 0;
}

/**
 * Resets render progress by removing the progress file
 */
export function resetRenderProgress(): void {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
    }
  } catch (error) {
    console.error('Error resetting progress:', error);
  }
}

/**
 * Maps Remotion's 0-1 progress to the bundling phase (0-20%)
 */
export function mapBundlingProgress(progress: number, startPercent: number, endPercent: number): number {
  return startPercent + (progress * (endPercent - startPercent));
}

/**
 * Maps Remotion's 0-1 progress to the rendering phase (20-100%)
 */
export function mapRenderingProgress(progress: number, startPercent: number, weight: number): number {
  return startPercent + (progress * 100 * weight);
}
