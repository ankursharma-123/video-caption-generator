
export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  RENDER: '/api/render',
  GENERATE_UPLOAD_URL: '/api/generate-upload-url',
  PROCESS_VIDEO: '/api/process-video',
} as const;


export const RENDER_CONFIG = {
  FPS: 30,
  DEFAULT_DURATION_SECONDS: 10,
} as const;


export const FILE_CONFIG = {
  MAX_UPLOAD_SIZE_MB: 100,
  API_BODY_SIZE_LIMIT: '10mb',
} as const;


export const CAPTION_STYLES = {
  BOTTOM_CENTERED: 'bottom-centered',
  TOP_BAR: 'top-bar',
  KARAOKE: 'karaoke',
} as const;

export type CaptionStyle = typeof CAPTION_STYLES[keyof typeof CAPTION_STYLES];


export const PATHS = {
  UPLOADS_DIR: 'public/uploads',
  RENDERS_DIR: 'public/renders',
  REMOTION_ENTRY: 'src/remotion/index.tsx',
  COMPOSITION_ID: 'CaptionedVideo',
} as const;


export const ERROR_MESSAGES = {
  METHOD_NOT_ALLOWED: 'Method not allowed',
  MISSING_PARAMETERS: 'Missing required parameters',
  VIDEO_NOT_FOUND: 'Video file not found',
  NO_FILE_UPLOADED: 'No video file uploaded',
  RENDER_FAILED: 'Failed to render video',
  UPLOAD_FAILED: 'Failed to process video',
  SELECT_FILE_FIRST: 'Please select a video file',
  GENERATE_CAPTIONS_FIRST: 'Please generate captions first',
  FFMPEG_NOT_INSTALLED: 'FFmpeg not installed',
  GOOGLE_CLOUD_NOT_CONFIGURED: 'Google Cloud not configured',
  GOOGLE_CLOUD_STORAGE_NOT_CONFIGURED: 'Google Cloud Storage not configured',
} as const;
