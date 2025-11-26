import type { NextApiRequest, NextApiResponse } from 'next';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { uploadToGCS } from '@/lib/storage';
import {
  ERROR_MESSAGES,
  RENDER_CONFIG,
  PATHS,
  FILE_CONFIG,
  CAPTION_STYLES
} from '@/lib/constants';
import {
  ensureDirectoryExists,
  generateTimestampedFilename,
} from '@/lib/utils';
import type { RenderRequest, RenderResponse, ErrorResponse } from '@/lib/types';

const durationInFrames = 900; 
const fps = RENDER_CONFIG.FPS;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: FILE_CONFIG.API_BODY_SIZE_LIMIT,
    },
  },
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RenderResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  let tempOutputPath: string | null = null;

  try {
    const { videoPath, captions, style }: RenderRequest = req.body;


    if (!videoPath || !captions) {
      return res.status(400).json({ error: ERROR_MESSAGES.MISSING_PARAMETERS });
    }


    // Bundle the Remotion project
    console.log('Bundling Remotion project...');
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), PATHS.REMOTION_ENTRY),
      webpackOverride: (config) => config,
    });


    // Let Remotion download and use its own Chrome Headless Shell
    // System Chromium doesn't support the old headless mode that Remotion requires
    console.log('Selecting composition...');
    
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: PATHS.COMPOSITION_ID,
      inputProps: {
        videoSrc: videoPath,
        captions,
        style: style || CAPTION_STYLES.BOTTOM_CENTERED,
      },
      chromiumOptions: {
        enableMultiProcessOnLinux: true,
      },
    });

    const tempDir = '/tmp/renders';
    ensureDirectoryExists(tempDir);
    tempOutputPath = path.join(tempDir, generateTimestampedFilename());

    console.log('Rendering video with captions...');
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames,
        fps: RENDER_CONFIG.FPS,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: tempOutputPath,
      inputProps: {
        videoSrc: videoPath,
        captions,
        style: style || CAPTION_STYLES.BOTTOM_CENTERED,
      },
      chromiumOptions: {
        enableMultiProcessOnLinux: true,
      },
    });


    console.log('Uploading rendered video to GCS...');
    const timestamp = Date.now();
    const gcsFileName = `renders/${timestamp}-rendered.mp4`;
    const uploadResult = await uploadToGCS(tempOutputPath, gcsFileName);

    if (tempOutputPath && fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }

    console.log('Video rendered successfully:', uploadResult.publicUrl);

    res.status(200).json({
      success: true,
      outputPath: uploadResult.publicUrl, // Return GCS public URL
    });
  } catch (error: any) {
    console.error('Error rendering video:', error);

    if (tempOutputPath && fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }

    res.status(500).json({
      error: ERROR_MESSAGES.RENDER_FAILED,
      details: error.message,
    });
  }
}
