import type { NextApiRequest, NextApiResponse } from 'next';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, getVideoMetadata } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { setRenderProgress, resetRenderProgress, mapRenderingProgress } from '@/lib/progress';
import { 
  ERROR_MESSAGES, 
  RENDER_CONFIG, 
  PATHS, 
  FILE_CONFIG,
  CAPTION_STYLES 
} from '@/lib/constants';
import {
  ensureDirectoryExists,
  getFullVideoPath,
  toPublicPath,
  generateTimestampedFilename,
  delay,
} from '@/lib/utils';
import type { RenderRequest, RenderResponse, ErrorResponse } from '@/lib/types';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: FILE_CONFIG.API_BODY_SIZE_LIMIT,
    },
  },
};

/**
 * POST /api/render
 * Renders a video with captions using Remotion
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RenderResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  try {
    const { videoPath, captions, style }: RenderRequest = req.body;

    // Validate required parameters
    if (!videoPath || !captions) {
      return res.status(400).json({ error: ERROR_MESSAGES.MISSING_PARAMETERS });
    }

    resetRenderProgress();

    // Validate video file exists
    const fullVideoPath = getFullVideoPath(videoPath);
    if (!fs.existsSync(fullVideoPath)) {
      return res.status(404).json({ 
        error: ERROR_MESSAGES.VIDEO_NOT_FOUND, 
        path: fullVideoPath 
      });
    }

    // Get video metadata to determine duration
    setRenderProgress(5);
    const videoMetadata = await getVideoMetadata(fullVideoPath);
    const durationInSeconds = videoMetadata.durationInSeconds || RENDER_CONFIG.DEFAULT_DURATION_SECONDS;
    const durationInFrames = Math.ceil(durationInSeconds * RENDER_CONFIG.FPS);

    // Bundle the Remotion project
    setRenderProgress(10);
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), PATHS.REMOTION_ENTRY),
      webpackOverride: (config) => config,
    });

    // Select composition with input props
    setRenderProgress(RENDER_CONFIG.BUNDLING_PROGRESS_END);
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: PATHS.COMPOSITION_ID,
      inputProps: {
        videoSrc: videoPath,
        captions,
        style: style || CAPTION_STYLES.BOTTOM_CENTERED,
      },
    });

    // Prepare output directory and path
    const rendersDir = path.join(process.cwd(), PATHS.RENDERS_DIR);
    ensureDirectoryExists(rendersDir);
    
    const outputPath = path.join(rendersDir, generateTimestampedFilename());

    // Render the video
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames,
        fps: RENDER_CONFIG.FPS,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        videoSrc: videoPath,
        captions,
        style: style || CAPTION_STYLES.BOTTOM_CENTERED,
      },
      onProgress: ({ progress }) => {
        const mappedProgress = mapRenderingProgress(
          progress,
          RENDER_CONFIG.BUNDLING_PROGRESS_END,
          RENDER_CONFIG.RENDERING_PROGRESS_WEIGHT
        );
        setRenderProgress(mappedProgress);
      },
    });

    setRenderProgress(100);

    // Small delay to ensure frontend receives the 100% update
    await delay(RENDER_CONFIG.PROGRESS_ENSURE_COMPLETION_DELAY_MS);

    const publicPath = toPublicPath(outputPath);

    res.status(200).json({
      success: true,
      outputPath: publicPath,
    });

    // Clean up progress file after response is sent
    setTimeout(() => resetRenderProgress(), RENDER_CONFIG.PROGRESS_CLEANUP_DELAY_MS);
  } catch (error: any) {
    console.error('Error rendering video:', error);
    resetRenderProgress();
    res.status(500).json({
      error: ERROR_MESSAGES.RENDER_FAILED,
      details: error.message,
    });
  }
}
