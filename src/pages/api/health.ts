import type { NextApiRequest, NextApiResponse } from 'next';

interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  services: {
    googleCloud: boolean;
    ffmpeg: boolean;
  };
}

/**
 * GET /api/health
 * Health check endpoint for monitoring service status
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        googleCloud: false,
        ffmpeg: false,
      },
    });
  }

  // Check Google Cloud credentials
  const hasGoogleCreds = !!(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_CREDENTIALS_BASE64
  );

  // Check if FFmpeg is available
  let hasFFmpeg = false;
  try {
    require('child_process').execSync('ffmpeg -version', { stdio: 'ignore' });
    hasFFmpeg = true;
  } catch (e) {
    hasFFmpeg = false;
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    services: {
      googleCloud: hasGoogleCreds,
      ffmpeg: hasFFmpeg,
    },
  });
}
